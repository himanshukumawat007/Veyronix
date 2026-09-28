import React, { memo, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtTime, fmtTimeSec } from '../services/format';

// recharts v3 types omit SVG fill props on ReferenceArea; they are still passed through at runtime
const Band = ReferenceArea as unknown as React.FC<Record<string, unknown>>;

/** Categorical node palette — validated for CVD + contrast on the dark surface; never status colours. */
export const SERIES = ['#3987e5', '#d55181', '#9085e9', '#199e70'];
const GRID = 'rgba(255,255,255,0.06)';
const AXIS = { fontSize: 11, fill: '#8594a6' };

const TooltipBox: React.FC<any> = ({ active, payload, label, unit, digits = 2 }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-850/95 px-3 py-2 text-xs shadow-xl">
      <div className="text-fg-3 mb-1 bd-num">{fmtTimeSec(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-fg">
          <span className="w-2.5 h-0.5 rounded" style={{ background: p.color }} aria-hidden />
          <span className="text-fg-2">{p.name}</span>
          <span className="ml-auto bd-num font-semibold pl-3">
            {typeof p.value === 'number' ? p.value.toFixed(digits) : '—'}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export interface SeriesDef {
  key: string;
  name: string;
  color?: string;
}

/**
 * Time-series chart for one physical quantity (one unit, one axis). Warning/critical thresholds
 * are drawn as labelled reference lines in the reserved status colours.
 */
export const TelemetryChart: React.FC<{
  data: Array<Record<string, number | null>>;
  series: SeriesDef[];
  unit?: string;
  height?: number;
  warn?: number;
  crit?: number;
  digits?: number;
  yMax?: number;
  ariaLabel?: string;
}> = memo(({ data, series, unit, height = 220, warn, crit, digits = 2, yMax, ariaLabel }) => {
  const domainMax = useMemo(() => {
    let m = 0;
    for (const d of data) for (const s of series) m = Math.max(m, Number(d[s.key]) || 0);
    return yMax ?? Math.max(m * 1.15, crit ? crit * 1.1 : 0, 0.1);
  }, [data, series, crit, yMax]);
  if (!data.length) return <div className="text-xs text-fg-3 py-10 text-center">No data in this time range.</div>;
  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(v) => fmtTime(v)} tick={AXIS} stroke={GRID} minTickGap={40} />
          <YAxis tick={AXIS} stroke={GRID} width={48} domain={[0, Number(domainMax.toFixed(2))]} tickFormatter={(v) => `${v}`} />
          {warn !== undefined && <ReferenceLine y={warn} stroke="#f5a524" strokeDasharray="4 4" label={{ value: 'Warning', position: 'insideTopRight', fill: '#f5a524', fontSize: 10 }} />}
          {crit !== undefined && <ReferenceLine y={crit} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />}
          <Tooltip content={<TooltipBox unit={unit} digits={digits} />} cursor={{ stroke: 'rgba(255,255,255,0.25)' }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#b3bfcc' }} iconType="plainline" />}
          {series.map((s, i) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color || SERIES[i % SERIES.length]} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

/** Fused risk score over time with status bands. */
export const RiskScoreChart: React.FC<{ data: Array<{ t: number; score: number }>; warn?: number; crit?: number; height?: number; color?: string }> = memo(
  ({ data, warn = 32, crit = 68, height = 200, color = '#4ea1ff' }) => {
    if (!data.length) return <div className="text-xs text-fg-3 py-10 text-center">No data yet.</div>;
    return (
      <div style={{ height }} role="img" aria-label="Fused risk score over time">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Band y1={crit} y2={100} fill="#ef4444" fillOpacity={0.06} />
            <Band y1={warn} y2={crit} fill="#f5a524" fillOpacity={0.05} />
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(v) => fmtTime(v)} tick={AXIS} stroke={GRID} minTickGap={40} />
            <YAxis domain={[0, 100]} tick={AXIS} stroke={GRID} width={40} ticks={[0, warn, crit, 100]} />
            <ReferenceLine y={warn} stroke="#f5a524" strokeDasharray="4 4" />
            <ReferenceLine y={crit} stroke="#ef4444" strokeDasharray="4 4" />
            <Tooltip content={<TooltipBox digits={1} />} cursor={{ stroke: 'rgba(255,255,255,0.25)' }} />
            <Area type="monotone" dataKey="score" name="Risk score" stroke={color} strokeWidth={2} fill="url(#riskFill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  },
);

/** History + forecast on one risk-score axis. Forecast is drawn dashed and labelled. */
export const PredictionChart: React.FC<{
  history: Array<{ t: number; score: number }>;
  timeline: Array<{ minutesAhead: number; score: number }>;
  warn?: number;
  crit?: number;
  height?: number;
  simulated?: boolean;
}> = memo(({ history, timeline, warn = 32, crit = 68, height = 240, simulated }) => {
  const data = useMemo(() => {
    const now = history.length ? history[history.length - 1].t : Date.now();
    const recent = history.filter((p) => p.t >= now - 30 * 60000);
    const step = Math.max(1, Math.ceil(recent.length / 90));
    const sampled = recent.filter((_, i) => i % step === 0 || i === recent.length - 1);
    const hist = sampled.map((p) => ({ t: p.t, observed: p.score, forecast: null as number | null }));
    if (hist.length) hist[hist.length - 1].forecast = hist[hist.length - 1].observed;
    const fut = timeline.filter((p) => p.minutesAhead <= 60).map((p) => ({ t: now + p.minutesAhead * 60000, observed: null as number | null, forecast: p.score }));
    return [...hist, ...fut];
  }, [history, timeline]);
  const nowT = history.length ? history[history.length - 1].t : undefined;
  return (
    <div style={{ height }} role="img" aria-label="Observed risk score and forecast">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <Band y1={crit} y2={100} fill="#ef4444" fillOpacity={0.06} />
          <Band y1={warn} y2={crit} fill="#f5a524" fillOpacity={0.05} />
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={(v) => fmtTime(v)} tick={AXIS} stroke={GRID} minTickGap={40} />
          <YAxis domain={[0, 100]} tick={AXIS} stroke={GRID} width={40} ticks={[0, warn, crit, 100]} />
          {nowT && <ReferenceLine x={nowT} stroke="rgba(255,255,255,0.35)" label={{ value: 'Now', position: 'insideTopLeft', fill: '#b3bfcc', fontSize: 10 }} />}
          <Tooltip content={<TooltipBox digits={1} />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#b3bfcc' }} iconType="plainline" />
          <Line dataKey="observed" name="Observed risk" stroke="#4ea1ff" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
          <Line
            dataKey="forecast"
            name={simulated ? 'Forecast (simulated)' : 'Forecast'}
            stroke="#e6edf3"
            strokeWidth={2}
            strokeDasharray="6 5"
            dot={{ r: 4, fill: '#121821', stroke: '#e6edf3', strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
