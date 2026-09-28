import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, MoveRight } from 'lucide-react';

interface GroundMovementDataPoint {
  time: string;
  displacement: number;
}

interface GroundMovementChartProps {
  data: GroundMovementDataPoint[];
  currentDisplacement: number;
  trendDirection: 'STABLE' | 'INCREASING' | 'DECREASING';
}

const CustomCurrentDot = (props: any) => {
  const { cx, cy, stroke, index, dataLength } = props;
  if (index === dataLength - 1) {
    return (
      <g key={`current-disp-dot-${index}`}>
        <circle cx={cx} cy={cy} r={8} fill={stroke} fillOpacity={0.25} className="animate-ping" />
        <circle cx={cx} cy={cy} r={5} fill={stroke} fillOpacity={0.7} />
        <circle cx={cx} cy={cy} r={2.5} fill="#ffffff" stroke={stroke} strokeWidth={2} />
      </g>
    );
  }
  return <circle key={`disp-dot-${index}`} cx={cx} cy={cy} r={2} fill={stroke} fillOpacity={0.7} />;
};

export const GroundMovementChart: React.FC<GroundMovementChartProps> = ({
  data,
  currentDisplacement,
  trendDirection,
}) => {
  const strokeColor =
    trendDirection === 'INCREASING'
      ? '#f43f5e'
      : trendDirection === 'DECREASING'
      ? '#10b981'
      : '#38bdf8';

  return (
    <div
      id="ground-movement-trend-card"
      className="rounded-[2rem] border border-slate-800/80 bg-[#0b1329] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white font-sans">
              Ground Movement Trend
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous displacement tracking over time
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Trend Direction Badge */}
            <div
              id="ground-movement-trend-badge"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                trendDirection === 'INCREASING'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : trendDirection === 'DECREASING'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
              }`}
            >
              {trendDirection === 'INCREASING' && <TrendingUp className="h-3 w-3" />}
              {trendDirection === 'DECREASING' && <TrendingDown className="h-3 w-3" />}
              {trendDirection === 'STABLE' && <Minus className="h-3 w-3" />}
              <span>{trendDirection}</span>
            </div>

            {/* Current Reading */}
            <div className="bg-slate-900/90 border border-slate-700/60 px-3 py-1 rounded-xl flex items-baseline gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Reading:</span>
              <span className="font-mono font-bold text-sm text-cyan-300">
                {currentDisplacement.toFixed(2)} mm
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mt-4 w-full h-52 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={10}
                fontFamily="monospace"
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                fontFamily="monospace"
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(v) => `${v}mm`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value as number;
                    const time = payload[0].payload?.time;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-xl">
                        <div className="text-slate-400 font-mono text-[10px]">{time}</div>
                        <div className="font-bold text-white mt-0.5">
                          Displacement: <span className="font-mono text-cyan-300">{val} mm</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="displacement"
                stroke={strokeColor}
                strokeWidth={2.5}
                dot={(dotProps) => (
                  <CustomCurrentDot
                    {...dotProps}
                    stroke={strokeColor}
                    dataLength={data.length}
                  />
                )}
                activeDot={{ r: 6, fill: '#ffffff', stroke: strokeColor, strokeWidth: 2.5 }}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <MoveRight className="h-3 w-3 text-cyan-400" />
          <span>Status: Ground movement is {trendDirection.toLowerCase()}</span>
        </span>
        <span className="font-mono text-slate-500">Axis: Displacement (mm)</span>
      </div>
    </div>
  );
};
