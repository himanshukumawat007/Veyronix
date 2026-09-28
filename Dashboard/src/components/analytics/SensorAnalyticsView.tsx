import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Download,
  Send,
  Radio,
  Sliders,
  RefreshCw,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';

export const SensorAnalyticsView: React.FC = () => {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    ingestTestPacket,
    dataSourceMode,
  } = useMonitoring();

  const [timeRange, setTimeRange] = useState<'5m' | '30m' | '1h' | '6h' | '24h'>('30m');

  // Manual test packet inputs
  const [testAx, setTestAx] = useState<number>(0.25);
  const [testAy, setTestAy] = useState<number>(0.3);
  const [testAz, setTestAz] = useState<number>(9.75);
  const [testPot, setTestPot] = useState<number>(85);
  const [isSending, setIsSending] = useState<boolean>(false);

  const history = selectedNode?.history || [];

  // Summary statistics calculation
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const axVals = history.map((h) => h.ax);
    const ayVals = history.map((h) => h.ay);
    const azVals = history.map((h) => h.az);
    const potVals = history.map((h) => h.pot);
    const dispVals = history.map((h) => h.displacement);

    const calc = (arr: number[]) => {
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      return { min: min.toFixed(2), max: max.toFixed(2), mean: mean.toFixed(2) };
    };

    return {
      ax: calc(axVals),
      ay: calc(ayVals),
      az: calc(azVals),
      pot: calc(potVals),
      disp: calc(dispVals),
    };
  }, [history]);

  const handleSendTest = async () => {
    setIsSending(true);
    try {
      await ingestTestPacket(testAx, testAy, testAz, testPot);
    } finally {
      setIsSending(false);
    }
  };

  const handleExportCsv = () => {
    if (history.length === 0) return;
    const headers = 'timestamp,time,ax,ay,az,pot,displacement_mm,magnitude,deviation\n';
    const rows = history
      .map(
        (h) =>
          `${h.timestamp || ''},${h.time},${h.ax},${h.ay},${h.az},${h.pot},${h.displacement},${h.magnitude},${h.deviation}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhu_drishti_${selectedNodeId || 'node'}_telemetry.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="sensor-analytics-view" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header bar: Node and Time filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            High-Resolution Sensor Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Raw MPU6050 3-axis accelerometer, potentiometer displacement & derived kinematics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Node Selector */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-mono">
            {nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  selectedNodeId === node.id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {node.name}
              </button>
            ))}
          </div>

          {/* Time range selector */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-mono">
            {(['5m', '30m', '1h', '6h', '24h'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                  timeRange === r
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-300 text-xs font-medium cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Statistical Summary Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-[#0e1611] border border-emerald-900/40 text-xs font-mono">
            <span className="text-slate-400 block mb-1">Ax Mean / Max</span>
            <span className="text-sm font-bold text-sky-400">
              {stats.ax.mean} / {stats.ax.max} m/s²
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0e1611] border border-emerald-900/40 text-xs font-mono">
            <span className="text-slate-400 block mb-1">Ay Mean / Max</span>
            <span className="text-sm font-bold text-purple-400">
              {stats.ay.mean} / {stats.ay.max} m/s²
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0e1611] border border-emerald-900/40 text-xs font-mono">
            <span className="text-slate-400 block mb-1">Az Mean / Min</span>
            <span className="text-sm font-bold text-emerald-400">
              {stats.az.mean} / {stats.az.min} m/s²
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0e1611] border border-emerald-900/40 text-xs font-mono">
            <span className="text-slate-400 block mb-1">Potentiometer ADC</span>
            <span className="text-sm font-bold text-amber-400">
              {stats.pot.mean} (Max: {stats.pot.max})
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0e1611] border border-emerald-900/40 text-xs font-mono">
            <span className="text-slate-400 block mb-1">Displacement Mean</span>
            <span className="text-sm font-bold text-white">
              {stats.disp.mean} mm
            </span>
          </div>
        </div>
      )}

      {/* Main Charts */}
      <div className="space-y-6">
        {/* Accelerometer Multi-Line Chart */}
        <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">
              MPU6050 3-Axis Accelerometer (m/s²)
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Sampling interval: 2.5s
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[-2, 12]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="ax"
                  name="Ax (Transverse)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ay"
                  name="Ay (Longitudinal/Slope)"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="az"
                  name="Az (Vertical Gravity)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Potentiometer Physical Shear Displacement Chart */}
        <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Potentiometer Physical Displacement & Raw ADC
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Formula: (pot / 1023) × 50mm
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="potGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 20]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="displacement"
                  name="Displacement (mm)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#potGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Ingestion Simulator (Test Packet Injector) */}
      <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Interactive Telemetry Injector (Test Payload Generator)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Posts to POST /api/telemetry/ingest
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Inject a custom sensor payload to verify how the Random Forest ML classifier,
          Raspberry Pi alarm thresholds, and Grafana stream react to sudden kinematic spikes.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Ax ({testAx} m/s²)
            </label>
            <input
              type="range"
              min="-2"
              max="4"
              step="0.05"
              value={testAx}
              onChange={(e) => setTestAx(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Ay ({testAy} m/s²)
            </label>
            <input
              type="range"
              min="-2"
              max="4"
              step="0.05"
              value={testAy}
              onChange={(e) => setTestAy(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Az ({testAz} m/s²)
            </label>
            <input
              type="range"
              min="7"
              max="12"
              step="0.05"
              value={testAz}
              onChange={(e) => setTestAz(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Potentiometer ADC ({testPot})
            </label>
            <input
              type="range"
              min="0"
              max="1023"
              step="5"
              value={testPot}
              onChange={(e) => setTestPot(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSendTest}
            disabled={isSending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSending ? 'Transmitting...' : 'Transmit Packet to Pipeline'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
