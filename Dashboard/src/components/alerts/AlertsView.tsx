import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';
import { AlertItem } from '../../types';

export const AlertsView: React.FC = () => {
  const { alerts, openNodeTelemetry } = useMonitoring();
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'RESOLVED'>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.severity === filter;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;

  return (
    <div id="alerts-view" className="space-y-6 max-w-4xl">
      {/* Top Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
            Alerts
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Real-time movement and threshold alerts • Click an alert to view node telemetry
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0b1329] border border-slate-800 p-1.5 rounded-2xl shadow-lg">
          <button
            id="filter-all"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            id="filter-critical"
            onClick={() => setFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            id="filter-warning"
            onClick={() => setFilter('WARNING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'WARNING'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            Warning ({warningCount})
          </button>
          <button
            id="filter-resolved"
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'RESOLVED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-[#0b1329] p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-white">No Alerts Found</h4>
            <p className="text-xs text-slate-400 font-medium mt-1">
              All monitored ground nodes operating within stable limits.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';

            const statusDot = isCritical
              ? 'bg-rose-400 ring-2 ring-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse'
              : isWarning
              ? 'bg-amber-400 ring-2 ring-amber-500/50 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
              : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';

            const cardStyle = isCritical
              ? 'border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/35 text-white shadow-[0_0_20px_rgba(244,63,94,0.12)]'
              : isWarning
              ? 'border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/35 text-white shadow-[0_0_20px_rgba(245,158,11,0.1)]'
              : 'border-slate-800/80 bg-[#0b1329] hover:bg-slate-900/90 text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)]';

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                onClick={() => openNodeTelemetry(alert.nodeId)}
                className={`rounded-2xl border p-4 sm:p-5 transition-all duration-150 cursor-pointer shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardStyle}`}
              >
                <div className="flex items-start gap-3.5">
                  <span className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${statusDot}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {alert.nodeName}
                      </h3>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                          isCritical
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : isWarning
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-200 mt-1">
                      {alert.message || alert.what}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-xs text-slate-400 font-mono">
                    {alert.when || alert.timestamp}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openNodeTelemetry(alert.nodeId);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
