import React, { useState } from 'react';
import { X, Activity, Gauge, Radio, Compass, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { SensorNode } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface NodeDetailsModalProps {
  node: SensorNode;
  onClose: () => void;
}

type ChartTab = 'movement' | 'displacement' | 'tilt' | 'signal' | 'xyz';

export const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({ node, onClose }) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('movement');

  // Prepare chart dataset ensuring fallback for tilt & rssi if empty
  const chartData = node.history.map((pt) => ({
    time: pt.time,
    movement: pt.movement,
    displacement: pt.displacement,
    tilt: pt.tilt !== undefined ? pt.tilt : node.mpu6050.tiltDeg,
    rssi: pt.rssi !== undefined ? pt.rssi : node.rssi,
    accX: pt.accX,
    accY: pt.accY,
    accZ: pt.accZ,
  }));

  return (
    <div
      id="node-details-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#0b1329] shadow-[0_16px_50px_rgba(0,0,0,0.6)] p-5 sm:p-8 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold font-sans text-white">{node.name}</h2>
              <StatusBadge status={node.status} size="sm" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-1">
              <span>{node.zone}</span>
              <span>•</span>
              <span className="font-mono">Last update: {node.lastUpdated}</span>
            </div>
          </div>

          <button
            id="close-node-modal-btn"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick telemetry metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div
            onClick={() => setActiveTab('movement')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'movement'
                ? 'bg-slate-900 text-white border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'movement' ? 'text-cyan-400' : 'text-slate-400'
                }`}
              >
                Movement
              </span>
              <Activity className="h-3.5 w-3.5 opacity-60 text-cyan-400" />
            </div>
            <div
              className={`text-lg font-bold mt-1 ${
                activeTab === 'movement'
                  ? 'text-white'
                  : node.movementLevel === 'Severe'
                  ? 'text-rose-400'
                  : node.movementLevel === 'Moderate'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {node.movementLevel}
            </div>
          </div>

          <div
            onClick={() => setActiveTab('displacement')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'displacement'
                ? 'bg-slate-900 text-white border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'displacement' ? 'text-cyan-400' : 'text-slate-400'
                }`}
              >
                Displacement
              </span>
              <Gauge className="h-3.5 w-3.5 opacity-60 text-cyan-400" />
            </div>
            <div className="text-lg font-bold mt-1 font-mono">
              {node.displacementMm}{' '}
              <span
                className={`text-xs font-normal ${
                  activeTab === 'displacement' ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                mm
              </span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('tilt')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'tilt'
                ? 'bg-slate-900 text-white border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'tilt' ? 'text-cyan-400' : 'text-slate-400'
                }`}
              >
                Tilt / Angle
              </span>
              <Compass className="h-3.5 w-3.5 opacity-60 text-cyan-400" />
            </div>
            <div className="text-lg font-bold mt-1 font-mono">{node.mpu6050.tiltDeg}°</div>
          </div>

          <div
            onClick={() => setActiveTab('signal')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'signal'
                ? 'bg-slate-900 text-white border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === 'signal' ? 'text-cyan-400' : 'text-slate-400'
                }`}
              >
                Signal
              </span>
              <Radio className="h-3.5 w-3.5 opacity-60 text-cyan-400" />
            </div>
            <div className="text-lg font-bold mt-1 font-mono text-cyan-300">
              {node.rssi}{' '}
              <span
                className={`text-xs font-normal ${
                  activeTab === 'signal' ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                dBm
              </span>
            </div>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-xl gap-1 mb-4 text-xs font-bold overflow-x-auto">
          <button
            id="tab-btn-movement"
            onClick={() => setActiveTab('movement')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'movement'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Movement Chart
          </button>
          <button
            id="tab-btn-displacement"
            onClick={() => setActiveTab('displacement')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'displacement'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Displacement Chart
          </button>
          <button
            id="tab-btn-tilt"
            onClick={() => setActiveTab('tilt')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tilt'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tilt / Angle Chart
          </button>
          <button
            id="tab-btn-signal"
            onClick={() => setActiveTab('signal')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'signal'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Signal Chart
          </button>
          <button
            id="tab-btn-xyz"
            onClick={() => setActiveTab('xyz')}
            className={`flex-1 py-2 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'xyz'
                ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MPU6050
          </button>
        </div>

        {/* Real-time Chart Area */}
        <div className="w-full">
          {activeTab === 'movement' && (
            <div>
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-slate-400">
                  Metric: <strong className="text-slate-200">Movement Index (0–100)</strong>
                </span>
                <span
                  className={`font-semibold ${
                    node.movementLevel === 'Severe'
                      ? 'text-rose-400'
                      : node.movementLevel === 'Moderate'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  Condition: {node.movementLevel}
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" domain={[0, 100]} axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-xl text-white">
                              <span className="text-slate-400 font-mono">{payload[0]?.payload?.time}: </span>
                              <span className="font-bold text-amber-400 font-mono">{payload[0]?.value} Index</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="movement"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0b1329', stroke: '#f59e0b', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'displacement' && (
            <div>
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-slate-400">
                  Metric: <strong className="text-slate-200">Displacement (Millimeters)</strong>
                </span>
                <span className="font-semibold text-emerald-400 font-mono">
                  Current: {node.displacementMm} mm ({node.displacementTrend})
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-xl text-white">
                              <span className="text-slate-400 font-mono">{payload[0]?.payload?.time}: </span>
                              <span className="font-bold text-emerald-400 font-mono">{payload[0]?.value} mm</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="displacement"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0b1329', stroke: '#10b981', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'tilt' && (
            <div>
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-slate-400">
                  Metric: <strong className="text-slate-200">Slope Incline (Degrees °)</strong>
                </span>
                <span className="font-semibold text-cyan-400 font-mono">
                  Current Tilt: {node.mpu6050.tiltDeg}°
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-xl text-white">
                              <span className="text-slate-400 font-mono">{payload[0]?.payload?.time}: </span>
                              <span className="font-bold text-cyan-400 font-mono">{payload[0]?.value}°</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tilt"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0b1329', stroke: '#06b6d4', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#06b6d4' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'signal' && (
            <div>
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-slate-400">
                  Metric: <strong className="text-slate-200">LoRa Link Strength (RSSI dBm)</strong>
                </span>
                <span className="font-semibold text-cyan-300 font-mono">
                  Quality: {node.signal} ({node.rssi} dBm)
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-xl text-white">
                              <span className="text-slate-400 font-mono">{payload[0]?.payload?.time}: </span>
                              <span className="font-bold text-cyan-300 font-mono">{payload[0]?.value} dBm</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rssi"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0b1329', stroke: '#38bdf8', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#38bdf8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'xyz' && (
            <div>
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-slate-400">
                  Metric: <strong className="text-slate-200">3-Axis Acceleration (m/s²)</strong>
                </span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-emerald-400 font-semibold">X: {node.mpu6050.accX}</span>
                  <span className="text-amber-400 font-semibold">Y: {node.mpu6050.accY}</span>
                  <span className="text-cyan-400 font-semibold">Z: {node.mpu6050.accZ}</span>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-xl text-white space-y-1">
                              <div className="text-slate-400 font-mono">{payload[0]?.payload?.time}</div>
                              <div className="text-emerald-400 font-semibold font-mono">Acc X: {payload[0]?.payload?.accX} m/s²</div>
                              <div className="text-amber-400 font-semibold font-mono">Acc Y: {payload[0]?.payload?.accY} m/s²</div>
                              <div className="text-cyan-400 font-semibold font-mono">Acc Z: {payload[0]?.payload?.accZ} m/s²</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="accX" stroke="#10b981" strokeWidth={2} dot={false} name="Acc X" />
                    <Line type="monotone" dataKey="accY" stroke="#f59e0b" strokeWidth={2} dot={false} name="Acc Y" />
                    <Line type="monotone" dataKey="accZ" stroke="#06b6d4" strokeWidth={2} dot={false} name="Acc Z" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-5 mt-4 text-xs text-slate-400">
          <span className="font-medium text-slate-400">
            Click metric cards or tabs above to switch live charts
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
