/**
 * Risk prediction layer.
 *
 * The production design uses an LSTM model trained on fused sensor time-series. That model is not
 * connected in this prototype, so the default implementation is a transparent trend-extrapolation
 * baseline and every result is flagged `simulated: true`.
 *
 * To plug in the real model, set AI_PREDICT_URL to an HTTP endpoint that accepts
 *   POST { zoneId, history: [{ t, score }], thresholds }
 * and returns
 *   { predictedScore: number, confidence: number (0-100), horizonMinutes?: number,
 *     timeline?: [{ minutesAhead, score }], model?: string }
 * The platform falls back to the baseline if the endpoint fails or times out.
 */
import type { Prediction, RiskLevel } from './types';

export interface PredictorInput {
  zoneId: string;
  history: Array<{ t: number; score: number }>;
  currentLevel: RiskLevel;
  thresholds: { warningScore: number; criticalScore: number };
}

const HORIZONS = [15, 30, 60, 120];
const PRIMARY_HORIZON = 60;

function levelFor(score: number, th: { warningScore: number; criticalScore: number }): RiskLevel {
  if (score >= th.criticalScore) return 'CRITICAL';
  if (score >= th.warningScore) return 'WARNING';
  return 'NORMAL';
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Least-squares slope (score per minute) and R² over the recent window. */
function regression(points: Array<{ t: number; score: number }>) {
  const n = points.length;
  if (n < 3) return { slope: 0, r2: 0 };
  const t0 = points[0].t;
  const xs = points.map((p) => (p.t - t0) / 60000);
  const ys = points.map((p) => p.score);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const r2 = sxx === 0 || syy === 0 ? 0 : (sxy * sxy) / (sxx * syy);
  return { slope, r2 };
}

export function baselinePredict(input: PredictorInput): Prediction {
  const { history, thresholds } = input;
  const now = history.length ? history[history.length - 1].t : Date.now();
  const window = history.filter((p) => p.t >= now - 2 * 60000);
  const recent = window.slice(-6);
  const current = recent.length ? recent.reduce((a, p) => a + p.score, 0) / recent.length : 0;
  const { slope, r2 } = regression(window);

  // Damped extrapolation: momentum fades over the horizon, bounded to the 0-99 score range
  const project = (m: number) => clamp(current + clamp(slope * m * (1 / (1 + m / 30)), -35, 35), 1, 99);
  const timeline = HORIZONS.map((m) => {
    const s = Number(project(m).toFixed(1));
    return { minutesAhead: m, score: s, level: levelFor(s, thresholds) };
  });
  const primary = timeline.find((p) => p.minutesAhead === PRIMARY_HORIZON)!;

  const trend: Prediction['trend'] = slope > 0.25 ? 'INCREASING' : slope < -0.25 ? 'DECREASING' : 'STABLE';
  const dataFactor = Math.min(1, window.length / 30);
  const confidence = Math.round(clamp(58 + 30 * r2 * dataFactor + (trend === 'STABLE' ? 8 : 0), 52, 93));

  const explanation =
    trend === 'INCREASING'
      ? `Fused risk score rising ~${slope.toFixed(1)} pts/min over the last few minutes; projected to reach ${primary.level} within ${PRIMARY_HORIZON} min if the trend continues.`
      : trend === 'DECREASING'
      ? 'Fused risk score is falling; ground movement indicators are stabilising.'
      : 'No significant trend in the fused risk score; conditions are expected to remain similar.';

  return {
    zoneId: input.zoneId,
    currentLevel: input.currentLevel,
    currentScore: Number(current.toFixed(1)),
    predictedLevel: primary.level,
    predictedScore: primary.score,
    horizonMinutes: PRIMARY_HORIZON,
    trend,
    confidence,
    timeline,
    history: (() => {
      const recent = history.filter((p) => p.t >= now - 30 * 60000);
      const step = Math.max(1, Math.ceil(recent.length / 120));
      return recent.filter((_, i) => i % step === 0 || i === recent.length - 1).map((p) => ({ t: p.t, score: Number(p.score.toFixed(1)) }));
    })(),
    model: 'Trend-extrapolation baseline (placeholder for LSTM model)',
    simulated: true,
    explanation,
  };
}

export async function predict(input: PredictorInput): Promise<Prediction> {
  const base = baselinePredict(input);
  const url = process.env.AI_PREDICT_URL;
  if (!url) return base;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId: input.zoneId, history: input.history.slice(-240), thresholds: input.thresholds }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return base;
    const data: any = await res.json();
    const ps = Number(data.predictedScore);
    const conf = Number(data.confidence);
    if (!Number.isFinite(ps) || !Number.isFinite(conf)) return base;
    const timeline = Array.isArray(data.timeline)
      ? data.timeline
          .filter((p: any) => Number.isFinite(Number(p.minutesAhead)) && Number.isFinite(Number(p.score)))
          .map((p: any) => ({ minutesAhead: Number(p.minutesAhead), score: Number(p.score), level: levelFor(Number(p.score), input.thresholds) }))
      : base.timeline;
    return {
      ...base,
      predictedScore: clamp(ps, 0, 100),
      predictedLevel: levelFor(ps, input.thresholds),
      confidence: clamp(Math.round(conf), 0, 100),
      horizonMinutes: Number(data.horizonMinutes) || base.horizonMinutes,
      timeline,
      model: String(data.model || 'External AI model (AI_PREDICT_URL)'),
      simulated: false,
      explanation: String(data.explanation || base.explanation),
    };
  } catch {
    return base;
  }
}
