/**
 * Multi-sensor fusion — BHU-DRISHTI's false-alarm filter.
 *
 * Each signal is mapped to a 0-100 sub-score using the same bands as the edge ML engine
 * (NORMAL < 32 <= WARNING < 68 <= CRITICAL). An event is only escalated when at least two
 * independent signals are elevated; a single elevated signal is treated as a probable sensor
 * fault and flagged for maintenance instead of raising a public alarm.
 */
import type { FusionResult, RiskLevel } from './types';

export const SIGNAL_LIMITS = {
  tiltDeg: { warn: 3, crit: 6, label: 'Tilt' },
  vibration: { warn: 0.3, crit: 1.0, label: 'Vibration' },
  displacementMm: { warn: 2.5, crit: 7.5, label: 'Displacement' },
  crackMm: { warn: 1.5, crit: 3.0, label: 'Crack width' },
} as const;

const WEIGHTS = { tiltDeg: 0.25, vibration: 0.25, displacementMm: 0.3, crackMm: 0.2 };

export function subScore(value: number, warn: number, crit: number): number {
  const v = Math.max(0, value);
  if (v < warn) return (32 * v) / warn;
  if (v < crit) return 32 + (36 * (v - warn)) / (crit - warn);
  return Math.min(99, 68 + (31 * (v - crit)) / crit);
}

export interface FusionInput {
  tiltDeg: number;
  vibration: number;
  displacementMm: number;
  crackMm: number | null;
}

export function fuse(input: FusionInput, thresholds = { warningScore: 32, criticalScore: 68 }): FusionResult {
  const subs: Array<{ key: keyof typeof SIGNAL_LIMITS; score: number }> = [];
  (Object.keys(SIGNAL_LIMITS) as Array<keyof typeof SIGNAL_LIMITS>).forEach((key) => {
    const value = input[key];
    if (value === null || value === undefined || Number.isNaN(value)) return;
    const lim = SIGNAL_LIMITS[key];
    subs.push({ key, score: subScore(value, lim.warn, lim.crit) });
  });

  const wSum = subs.reduce((a, s) => a + WEIGHTS[s.key], 0) || 1;
  const weighted = subs.reduce((a, s) => a + s.score * WEIGHTS[s.key], 0) / wSum;
  const elevated = subs.filter((s) => s.score >= 32).map((s) => SIGNAL_LIMITS[s.key].label);

  let score = Number(weighted.toFixed(1));
  let status: RiskLevel = 'NORMAL';
  let note = 'All signals within normal limits.';
  let suppressed = false;
  const corroborated = elevated.length >= 2;

  if (elevated.length === 1) {
    suppressed = true;
    score = Math.min(score, thresholds.warningScore - 1);
    note = `Single-sensor anomaly on ${elevated[0].toLowerCase()} — not corroborated by other signals. Flagged for maintenance, no alarm raised.`;
  } else if (corroborated) {
    // Corroborated movement: never report below WARNING
    score = Math.max(score, thresholds.warningScore);
    status = score >= thresholds.criticalScore ? 'CRITICAL' : 'WARNING';
    note = `${elevated.length} correlated signals elevated (${elevated.join(', ')}).`;
  } else if (score >= thresholds.warningScore) {
    status = score >= thresholds.criticalScore ? 'CRITICAL' : 'WARNING';
  }

  return {
    score: Number(score.toFixed(1)),
    status,
    elevatedSignals: elevated,
    corroborated,
    suppressedSingleSensor: suppressed,
    note,
  };
}
