import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

export interface FeatureImportanceItem {
  feature: string;
  importance: number; // e.g. 0 to 1 or 0 to 100
}

interface FeatureImportanceChartProps {
  // If model is connected, actual feature_importances_ from RandomForestClassifier
  modelImportances?: FeatureImportanceItem[] | null;
  isModelConnected: boolean;
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  modelImportances,
  isModelConnected,
}) => {
  // Candidate features specified in requirements:
  // • Displacement
  // • Vibration
  // • Tilt
  // • Rate of Change
  const targetFeatures = ['Displacement', 'Vibration', 'Tilt', 'Rate of Change'];

  const hasActualData =
    isModelConnected &&
    Array.isArray(modelImportances) &&
    modelImportances.length > 0;

  // Build chart dataset strictly consuming actual output when present, or clean 0/standby state without inventing numbers
  const chartData = targetFeatures.map((featName) => {
    if (hasActualData) {
      const match = modelImportances.find(
        (m) => m.feature.toLowerCase() === featName.toLowerCase()
      );
      return {
        feature: featName,
        importance: match ? Number(match.importance.toFixed(3)) : 0,
      };
    }
    return {
      feature: featName,
      importance: 0,
    };
  });

  const barColors = ['#38bdf8', '#818cf8', '#fbbf24', '#34d399'];

  return (
    <div
      id="ai-feature-importance-card"
      className="rounded-[2rem] border border-slate-800/80 bg-[#0b1329] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white font-sans">
              AI Feature Importance
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Contribution of sensor features in Random Forest classification
            </p>
          </div>

          <div>
            {hasActualData ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                <span>Model Live</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
                <Sliders className="h-3 w-3 text-cyan-400" />
                <span>Standby: feature_importances_</span>
              </span>
            )}
          </div>
        </div>

        {/* Chart or Standby View */}
        <div className="mt-4 w-full h-52 sm:h-56 relative">
          {hasActualData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 10, right: 30, left: 35, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 'auto']}
                  stroke="#64748b"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-xl">
                          <div className="font-bold text-white">{item.feature}</div>
                          <div className="text-cyan-300 font-mono mt-0.5">
                            Importance: {item.importance}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col justify-center space-y-3 px-2 py-1">
              {/* Ready-to-consume standby list for Random Forest features */}
              {targetFeatures.map((feature, idx) => (
                <div key={feature} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{feature}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Awaiting model stream
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-700/60 transition-all duration-500"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer explaining consumption rule */}
      <div className="mt-2 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 text-cyan-400" />
          <span>
            {hasActualData
              ? "Values consumed from model's feature_importances_"
              : 'Auto-binds to RandomForestClassifier.feature_importances_'}
          </span>
        </span>
        <span className="font-mono text-slate-500">Random Forest</span>
      </div>
    </div>
  );
};
