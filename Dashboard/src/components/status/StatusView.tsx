import React from 'react';
import {
  Activity,
  Radio,
  Wifi,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useMonitoring } from '../../context/MonitoringContext';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { SensorNode } from '../../types';

export const StatusView: React.FC = () => {
  const { nodes, gateway, stats, openNodeTelemetry } = useMonitoring();

  // Helper for node number extraction
  const getNodeNumber = (node: SensorNode) => {
    const num = node.id.replace('node-', '');
    return num.padStart(2, '0');
  };

  return (
    <div id="status-view" className="space-y-6">
      {/* 1. TOP METRICS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard title="Total Nodes" value={stats.total} />
        <MetricCard title="Online" value={stats.online} variant="normal" />
        <MetricCard title="Normal" value={stats.normal} variant="normal" />
        <MetricCard
          title="Warning"
          value={stats.warning}
          variant={stats.warning > 0 ? 'warning' : 'neutral'}
        />
        <MetricCard
          title="Critical"
          value={stats.critical}
          variant={stats.critical > 0 ? 'critical' : 'neutral'}
        />
        <MetricCard
          title="Gateway"
          value={gateway.status}
          variant={gateway.status === 'ONLINE' ? 'normal' : 'critical'}
          valueClassName="text-[30px]"
        />
      </div>

      {/* 2. COMPACT NODE TOPOLOGY GRID */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1329] p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-cyan-400">
              Sensor Topology
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5 font-sans">
              Node Status Grid
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any node indicator to open its real-time telemetry and trend charts
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Normal
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" /> Warning
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" /> Critical
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-500" /> Offline
            </span>
          </div>
        </div>

        {/* Compact Topology Grid: 01 02 03 ... 12 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {nodes.map((node) => {
            const num = getNodeNumber(node);
            const isCritical = node.status === 'CRITICAL';
            const isWarning = node.status === 'WARNING';
            const isNormal = node.status === 'NORMAL';
            const isOffline = node.status === 'OFFLINE';

            const dotColor = isCritical
              ? 'bg-rose-400 ring-2 ring-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse'
              : isWarning
              ? 'bg-amber-400 ring-2 ring-amber-500/50 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
              : isNormal
              ? 'bg-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : 'bg-slate-500';

            const cardStyle = isCritical
              ? 'border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-white shadow-[0_0_15px_rgba(244,63,94,0.15)]'
              : isWarning
              ? 'border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-white shadow-[0_0_15px_rgba(245,158,11,0.12)]'
              : isNormal
              ? 'border-slate-800 bg-slate-900/80 hover:border-cyan-400/50 hover:bg-slate-800/80 text-white'
              : 'border-slate-800/80 bg-slate-950/60 text-slate-500 cursor-not-allowed';

            return (
              <button
                key={node.id}
                id={`status-node-btn-${node.id}`}
                onClick={() => openNodeTelemetry(node.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 text-left shadow-sm group ${cardStyle}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColor}`} />
                  <div>
                    <div className="font-mono font-bold text-base leading-tight text-white">
                      {num}
                    </div>
                    <div className="text-[10px] font-medium uppercase tracking-wider opacity-75">
                      {isOffline ? 'Offline' : node.status.toLowerCase()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-semibold text-cyan-300">
                    {node.displacementMm}mm
                  </div>
                  <div className="text-[10px] text-slate-400 opacity-80">
                    {node.movementLevel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. GATEWAY STATUS (COMPACT) */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1329] p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold tracking-tight text-white font-sans">
                  GATEWAY
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${
                    gateway.status === 'ONLINE'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      gateway.status === 'ONLINE' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {gateway.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Central communication bridge for sensor telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              <span>Connected Nodes: </span>
              <strong className="text-cyan-300 font-mono">
                {gateway.connectedNodesCount} / {gateway.totalNodesCount}
              </strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              <span>Last Sync: </span>
              <strong className="text-white">{gateway.lastCommunication}</strong>
            </div>
          </div>
        </div>

        {/* Gateway Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Connected Nodes
            </span>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              {gateway.connectedNodesCount}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Packets Received
            </span>
            <div className="text-xl font-bold text-cyan-300 mt-1 font-mono">
              {gateway.packetsReceived.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Packets Sent
            </span>
            <div className="text-xl font-bold text-purple-300 mt-1 font-mono">
              {gateway.packetsSent.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Signal Quality
            </span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {gateway.signalQuality}
            </div>
          </div>
        </div>

        {/* Gateway Real-time Line Chart */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-300">
              Gateway Signal / Packet Flow
            </span>
            <span className="text-slate-500 font-mono">Real-time throughput</span>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gateway.packetHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2 text-xs shadow-xl text-white">
                          <span className="font-mono text-slate-400">{payload[0]?.payload?.time}: </span>
                          <span className="font-bold text-emerald-400 font-mono">{payload[0]?.value} pkts/s</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
