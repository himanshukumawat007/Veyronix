import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Clock,
  Database,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';

interface HistoricalPoint {
  rawTimestamp: string;
  time: string;
  riskScore: number;
  status: string;
  displacement: number;
  isSynthetic: boolean;
}

export const HistoricalDataChart: React.FC = () => {
  const { nodes, stats, lastSyncTime } = useMonitoring();
  const [range, setRange] = useState<'5m' | '30m' | '1h' | '6h' | '24h'>('30m');
  const [remoteData, setRemoteData] = useState<HistoricalPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataSourceLabel, setDataSourceLabel] = useState<string>('Loading...');
  const [isSyntheticData, setIsSyntheticData] = useState<boolean>(false);

  // Fetch real/synthetic historical telemetry from existing PostgreSQL / telemetry API
  const fetchHistoricalData = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/sensors/history?range=${range}&limit=60`);
      if (resp.ok) {
        const json = await resp.json();
        const records = json.data || [];
        if (records.length > 0) {
          const parsed: HistoricalPoint[] = records.map((r: any) => {
            const dateObj = new Date(r.timestamp);
            const timeStr = isNaN(dateObj.getTime())
              ? r.timestamp
              : dateObj.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                });

            return {
              rawTimestamp: r.timestamp,
              time: timeStr,
              riskScore: Number(Number(r.risk_score || 0).toFixed(1)),
              status: r.risk_status || 'NORMAL',
              displacement: Number(Number(r.displacement_mm || 0).toFixed(2)),
              isSynthetic: Boolean(r.is_synthetic),
            };
          });

          // Sort chronologically ascending for the time-series graph
          parsed.sort(
            (a, b) =>
              new Date(a.rawTimestamp).getTime() - new Date(b.rawTimestamp).getTime()
          );

          setRemoteData(parsed);
          const hasSynthetic = parsed.some((p) => p.isSynthetic);
          setIsSyntheticData(hasSynthetic);
          setDataSourceLabel(
            hasSynthetic
              ? 'Synthetic / Demo Historical Telemetry'
              : 'PostgreSQL Time-Series DB'
          );
          return;
        }
      }
    } catch {
      // Fallback to local node history
    } finally {
      setIsLoading(false);
    }

    // Fallback: derive from active sensor node history
    const primaryNode =
      nodes.find((n) => n.status === 'CRITICAL') ||
      nodes.find((n) => n.status === 'WARNING') ||
      nodes[0];

    const fallbackPoints: HistoricalPoint[] = (primaryNode?.history || []).map((pt, idx) => {
      let calcScore: number;
      if (pt.displacement > 8 || pt.movement > 70) {
        calcScore = Math.min(96, Math.max(76, Math.round(75 + pt.displacement * 1.2 + (pt.movement / 100) * 10)));
      } else if (pt.displacement > 2.5 || pt.movement > 35) {
        calcScore = Math.min(74, Math.max(38, Math.round(35 + pt.displacement * 4.5 + (pt.movement / 100) * 15)));
      } else {
        calcScore = Math.max(8, Math.min(28, Math.round(10 + pt.displacement * 6 + (pt.movement / 100) * 8)));
      }

      return {
        rawTimestamp: new Date(Date.now() - (30 - idx) * 30000).toISOString(),
        time: pt.time,
        riskScore: calcScore,
        status: calcScore >= 75 ? 'CRITICAL' : calcScore >= 40 ? 'WARNING' : 'NORMAL',
        displacement: pt.displacement,
        isSynthetic: true,
      };
    });

    setRemoteData(fallbackPoints);
    setIsSyntheticData(true);
    setDataSourceLabel('Synthetic / Demo Telemetry (Edge Buffer)');
  };

  useEffect(() => {
    fetchHistoricalData();
    const interval = setInterval(fetchHistoricalData, 8000);
    return () => clearInterval(interval);
  }, [range, lastSyncTime]);

  // Key metrics calculation
  const metrics = useMemo(() => {
    if (remoteData.length === 0) {
      return { min: 0, max: 0, avg: 0, latest: 0, delta: 0, trend: 'STABLE' };
    }
    const scores = remoteData.map((d) => d.riskScore);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
    const latest = scores[scores.length - 1];
    const initial = scores[0];
    const delta = Number((latest - initial).toFixed(1));
    const trend = delta > 3 ? 'INCREASING' : delta < -3 ? 'DECREASING' : 'STABLE';
    return { min, max, avg, latest, delta, trend };
  }, [remoteData]);

  return (
    <section
      id="historical-data-section"
      className="p-5 sm:p-6 rounded-2xl bg-[#0e1611] border border-emerald-900/40 shadow-sm space-y-5"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-950/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase font-sans">
              HISTORICAL DATA
            </h2>
            <span
              id="historical-data-source-pill"
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                isSyntheticData
                  ? 'bg-amber-950/60 border-amber-800/80 text-amber-300'
                  : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300'
              }`}
            >
              <Database className="h-3 w-3" />
              <span>{dataSourceLabel}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Time-series historical movement of AI geotechnical risk score over time
          </p>
        </div>

        {/* Range Selector & Manual Refresh */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-800">
            {(['5m', '30m', '1h', '6h', '24h'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg transition-colors cursor-pointer ${
                  range === r
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={fetchHistoricalData}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Historical Data"
            aria-label="Refresh Historical Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Current Risk
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-lg font-bold font-mono ${
                metrics.latest >= 75
                  ? 'text-red-400'
                  : metrics.latest >= 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {metrics.latest}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {metrics.latest >= 75 ? 'Critical' : metrics.latest >= 40 ? 'Warning' : 'Normal'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Trajectory Trend
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {metrics.trend === 'INCREASING' && (
              <>
                <TrendingUp className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-bold text-rose-300 font-mono">Increasing</span>
              </>
            )}
            {metrics.trend === 'DECREASING' && (
              <>
                <TrendingDown className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 font-mono">Decreasing</span>
              </>
            )}
            {metrics.trend === 'STABLE' && (
              <>
                <Minus className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300 font-mono">Stable</span>
              </>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Historical Average
          </span>
          <span className="text-lg font-bold font-mono text-slate-200 mt-0.5 block">
            {metrics.avg}%
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Peak Hazard
          </span>
          <span className="text-lg font-bold font-mono text-slate-200 mt-0.5 block">
            {metrics.max}%
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Logged Samples
          </span>
          <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
            {remoteData.length} records
          </span>
        </div>
      </div>

      {/* Primary Historical Time-Series Graph */}
      <div className="rounded-xl border border-slate-800 bg-[#080d0a] p-4 sm:p-5 relative">
        {/* Axis Titles & Metadata */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">Y-Axis: Risk Score (0–100%)</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">Thresholds: 40% Warning / 75% Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-500" />
            <span className="font-semibold text-emerald-400">X-Axis: Timestamp</span>
          </div>
        </div>

        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={remoteData}
              margin={{ top: 12, right: 16, left: -18, bottom: 4 }}
            >
              <defs>
                <linearGradient id="historicalGreenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#1b251e" strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
                tickLine={false}
                axisLine={{ stroke: '#223326' }}
              />

              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
                tickLine={false}
                axisLine={{ stroke: '#223326' }}
                tickFormatter={(v) => `${v}%`}
                ticks={[0, 20, 40, 60, 80, 100]}
              />

              {/* Geotechnical Threshold Reference Lines */}
              <ReferenceLine
                y={75}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'CRITICAL (75%)',
                  fill: '#f43f5e',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  position: 'insideTopRight',
                }}
              />
              <ReferenceLine
                y={40}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'WARNING (40%)',
                  fill: '#f59e0b',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  position: 'insideTopRight',
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as HistoricalPoint;
                    return (
                      <div className="p-3 bg-slate-950/95 border border-emerald-800/80 rounded-xl shadow-xl font-mono text-xs backdrop-blur-md space-y-1">
                        <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                          {data.rawTimestamp}
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1">
                          <span className="text-slate-300">Risk Score:</span>
                          <span
                            className={`font-bold ${
                              data.riskScore >= 75
                                ? 'text-red-400'
                                : data.riskScore >= 40
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {data.riskScore}% ({data.status})
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400">Displacement:</span>
                          <span className="text-white font-semibold">
                            {data.displacement} mm
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[10px]">
                          <span className="text-slate-500">Source:</span>
                          <span className="text-emerald-400">
                            {data.isSynthetic ? 'Synthetic / Demo' : 'PostgreSQL Live'}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="riskScore"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#historicalGreenGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: '#10b981',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
