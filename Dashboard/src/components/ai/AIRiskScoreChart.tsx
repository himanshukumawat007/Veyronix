import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, ShieldAlert, ShieldCheck } from 'lucide-react';

export interface RiskDataPoint {
  time: string;
  riskScore: number;
  level: string;
  displacement?: number;
}

interface AIRiskScoreChartProps {
  data: RiskDataPoint[];
  currentScore: number;
  currentLevel: 'LOW' | 'MODERATE' | 'HIGH';
  trendDirection: 'STABLE' | 'INCREASING' | 'DECREASING';
  isHigh: boolean;
  isModerate: boolean;
}

// Custom glowing dot for the latest/current point
const CustomCurrentDot = (props: any) => {
  const { cx, cy, stroke, index, dataLength } = props;
  if (index === dataLength - 1) {
    return (
      <g key={`current-dot-${index}`}>
        <circle cx={cx} cy={cy} r={10} fill={stroke} fillOpacity={0.25} className="animate-ping" />
        <circle cx={cx} cy={cy} r={6} fill={stroke} fillOpacity={0.6} />
        <circle cx={cx} cy={cy} r={3.5} fill="#ffffff" stroke={stroke} strokeWidth={2} />
      </g>
    );
  }
  return <circle key={`dot-${index}`} cx={cx} cy={cy} r={2.5} fill={stroke} fillOpacity={0.8} />;
};

export const AIRiskScoreChart: React.FC<AIRiskScoreChartProps> = ({
  data,
  currentScore,
  currentLevel,
  trendDirection,
  isHigh,
  isModerate,
}) => {
  const strokeColor = isHigh ? '#f43f5e' : isModerate ? '#f59e0b' : '#10b981';

  // Determine non-technical situation label
  const situationLabel = isHigh
    ? 'Critical'
    : isModerate
    ? 'Warning'
    : currentScore > 20
    ? 'Watch'
    : 'Normal';

  return (
    <div
      id="ai-risk-score-main-card"
      className="rounded-[2rem] border border-slate-800/80 bg-[#0b1329] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white relative overflow-hidden"
    >
      {/* Background glow accent */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-15"
        style={{
          backgroundColor: strokeColor,
        }}
      />

      {/* Header with Title and Current Value + Trend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: strokeColor }} />
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              AI Risk Score vs Time
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geotechnical hazard probability trajectory (0–100%)
          </p>
        </div>

        {/* Current Risk Value & Trend Badges */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Trend Direction Pill */}
          <div
            id="ai-risk-trend-badge"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${
              trendDirection === 'INCREASING'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : trendDirection === 'DECREASING'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
            }`}
          >
            {trendDirection === 'INCREASING' && <TrendingUp className="h-3.5 w-3.5" />}
            {trendDirection === 'DECREASING' && <TrendingDown className="h-3.5 w-3.5" />}
            {trendDirection === 'STABLE' && <Minus className="h-3.5 w-3.5" />}
            <span>Risk Trend: {trendDirection}</span>
          </div>

          {/* Situation State */}
          <div
            id="ai-risk-situation-badge"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${
              situationLabel === 'Critical'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : situationLabel === 'Warning'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : situationLabel === 'Watch'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {situationLabel === 'Critical' ? (
              <ShieldAlert className="h-3.5 w-3.5" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            <span>Status: {situationLabel}</span>
          </div>

          {/* Current Risk Value Callout */}
          <div className="flex items-baseline gap-1.5 bg-slate-900/90 border border-slate-700/60 rounded-xl px-4 py-1.5 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Current Risk:
            </span>
            <span
              id="ai-risk-current-score-value"
              className="text-xl font-mono font-extrabold"
              style={{ color: strokeColor }}
            >
              {currentScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="mt-6 w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="riskLineGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}%`}
              ticks={[0, 25, 50, 75, 100]}
            />

            {/* Threshold reference lines */}
            <ReferenceLine
              y={75}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{
                value: 'Critical Threshold (75%)',
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            <ReferenceLine
              y={40}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: 'Warning Threshold (40%)',
                fill: '#f59e0b',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as RiskDataPoint;
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-2xl backdrop-blur-md">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1.5 mb-1.5">
                        <span className="font-mono text-slate-400">{pt.time}</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                            pt.riskScore >= 75
                              ? 'bg-rose-500/20 text-rose-300'
                              : pt.riskScore >= 40
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {pt.level}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400">AI Risk Score:</span>
                        <span className="font-mono font-bold text-white text-sm">
                          {pt.riskScore}%
                        </span>
                      </div>
                      {pt.displacement !== undefined && (
                        <div className="flex items-center justify-between gap-4 mt-1 text-[11px] text-slate-400">
                          <span>Slope Displacement:</span>
                          <span className="font-mono text-slate-300">{pt.displacement} mm</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Line
              type="monotone"
              dataKey="riskScore"
              stroke={strokeColor}
              strokeWidth={3}
              dot={(dotProps) => (
                <CustomCurrentDot
                  {...dotProps}
                  stroke={strokeColor}
                  dataLength={data.length}
                />
              )}
              activeDot={{ r: 7, fill: '#ffffff', stroke: strokeColor, strokeWidth: 3 }}
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Quick Insight */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          <span>
            {trendDirection === 'INCREASING'
              ? 'Risk score is trending upward based on accelerating ground displacement.'
              : trendDirection === 'DECREASING'
              ? 'Risk score is declining toward normal baseline thresholds.'
              : 'Risk score is stable with no anomalous acceleration detected.'}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Range: 0% – 100% • Real-time stream active
        </div>
      </div>
    </div>
  );
};
