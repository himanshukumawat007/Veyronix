import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, FlaskConical, Sparkles } from 'lucide-react';
import { usePolling } from '../hooks/usePolling';
import { api } from '../services/api';
import { RISK_META, fmtTime } from '../services/format';
import type { Prediction, SensorReading, ZoneView } from '../services/types';
import { PredictionChart, SERIES, TelemetryChart } from './charts';
import { RiskBadge } from './RiskBadge';
import { Button, Pill, Segmented, cx } from './ui';

export const TrendIcon: React.FC<{ trend: Prediction['trend']; className?: string }> = ({ trend, className }) =>
  trend === 'INCREASING' ? (
    <ArrowUpRight className={cx('w-4 h-4 text-risk-critical', className)} aria-hidden />
  ) : trend === 'DECREASING' ? (
    <ArrowDownRight className={cx('w-4 h-4 text-risk-normal', className)} aria-hidden />
  ) : (
    <ArrowRight className={cx('w-4 h-4 text-fg-3', className)} aria-hidden />
  );

export const SimulatedTag: React.FC<{ simulated: boolean }> = ({ simulated }) =>
  simulated ? (
    <Pill className="bg-signal/10 text-signal ring-1 ring-signal/30" title="The LSTM model is not connected yet — this forecast comes from a trend-extrapolation baseline">
      <FlaskConical className="w-3 h-3" aria-hidden /> SIMULATED PREDICTION
    </Pill>
  ) : (
    <Pill className="bg-risk-normal/10 text-risk-normal ring-1 ring-risk-normal/30">MODEL OUTPUT</Pill>
  );

/** Current vs predicted risk, trend, confidence, forecast chart and (optional) AI narrative. */
export const PredictionPanel: React.FC<{ prediction: Prediction; thresholds?: { warningScore: number; criticalScore: number }; showSummary?: boolean; compact?: boolean }> = ({
  prediction: p,
  thresholds,
  showSummary = true,
  compact,
}) => {
  const [summary, setSummary] = useState<{ text: string; source: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const getSummary = async () => {
    setBusy(true);
    setErr(null);
    try {
      const s = await api.getAiSummary(p.zoneId);
      setSummary({ text: s.text, source: s.source });
    } catch (e: any) {
      setErr(e?.message || 'Could not generate summary');
    } finally {
      setBusy(false);
    }
  };
  const predictedLabel = p.predictedLevel === 'CRITICAL' ? 'HIGH' : p.predictedLevel === 'WARNING' ? 'ELEVATED' : 'LOW';
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SimulatedTag simulated={p.simulated} />
        <span className="text-[11px] text-fg-3">{p.model}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="bd-card-2 p-3">
          <div className="text-xs text-fg-3 mb-1.5">Current risk</div>
          <RiskBadge level={p.currentLevel} size="md" />
          <div className="bd-num text-sm text-fg-2 mt-1.5">score {p.currentScore}</div>
        </div>
        <div className="bd-card-2 p-3">
          <div className="text-xs text-fg-3 mb-1.5">Predicted risk</div>
          <span className={cx('text-lg font-bold', RISK_META[p.predictedLevel].text)}>{predictedLabel}</span>
          <div className="bd-num text-sm text-fg-2 mt-0.5">score {p.predictedScore}</div>
        </div>
        <div className="bd-card-2 p-3">
          <div className="text-xs text-fg-3 mb-1.5">Horizon</div>
          <div className="text-lg font-semibold bd-num">{p.horizonMinutes} min</div>
        </div>
        <div className="bd-card-2 p-3">
          <div className="text-xs text-fg-3 mb-1.5">Trend</div>
          <div className="flex items-center gap-1 text-sm font-semibold">
            <TrendIcon trend={p.trend} /> {p.trend.charAt(0) + p.trend.slice(1).toLowerCase()}
          </div>
        </div>
        <div className="bd-card-2 p-3 col-span-2 md:col-span-1">
          <div className="text-xs text-fg-3 mb-1.5">Confidence</div>
          <div className="text-lg font-semibold bd-num">{p.confidence}%</div>
          <div className="h-1.5 rounded bg-ink-600 mt-1.5 overflow-hidden">
            <div className="h-full bg-signal" style={{ width: `${p.confidence}%` }} />
          </div>
        </div>
      </div>
      {!compact && (
        <>
          <div className="mt-4">
            <PredictionChart history={p.history} timeline={p.timeline} warn={thresholds?.warningScore} crit={thresholds?.criticalScore} simulated={p.simulated} />
          </div>
          <div className="flex flex-wrap gap-2 mt-2" aria-label="Prediction timeline">
            {p.timeline.map((t) => (
              <div key={t.minutesAhead} className="bd-card-2 px-3 py-2 text-xs flex items-center gap-2">
                <span className="text-fg-3">+{t.minutesAhead} min</span>
                <RiskBadge level={t.level} size="xs" />
                <span className="bd-num">{t.score}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="text-sm text-fg-2 mt-3">{p.explanation}</p>
      {showSummary && (
        <div className="mt-3">
          <Button size="sm" variant="secondary" onClick={getSummary} busy={busy}>
            <Sparkles className="w-4 h-4" aria-hidden /> Generate situation summary
          </Button>
          {err && <p className="text-xs text-risk-critical mt-2">{err}</p>}
          {summary && (
            <div className="mt-3 rounded-lg border border-white/10 bg-ink-900/60 p-3">
              <p className="text-sm text-fg">{summary.text}</p>
              <p className="text-[11px] text-fg-3 mt-2">Source: {summary.source}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Mine (site) + zone selector bound to the caller's state. */
export const ZoneSelector: React.FC<{ zones: ZoneView[]; value: string | null; onChange: (id: string) => void }> = ({ zones, value, onChange }) => {
  const sites = useMemo(() => Array.from(new Set(zones.map((z) => z.siteName))), [zones]);
  const current = zones.find((z) => z.id === value) || zones[0];
  const site = current?.siteName;
  const inSite = zones.filter((z) => z.siteName === site);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs text-fg-3" htmlFor="site-sel">Mine site</label>
      <select
        id="site-sel"
        value={site || ''}
        onChange={(e) => {
          const first = zones.find((z) => z.siteName === e.target.value);
          if (first) onChange(first.id);
        }}
        className="bg-ink-800 border border-white/10 rounded-lg px-3 py-2 text-sm max-w-[260px]"
      >
        {sites.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <label className="text-xs text-fg-3" htmlFor="zone-sel">Zone</label>
      <select id="zone-sel" value={current?.id || ''} onChange={(e) => onChange(e.target.value)} className="bg-ink-800 border border-white/10 rounded-lg px-3 py-2 text-sm">
        {inSite.map((z) => (
          <option key={z.id} value={z.id}>
            {z.name} — {RISK_META[z.status].label}
          </option>
        ))}
      </select>
    </div>
  );
};

export const RANGES = [
  { value: '15', label: '15 min' },
  { value: '60', label: '1 h' },
  { value: '120', label: '2 h' },
] as const;

/** Poll per-node telemetry for a zone and merge into chart rows keyed by timestamp. */
export function useZoneTelemetry(nodeIds: string[], rangeMin: number) {
  const key = nodeIds.join(',');
  const res = usePolling(
    async (signal) => {
      const all = await Promise.all(nodeIds.map((id) => api.getTelemetry(id, rangeMin, signal).then((r) => ({ id, points: r.points }))));
      return all;
    },
    [key, rangeMin],
    4000,
    nodeIds.length > 0,
  );
  const merged = useMemo(() => {
    const byT = new Map<number, Record<string, number | null>>();
    for (const s of res.data || []) {
      for (const p of s.points as SensorReading[]) {
        const t = Math.round(p.t / 1000) * 1000;
        const row = byT.get(t) || { t };
        row[`${s.id}__tilt`] = p.tiltDeg;
        row[`${s.id}__vib`] = p.vibration;
        row[`${s.id}__disp`] = p.displacementMm;
        row[`${s.id}__crack`] = p.crackMm;
        row[`${s.id}__risk`] = p.riskScore;
        byT.set(t, row);
      }
    }
    return Array.from(byT.values()).sort((a, b) => (a.t as number) - (b.t as number));
  }, [res.data]);
  return { rows: merged, loading: res.loading, error: res.error, updatedAt: res.updatedAt };
}

export const ZoneTelemetryCharts: React.FC<{ nodeIds: string[]; showCrack?: boolean; height?: number }> = ({ nodeIds, showCrack = true, height = 200 }) => {
  const [range, setRange] = useState<'15' | '60' | '120'>('15');
  const { rows, loading, error } = useZoneTelemetry(nodeIds, Number(range));
  const series = (suffix: string) => nodeIds.map((id, i) => ({ key: `${id}__${suffix}`, name: id, color: SERIES[i % SERIES.length] }));
  const charts = [
    { title: 'Tilt over time', unit: '°', s: 'tilt', warn: 3, crit: 6, digits: 2 },
    { title: 'Vibration over time', unit: 'm/s²', s: 'vib', warn: 0.3, crit: 1.0, digits: 3 },
    { title: 'Displacement over time', unit: 'mm', s: 'disp', warn: 2.5, crit: 7.5, digits: 2 },
    ...(showCrack ? [{ title: 'Crack width over time', unit: 'mm', s: 'crack', warn: 1.5, crit: 3.0, digits: 2 }] : []),
    { title: 'Risk score over time', unit: '', s: 'risk', warn: 32, crit: 68, digits: 1 },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Segmented ariaLabel="Time range" value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r.value, label: r.label }))} />
        {loading && <span className="text-xs text-fg-3">Loading…</span>}
        {error && <span className="text-xs text-risk-critical">{error}</span>}
        <span className="text-[11px] text-fg-3 ml-auto">Dashed lines = warning / critical thresholds</span>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {charts.map((c) => (
          <div key={c.s} className="bd-card-2 p-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold">{c.title}</h3>
              {c.unit && <span className="text-[11px] text-fg-3">{c.unit}</span>}
            </div>
            <TelemetryChart data={rows} series={series(c.s)} unit={c.unit} warn={c.warn} crit={c.crit} digits={c.digits} height={height} ariaLabel={c.title} yMax={c.s === 'risk' ? 100 : undefined} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const RiskDistribution: React.FC<{ counts: { NORMAL: number; WARNING: number; CRITICAL: number; OFFLINE: number } }> = ({ counts }) => {
  const total = Math.max(1, counts.NORMAL + counts.WARNING + counts.CRITICAL + counts.OFFLINE);
  const levels = ['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'] as const;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-[2px] bg-ink-900" role="img" aria-label={levels.map((l) => `${RISK_META[l].label} ${counts[l]}`).join(', ')}>
        {levels.map((l) =>
          counts[l] ? <div key={l} style={{ width: `${(counts[l] / total) * 100}%`, background: RISK_META[l].color }} /> : null,
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {levels.map((l) => (
          <div key={l} className="bd-card-2 p-2.5">
            <RiskBadge level={l} size="xs" />
            <div className="bd-num text-xl font-semibold mt-1.5">{counts[l]}</div>
            <div className="text-[11px] text-fg-3">{Math.round((counts[l] / total) * 100)}% of zones</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AlertsTable: React.FC<{
  alerts: Array<{ id: string; severity: 'WARNING' | 'CRITICAL'; zoneLabel: string; detectedAt: number; peakRiskScore: number; status: string }>;
  onAck?: (id: string) => void;
  busy?: string | null;
  viewBase: string;
  zoneIdOf: (id: string) => string;
}> = ({ alerts, onAck, busy, viewBase, zoneIdOf }) => (
  <div className="overflow-x-auto -mx-4 sm:mx-0">
    <table className="w-full text-sm min-w-[640px]">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wider text-fg-3 border-b bd-hairline">
          <th className="py-2 px-4 sm:px-3">Severity</th>
          <th className="py-2 px-3">Location</th>
          <th className="py-2 px-3">Time</th>
          <th className="py-2 px-3 text-right">Risk</th>
          <th className="py-2 px-3">Status</th>
          <th className="py-2 px-3 text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {alerts.map((a) => (
          <tr key={a.id} className="border-b bd-hairline">
            <td className="py-2.5 px-4 sm:px-3"><RiskBadge level={a.severity} size="xs" pulse={a.status === 'ACTIVE'} /></td>
            <td className="py-2.5 px-3">
              <Link to={`${viewBase}/${zoneIdOf(a.id)}`} className="hover:underline">{a.zoneLabel}</Link>
              <div className="text-[11px] text-fg-3 bd-num">#{a.id}</div>
            </td>
            <td className="py-2.5 px-3 bd-num">{fmtTime(a.detectedAt)}</td>
            <td className="py-2.5 px-3 text-right bd-num">{a.peakRiskScore}</td>
            <td className="py-2.5 px-3 text-xs font-semibold">{a.status}</td>
            <td className="py-2.5 px-3 text-right">
              {onAck && a.status === 'ACTIVE' ? (
                <Button size="sm" variant="primary" onClick={() => onAck(a.id)} busy={busy === `ack:${a.id}`}>Acknowledge</Button>
              ) : (
                <span className="text-xs text-fg-3">—</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
