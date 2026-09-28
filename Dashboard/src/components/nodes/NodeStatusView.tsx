import React, { useState } from 'react';
import {
  Cpu,
  Radio,
  Signal,
  ArrowRight,
  Filter,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useMonitoring } from '../../context/MonitoringContext';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { NodeDetailsModal } from './NodeDetailsModal';
import { SensorNode } from '../../types';

export const NodeStatusView: React.FC = () => {
  const { nodes, stats, selectedNode, setSelectedNodeId } = useMonitoring();
  const [filterZone, setFilterZone] = useState<string>('all');
  const [inspectNode, setInspectNode] = useState<SensorNode | null>(null);

  // Filter nodes if zone selected
  const filteredNodes = nodes.filter((n) => {
    if (filterZone === 'all') return true;
    return n.zone.toLowerCase().includes(filterZone.toLowerCase());
  });

  // Chart data for Node Comparison
  const comparisonData = nodes.map((n) => ({
    name: n.name.replace('Node ', 'N'),
    fullName: n.name,
    displacement: n.displacementMm,
    status: n.status,
    color:
      n.status === 'CRITICAL'
        ? '#F43F5E'
        : n.status === 'WARNING'
        ? '#F59E0B'
        : n.status === 'NORMAL'
        ? '#10B981'
        : '#475569',
  }));

  const handleOpenDetails = (node: SensorNode) => {
    setInspectNode(node);
  };

  return (
    <div id="nodes-view" className="space-y-6">
      {/* 1. TOP METRICS */}
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
        <MetricCard title="Offline" value={stats.offline} variant="neutral" />
      </div>

      {/* 2. NODE CONDITION CHART (Visual Comparison) */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1329] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Cluster Analysis</span>
            <h3 className="text-lg font-bold tracking-tight text-white mt-0.5">
              Node Condition Chart — Displacement Comparison
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Visual identification of geotechnical hazard drift across the monitored zone
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Normal (&lt;3mm)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" /> Warning (3-8mm)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-rose-500/30 text-rose-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" /> Critical (&gt;8mm)
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" unit="mm" axisLine={{ stroke: '#334155' }} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-xl text-white">
                        <div className="font-bold text-white mb-1">{data.fullName}</div>
                        <div className="text-slate-400">
                          Displacement: <strong className="text-cyan-300 font-bold font-mono">{data.displacement} mm</strong>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-1">
                          Status: <span style={{ color: data.color }} className="font-bold">{data.status}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="displacement" radius={[4, 4, 0, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. NODE CARDS GRID */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Inventory</span>
            <h3 className="text-lg font-bold tracking-tight text-white mt-0.5">
              Sensor Node Fleet ({filteredNodes.length})
            </h3>
          </div>

          {/* Zone filter */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400 font-medium">Filter Zone:</span>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="all">All Zones (A, B, C, D)</option>
              <option value="Zone A">Zone A (Ridge)</option>
              <option value="Zone B">Zone B (Embankment)</option>
              <option value="Zone C">Zone C (Retaining Wall)</option>
              <option value="Zone D">Zone D (Cutting / Toe)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              id={`card-${node.id}`}
              className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-cyan-500/50 ${
                node.status === 'CRITICAL'
                  ? 'border-rose-500/50 bg-[#160e1d]'
                  : node.status === 'WARNING'
                  ? 'border-amber-500/40 bg-[#171415]'
                  : 'border-slate-800/80 bg-[#0b1329]'
              }`}
            >
              <div>
                {/* Node Title & Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white font-sans">
                    {node.name}
                  </span>
                  <StatusBadge status={node.status} size="sm" />
                </div>

                <div className="text-xs text-slate-400 font-medium mt-1 truncate">
                  {node.zone}
                </div>

                {/* Sensor Readings */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Movement</span>
                    <span
                      className={`font-bold ${
                        node.movementLevel === 'Severe'
                          ? 'text-rose-400'
                          : node.movementLevel === 'Moderate'
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {node.movementLevel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Displacement</span>
                    <span
                      className={`font-bold font-mono ${
                        node.status === 'CRITICAL'
                          ? 'text-rose-400'
                          : node.status === 'WARNING'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {node.displacementMm} mm
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Signal</span>
                    <span className="text-cyan-300 font-mono">
                      {node.signal} ({node.rssi} dBm)
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">Last update</span>
                    <span className="text-slate-400 font-mono">{node.lastUpdated}</span>
                  </div>
                </div>
              </div>

              {/* View Details Button */}
              <button
                id={`btn-view-${node.id}`}
                onClick={() => handleOpenDetails(node)}
                className="mt-5 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Details</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Node Details Modal */}
      {inspectNode && (
        <NodeDetailsModal node={inspectNode} onClose={() => setInspectNode(null)} />
      )}
    </div>
  );
};
