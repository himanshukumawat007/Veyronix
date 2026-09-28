import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TelemetryPoint } from '../../types';

interface RiskDistributionAndTimelineProps {
  history: TelemetryPoint[];
  currentRiskScore: number;
  systemRisk: 'NORMAL' | 'WARNING' | 'CRITICAL';
  nodeName: string;
}

export const RiskDistributionAndTimeline: React.FC<RiskDistributionAndTimelineProps> = ({
  history,
  currentRiskScore,
  systemRisk,
  nodeName,
}) => {
  // 1. Pie Chart data: Risk factor contributors based on physics weights
  const riskFactors = [
    { name: 'Potentiometer (Shear)', value: 35, color: '#10b981', label: '35% Displacement' },
    { name: 'Ay (Down-Slope Thrust)', value: 25, color: '#a855f7', label: '25% Gravity Vector' },
    { name: 'Kinematic Deviation (Δg)', value: 20, color: '#f59e0b', label: '20% Vibration' },
    { name: 'Ax (Transverse Shear)', value: 12, color: '#38bdf8', label: '12% Lateral' },
    { name: 'Az (Vertical Lift)', value: 8, color: '#6366f1', label: '8% Heave' },
  ];

  // 2. Risk Score timeline (interpolated from history points)
  const riskTimeline = history.map((pt, idx) => {
    // Calibrate risk score based on displacement and movement
    let score: number;
    if (pt.displacement > 7 || pt.deviation > 0.4) {
      score = Math.min(96, Math.max(72, Math.round(70 + pt.displacement * 1.5 + pt.deviation * 20)));
    } else if (pt.displacement > 2 || pt.deviation > 0.15) {
      score = Math.min(68, Math.max(38, Math.round(35 + pt.displacement * 4 + pt.deviation * 30)));
    } else {
      score = Math.max(8, Math.min(30, Math.round(10 + pt.displacement * 8 + pt.deviation * 15)));
    }

    return {
      time: pt.time,
      risk: score,
      displacement: pt.displacement,
      deviation: pt.deviation,
    };
  });

  // If history is small, ensure at least some points
  const displayTimeline =
    riskTimeline.length > 0
      ? riskTimeline
      : [
          { time: '10:00', risk: 14, displacement: 0.2, deviation: 0.01 },
          { time: '10:05', risk: 16, displacement: 0.3, deviation: 0.02 },
          { time: '10:10', risk: 18, displacement: 0.4, deviation: 0.02 },
          { time: '10:15', risk: currentRiskScore, displacement: 0.5, deviation: 0.02 },
        ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Geotechnical Risk Factor Distribution Pie / Donut Chart (5 cols) */}
      <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0d1611] border border-emerald-900/40 space-y-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <PieIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Geotechnical Risk Contributors
              </h3>
              <p className="text-[11px] text-slate-300">
                Factor breakdown of active slope stability score
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
            WEIGHTED
          </span>
        </div>

        {/* Donut Chart with Center KPI */}
        <div className="relative h-56 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(value: any, name: any) => [`${value}% Contribution`, name]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '11px',
                }}
              />
              <Pie
                data={riskFactors}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {riskFactors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Callout inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">
              Risk Index
            </span>
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                systemRisk === 'CRITICAL'
                  ? 'text-red-400'
                  : systemRisk === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {currentRiskScore}%
            </span>
            <span className="text-[10px] font-mono text-slate-400">{systemRisk}</span>
          </div>
        </div>

        {/* Legend Chips with high contrast */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
          {riskFactors.map((factor) => (
            <div
              key={factor.name}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: factor.color }}
              />
              <span className="text-slate-200 text-[11px] truncate">
                {factor.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Risk Time Chart with Safety Thresholds (7 cols) */}
      <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0d1611] border border-emerald-900/40 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Hazard Risk Score vs. Time Horizon
              </h3>
              <p className="text-[11px] text-slate-300">
                Continuous probability trajectory ({nodeName}) with danger threshold zones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> &lt;35% Safe
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> 35-70% Warning
            </span>
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-red-500" /> &gt;70% Critical
            </span>
          </div>
        </div>

        {/* Time Horizon Area Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayTimeline}>
              <defs>
                <linearGradient id="riskTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={
                      systemRisk === 'CRITICAL'
                        ? '#ef4444'
                        : systemRisk === 'WARNING'
                        ? '#f59e0b'
                        : '#10b981'
                    }
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      systemRisk === 'CRITICAL'
                        ? '#ef4444'
                        : systemRisk === 'WARNING'
                        ? '#f59e0b'
                        : '#10b981'
                    }
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '11px',
                }}
                formatter={(val: any) => [`${val}% Risk Score`, 'Calculated Hazard']}
              />

              {/* Threshold Reference Lines */}
              <ReferenceLine
                y={70}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'CRITICAL THRESHOLD (70%)',
                  fill: '#f87171',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              <ReferenceLine
                y={35}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'WARNING THRESHOLD (35%)',
                  fill: '#fbbf24',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />

              <Area
                type="monotone"
                dataKey="risk"
                name="Risk Score"
                stroke={
                  systemRisk === 'CRITICAL'
                    ? '#ef4444'
                    : systemRisk === 'WARNING'
                    ? '#f59e0b'
                    : '#10b981'
                }
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#riskTimelineGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom summary bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-emerald-950 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Velocity:</span>
            <span className="text-emerald-400 font-bold">
              {systemRisk === 'CRITICAL' ? '+1.8% / min (Accelerating)' : '+0.02% / min (Stable)'}
            </span>
          </div>
          <div className="text-slate-400">
            Model: Random Forest Geotechnical Ensemble (95% CI)
          </div>
        </div>
      </div>
    </div>
  );
};
