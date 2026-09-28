import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Activity, Radio } from 'lucide-react';

export interface SensorTrendPoint {
  time: string;
  displacement: number; // mm
  vibration: number; // movement index 0-100 or acceleration index
  tilt: number; // degrees
}

interface SensorTrendChartProps {
  data: SensorTrendPoint[];
  latestReading?: {
    displacement: number;
    vibration: number;
    tilt: number;
  };
}

export const SensorTrendChart: React.FC<SensorTrendChartProps> = ({ data, latestReading }) => {
  const [visibleParams, setVisibleParams] = useState({
    displacement: true,
    vibration: true,
    tilt: true,
  });

  const toggleParam = (key: keyof typeof visibleParams) => {
    setVisibleParams((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const latestDisp =
    latestReading?.displacement ?? (data.length > 0 ? data[data.length - 1].displacement : 0);
  const latestVib =
    latestReading?.vibration ?? (data.length > 0 ? data[data.length - 1].vibration : 0);
  const latestTilt =
    latestReading?.tilt ?? (data.length > 0 ? data[data.length - 1].tilt : 0);

  return (
    <div
      id="sensor-trend-card"
      className="rounded-[2rem] border border-slate-800/80 bg-[#0b1329] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xl font-bold tracking-tight text-white font-sans">
              Sensor Trend Graph
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-parameter telemetry stream driving the AI prediction engine
          </p>
        </div>

        {/* Interactive Clear Legend with live readings */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Displacement Legend */}
          <button
            id="legend-toggle-displacement"
            type="button"
            onClick={() => toggleParam('displacement')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              visibleParams.displacement
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Displacement:</span>
            <span className="font-mono font-bold">{latestDisp.toFixed(2)} mm</span>
          </button>

          {/* Vibration Legend */}
          <button
            id="legend-toggle-vibration"
            type="button"
            onClick={() => toggleParam('vibration')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              visibleParams.vibration
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Vibration:</span>
            <span className="font-mono font-bold">{Math.round(latestVib)} idx</span>
          </button>

          {/* Tilt Legend */}
          <button
            id="legend-toggle-tilt"
            type="button"
            onClick={() => toggleParam('tilt')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              visibleParams.tilt
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span>Tilt:</span>
            <span className="font-mono font-bold">{latestTilt.toFixed(1)}°</span>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6 w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
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
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as SensorTrendPoint;
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-2xl backdrop-blur-md min-w-[170px]">
                      <div className="font-mono text-slate-400 text-[10px] border-b border-slate-800 pb-1 mb-2">
                        Time: {pt.time}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-cyan-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span>Displacement:</span>
                          </span>
                          <span className="font-mono font-bold">{pt.displacement} mm</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span>Vibration:</span>
                          </span>
                          <span className="font-mono font-bold">{pt.vibration}</span>
                        </div>
                        <div className="flex items-center justify-between text-purple-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            <span>Tilt:</span>
                          </span>
                          <span className="font-mono font-bold">{pt.tilt}°</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {visibleParams.displacement && (
              <Line
                type="monotone"
                dataKey="displacement"
                name="Displacement (mm)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#38bdf8' }}
                activeDot={{ r: 6, stroke: '#38bdf8', strokeWidth: 2, fill: '#ffffff' }}
                animationDuration={500}
              />
            )}

            {visibleParams.vibration && (
              <Line
                type="monotone"
                dataKey="vibration"
                name="Vibration (Index)"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 2, fill: '#f59e0b' }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                animationDuration={500}
              />
            )}

            {visibleParams.tilt && (
              <Line
                type="monotone"
                dataKey="tilt"
                name="Tilt (°)"
                stroke="#c084fc"
                strokeWidth={2}
                dot={{ r: 2, fill: '#c084fc' }}
                activeDot={{ r: 6, stroke: '#c084fc', strokeWidth: 2, fill: '#ffffff' }}
                animationDuration={500}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          <span>Synchronized LoRa telemetry across MPU6050 & displacement potentiometers</span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Click legend items to toggle parameters
        </div>
      </div>
    </div>
  );
};
