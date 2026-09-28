import React from 'react';
import {
  MapPin,
  Compass,
  AlertTriangle,
  AlertOctagon,
  Layers,
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';
import { SensorNode } from '../../types';

export const MiniMapView: React.FC = () => {
  const { nodes, openNodeTelemetry } = useMonitoring();

  const getNodeNumber = (node: SensorNode) => {
    const num = node.id.replace('node-', '');
    return num.padStart(2, '0');
  };

  return (
    <div id="mini-map-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
            Mini Map
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Geographic sensor grid • Click any node marker to view its real-time telemetry
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-[#0b1329] border border-slate-800 px-4 py-2 rounded-2xl shadow-lg">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Normal
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            Warning
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
            Critical
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-400">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            Offline
          </span>
        </div>
      </div>

      {/* Full-width Map Stage without permanent side panel */}
      <div className="w-full rounded-2xl border border-slate-800/80 bg-[#0b1329] p-5 sm:p-8 relative overflow-hidden flex flex-col justify-between min-h-[520px] shadow-[0_8px_32px_rgba(0,0,0,0.36)] text-white">
        {/* Topographic Background Contours */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="map-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1e293b" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-grid)" />
            {/* Slope Elevation Contours */}
            <path
              d="M-50,90 Q300,40 700,80 T1400,60"
              fill="none"
              stroke="#0e7490"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <path
              d="M-50,200 Q350,140 750,180 T1400,160"
              fill="none"
              stroke="#0369a1"
              strokeWidth="1.5"
            />
            <path
              d="M-50,320 Q400,260 800,290 T1400,250"
              fill="none"
              stroke="#334155"
              strokeWidth="1.8"
            />
            <path
              d="M-50,440 Q450,380 850,420 T1400,360"
              fill="none"
              stroke="#059669"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
          </svg>
        </div>

        {/* Map Zone Labels */}
        <div className="relative z-10 flex flex-wrap justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest gap-2 pointer-events-none">
          <span className="bg-slate-900/90 backdrop-blur-xs px-3 py-1 rounded-xl border border-slate-800 text-cyan-300 font-mono text-[10px]">
            Ridge Crest (Zone A — 410m)
          </span>
          <span className="bg-slate-900/90 backdrop-blur-xs px-3 py-1 rounded-xl border border-slate-800 text-cyan-300 font-mono text-[10px]">
            Upper Escarpment (Zone B — 350m)
          </span>
          <span className="bg-slate-900/90 backdrop-blur-xs px-3 py-1 rounded-xl border border-slate-800 text-cyan-300 font-mono text-[10px]">
            Base Valley (Zone D — 240m)
          </span>
        </div>

        {/* Central Map Canvas with Absolute Markers 01 to 12 */}
        <div className="relative flex-1 min-h-[420px] my-6">
          {nodes.map((node) => {
            const num = getNodeNumber(node);
            const isCritical = node.status === 'CRITICAL';
            const isWarning = node.status === 'WARNING';
            const isNormal = node.status === 'NORMAL';

            const markerColor = isCritical
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse ring-2 ring-rose-500/30'
              : isWarning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-2 ring-amber-500/30'
              : isNormal
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20 hover:border-cyan-400'
              : 'bg-slate-900 text-slate-500 border border-slate-800';

            return (
              <button
                key={node.id}
                id={`marker-${node.id}`}
                onClick={() => openNodeTelemetry(node.id)}
                style={{
                  top: `${node.location.y}%`,
                  left: `${node.location.x}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute flex items-center justify-center font-mono font-bold text-xs rounded-xl w-10 h-10 transition-all duration-200 hover:scale-125 z-20 cursor-pointer ${markerColor}`}
                title={`Node ${num} (${node.status}) - Click for full telemetry`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Bottom map status footer */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 gap-2">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            <span>Monitored Zone Coordinates: 30°24'N, 78°04'E</span>
          </div>
          <div className="font-medium text-slate-300">
            Total {nodes.length} Active Nodes Positioned Across Slope Profiles
          </div>
        </div>
      </div>
    </div>
  );
};
