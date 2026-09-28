import React from 'react';
import {
  Radio,
  Wifi,
  Cpu,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
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

export const GatewayView: React.FC = () => {
  const { gateway, nodes, stats } = useMonitoring();

  return (
    <div id="gateway-view" className="space-y-6">
      {/* 1. MAIN CARD: LORA GATEWAY */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1329] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Radio className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                  PRIMARY HUB
                </span>
                <StatusBadge status={gateway.status} size="sm" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1 font-sans">
                LoRa Gateway ({gateway.id})
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {gateway.model} • Dual-Band Sub-GHz Ingestion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 font-medium">Wi-Fi: </span>
              <span className="font-bold text-emerald-400 font-mono">{gateway.wifiStatus}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono">
              <span className="text-slate-400">IP: </span>
              <span className="text-cyan-300 font-semibold">{gateway.ipAddress}</span>
            </div>
          </div>
        </div>

        {/* Concise Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Gateway ID
            </span>
            <div className="text-base font-bold text-white mt-1 font-mono">
              {gateway.id}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Connected Nodes
            </span>
            <div className="text-base font-bold text-cyan-300 mt-1 font-mono">
              {gateway.connectedNodesCount} / {gateway.totalNodesCount}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Packets Received
            </span>
            <div className="text-base font-bold text-white mt-1 font-mono">
              {gateway.packetsReceived.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Packets Sent
            </span>
            <div className="text-base font-bold text-purple-300 mt-1 font-mono">
              {gateway.packetsSent.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Signal Quality
            </span>
            <div className="text-base font-bold text-emerald-400 mt-1">
              {gateway.signalQuality}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Last Comm
            </span>
            <div className="text-base font-bold text-slate-300 mt-1 font-mono">
              {gateway.lastCommunication}
            </div>
          </div>
        </div>
      </div>

      {/* 2. GATEWAY CHART: PACKETS RECEIVED */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1329] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Throughput Stream</span>
            <h3 className="text-lg font-bold tracking-tight text-white mt-0.5">
              Packets Received — Real-time Throughput
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              LoRa RA-02 433 MHz RF ingestion stream rate
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-emerald-400 font-bold font-mono text-xs border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            ~24 pkts/sec
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gateway.packetHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-xl text-white">
                        <span className="text-slate-400 font-mono">{payload[0]?.payload?.time}: </span>
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
                dot={{ r: 3, fill: '#0b1329', stroke: '#10b981', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. CONNECTED NODES COMMUNICATION STATE */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1329] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Topology Status</span>
            <h3 className="text-lg font-bold tracking-tight text-white mt-0.5">
              Connected Nodes Communication Status
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Gateway packet ingestion telemetry health
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-cyan-300 font-bold font-mono text-xs border border-slate-800">
            {gateway.connectedNodesCount} / {gateway.totalNodesCount} Receiving Packets
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {nodes.map((node) => {
            const isOnline = node.status !== 'OFFLINE';
            return (
              <div
                key={node.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isOnline
                    ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800/80'
                    : 'border-slate-850 bg-slate-950/60 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      node.status === 'CRITICAL'
                        ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                        : node.status === 'WARNING'
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                        : node.status === 'NORMAL'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span className="text-xs font-bold text-white font-sans">
                    {node.name}
                  </span>
                </div>

                <span className="text-[11px] font-mono text-cyan-300">
                  {isOnline ? `${node.rssi}dBm` : 'Lost'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
