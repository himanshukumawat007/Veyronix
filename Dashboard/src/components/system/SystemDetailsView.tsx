import React from 'react';
import {
  Cpu,
  Radio,
  Wifi,
  Clock,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Layers,
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';

export const SystemDetailsView: React.FC = () => {
  const { gateway, stats, lastSyncTime, connectionStatus } = useMonitoring();

  const isCritical = stats.systemHealth === 'CRITICAL';
  const isWarning = stats.systemHealth === 'WARNING';

  const systemStatusLabel = isCritical
    ? 'CRITICAL'
    : isWarning
    ? 'WARNING'
    : 'HEALTHY';

  return (
    <div id="system-details-view" className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
          System Details
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Core system metrics and operational parameters
        </p>
      </div>

      {/* Primary Status Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1329] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
          SYSTEM HEALTH & OVERVIEW
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {/* System Status */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              System Status
            </span>
            <div
              className={`text-xl font-bold mt-1 ${
                isCritical
                  ? 'text-rose-400'
                  : isWarning
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {systemStatusLabel}
            </div>
          </div>

          {/* Total Nodes */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Total Nodes
            </span>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              {stats.total}
            </div>
          </div>

          {/* Active Nodes */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Active Nodes
            </span>
            <div className="text-xl font-bold text-cyan-300 mt-1 font-mono">
              {stats.online} / {stats.total}
            </div>
          </div>

          {/* Gateway Status */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Gateway Status
            </span>
            <div
              className={`text-xl font-bold mt-1 ${
                gateway.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {gateway.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>

          {/* Last Data Update */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Last Data Update
            </span>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              {lastSyncTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>

          {/* Connection Status */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Connection Status
            </span>
            <div className="text-xl font-bold text-cyan-300 mt-1">
              {connectionStatus === 'LIVE' ? 'Connected (Live)' : connectionStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Summary */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0b1329] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white">
        <h3 className="text-base font-bold tracking-tight text-white font-sans mb-4">
          Deployment Parameters
        </h3>

        <div className="divide-y divide-slate-800/80 text-sm">
          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-400 font-medium">Deployment Project</span>
            <strong className="text-white">BHU DRISHTI</strong>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-400 font-medium">Monitored Zone</span>
            <strong className="text-slate-300">Himalayan Geotechnical Slope Grid</strong>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-400 font-medium">Network Architecture</span>
            <strong className="text-slate-300">Sub-GHz Wireless LoRa Mesh</strong>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-400 font-medium">Reporting Interval</span>
            <strong className="text-cyan-400 font-mono">2.5 Seconds</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
