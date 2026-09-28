import React, { useState } from 'react';
import {
  Mountain,
  Layers,
  Radio,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Eye,
  Maximize2,
  Activity,
  Cpu,
} from 'lucide-react';
import { SensorNode } from '../../types';

interface SlopeTopographyVisualizerProps {
  nodes: SensorNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  systemRisk: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export const SlopeTopographyVisualizer: React.FC<SlopeTopographyVisualizerProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  systemRisk,
}) => {
  const [activeLayer, setActiveLayer] = useState<'ALL' | 'SLIP_SURFACE' | 'BOREHOLE'>('ALL');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const node1 = nodes.find((n) => n.id === 'node-01') || nodes[0];
  const node2 = nodes.find((n) => n.id === 'node-02') || nodes[1] || nodes[0];

  const isCritical = systemRisk === 'CRITICAL';
  const isWarning = systemRisk === 'WARNING';

  return (
    <div className="rounded-2xl bg-[#0d1611] border border-emerald-900/40 p-5 space-y-4 relative overflow-hidden shadow-lg">
      {/* Subtle topographic contour line decoration in background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
            <Mountain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight font-sans">
                Digital Geotechnical Slope Twin &amp; Borehole Cross-Section
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isCritical
                    ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                    : isWarning
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                SLOPE STABILITY: {systemRisk}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Interactive 2D geological stratum model • Borehole anchors • Critical shear slip circle
            </p>
          </div>
        </div>

        {/* Layer toggle filter */}
        <div className="flex items-center rounded-xl bg-slate-900/90 border border-slate-800 p-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveLayer('ALL')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeLayer === 'ALL'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All Strata
          </button>
          <button
            onClick={() => setActiveLayer('SLIP_SURFACE')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeLayer === 'SLIP_SURFACE'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Shear Slip Surface
          </button>
          <button
            onClick={() => setActiveLayer('BOREHOLE')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeLayer === 'BOREHOLE'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Boreholes &amp; Anchors
          </button>
        </div>
      </div>

      {/* Main SVG Terrain Cross-Section Graphic */}
      <div className="relative w-full rounded-xl bg-[#080e0a] border border-emerald-950/80 p-2 sm:p-4 overflow-hidden">
        <svg
          viewBox="0 0 900 380"
          className="w-full h-auto select-none"
          style={{ minHeight: '260px' }}
        >
          <defs>
            {/* Strata Gradients */}
            <linearGradient id="bedrockGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#13231a" />
              <stop offset="100%" stopColor="#08100b" />
            </linearGradient>

            <linearGradient id="colluviumGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e3a2b" />
              <stop offset="100%" stopColor="#12251b" />
            </linearGradient>

            <linearGradient id="shearSlipGrad" x1="0" y1="0" x2="1" y2="0">
              <stop
                offset="0%"
                stopColor={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}
                stopOpacity="0.8"
              />
              <stop
                offset="100%"
                stopColor={isCritical ? '#dc2626' : isWarning ? '#d97706' : '#059669'}
                stopOpacity="0.2"
              />
            </linearGradient>

            {/* Pulsing glow filter */}
            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Coordinate Grid Lines */}
          <g opacity="0.15" stroke="#34d399" strokeWidth="0.5" strokeDasharray="4 4">
            <line x1="60" y1="60" x2="860" y2="60" />
            <line x1="60" y1="120" x2="860" y2="120" />
            <line x1="60" y1="180" x2="860" y2="180" />
            <line x1="60" y1="240" x2="860" y2="240" />
            <line x1="60" y1="300" x2="860" y2="300" />
            <line x1="120" y1="40" x2="120" y2="340" />
            <line x1="300" y1="40" x2="300" y2="340" />
            <line x1="500" y1="40" x2="500" y2="340" />
            <line x1="700" y1="40" x2="700" y2="340" />
          </g>

          {/* Elevation Labels (Y Axis) */}
          <text x="35" y="65" fill="#64748b" fontSize="11" fontFamily="monospace">450m</text>
          <text x="35" y="125" fill="#64748b" fontSize="11" fontFamily="monospace">420m</text>
          <text x="35" y="185" fill="#64748b" fontSize="11" fontFamily="monospace">390m</text>
          <text x="35" y="245" fill="#64748b" fontSize="11" fontFamily="monospace">360m</text>
          <text x="35" y="305" fill="#64748b" fontSize="11" fontFamily="monospace">330m</text>

          {/* Distance Labels (X Axis) */}
          <text x="120" y="360" fill="#64748b" fontSize="11" fontFamily="monospace">0m (Crest)</text>
          <text x="300" y="360" fill="#64748b" fontSize="11" fontFamily="monospace">60m</text>
          <text x="500" y="360" fill="#64748b" fontSize="11" fontFamily="monospace">120m (Slope)</text>
          <text x="700" y="360" fill="#64748b" fontSize="11" fontFamily="monospace">180m (Toe)</text>

          {/* 1. Deep Stable Bedrock Layer */}
          <path
            d="M 80 340 L 80 150 Q 240 180 380 230 T 780 290 L 860 300 L 860 340 Z"
            fill="url(#bedrockGrad)"
            stroke="#1b3826"
            strokeWidth="1.5"
          />
          <text x="140" y="290" fill="#335c42" fontSize="13" fontWeight="bold" fontFamily="monospace">
            STABLE BASAL BEDROCK (Sandstone / Gneiss)
          </text>

          {/* 2. Colluvium / Weathered Overburden Soil Layer */}
          <path
            d="M 80 150 L 140 85 L 260 90 L 460 170 L 660 230 L 760 270 L 860 280 L 860 300 L 780 290 Q 520 250 380 230 Q 240 180 80 150 Z"
            fill="url(#colluviumGrad)"
            stroke="#2a523a"
            strokeWidth="1.5"
          />
          <text x="320" y="145" fill="#4ade80" fontSize="12" fontWeight="600" opacity="0.85">
            WEATHERED OVERBURDEN &amp; COLLUVIAL REGOLITH
          </text>

          {/* 3. Geological Shear Slip Surface Arc */}
          {(activeLayer === 'ALL' || activeLayer === 'SLIP_SURFACE') && (
            <g>
              <path
                d="M 190 90 Q 320 220 720 260"
                fill="none"
                stroke={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}
                strokeWidth={isCritical ? '4' : '2.5'}
                strokeDasharray={isCritical ? 'none' : '6 4'}
                filter="url(#emeraldGlow)"
              />
              {/* Shear slip surface label */}
              <text
                x="350"
                y="215"
                fill={isCritical ? '#fca5a5' : isWarning ? '#fde68a' : '#86efac'}
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
              >
                CRITICAL CIRCULAR SHEAR SLIP SURFACE (Failure Plane)
              </text>

              {/* Shear Vector Arrow */}
              <g transform="translate(480, 190) rotate(24)">
                <line x1="0" y1="0" x2="50" y2="0" stroke={isCritical ? '#ef4444' : '#10b981'} strokeWidth="3" />
                <polygon points="50,-5 62,0 50,5" fill={isCritical ? '#ef4444' : '#10b981'} />
                <text x="0" y="-10" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  Shear Slip Vector
                </text>
              </g>
            </g>
          )}

          {/* 4. Borehole Anchors */}
          {(activeLayer === 'ALL' || activeLayer === 'BOREHOLE') && (
            <g>
              {/* Node 01 Borehole Anchor into bedrock */}
              <line
                x1="220"
                y1="88"
                x2="220"
                y2="200"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="3 3"
              />
              <circle cx="220" cy="200" r="5" fill="#38bdf8" />
              <text x="160" y="215" fill="#7dd3fc" fontSize="10" fontFamily="monospace">
                Anchorage Depth: 12m
              </text>

              {/* Node 02 Borehole Anchor into bedrock */}
              <line
                x1="520"
                y1="190"
                x2="520"
                y2="270"
                stroke="#a855f7"
                strokeWidth="3"
                strokeDasharray="3 3"
              />
              <circle cx="520" cy="270" r="5" fill="#a855f7" />
              <text x="460" y="285" fill="#d8b4fe" fontSize="10" fontFamily="monospace">
                Anchorage Depth: 8m
              </text>
            </g>
          )}

          {/* 5. Raspberry Pi 3B Gateway Tower at Summit Crest */}
          <g transform="translate(105, 45)">
            {/* Tower structure */}
            <line x1="15" y1="40" x2="15" y2="10" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="8" y1="40" x2="22" y2="40" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="15" cy="8" r="4" fill="#10b981" filter="url(#emeraldGlow)" />
            {/* Radio waves broadcasting */}
            <path
              d="M 15 4 A 12 12 0 0 1 27 16"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <path
              d="M 15 -2 A 18 18 0 0 1 33 16"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              opacity="0.5"
            />
            {/* Gateway Label */}
            <rect x="35" y="0" width="130" height="24" rx="5" fill="#0f172a" stroke="#1e293b" />
            <text x="42" y="16" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">
              Pi 3B Base Station
            </text>
          </g>

          {/* LoRa Wireless Link Dashed Line */}
          <path
            d="M 120 53 Q 170 30 220 88"
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          <path
            d="M 120 53 Q 320 20 520 190"
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />

          {/* 6. NODE 01 (Ridge Crest) Interactive Marker */}
          <g
            transform="translate(220, 88)"
            className="cursor-pointer"
            onClick={() => onSelectNode('node-01')}
            onMouseEnter={() => setHoveredNode('node-01')}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Radar wave ping ring */}
            <circle
              cx="0"
              cy="0"
              r={selectedNodeId === 'node-01' ? '18' : '14'}
              fill="none"
              stroke={node1.status === 'CRITICAL' ? '#ef4444' : '#10b981'}
              strokeWidth="1.5"
              opacity="0.5"
              className="animate-ping"
            />
            {/* Outer ring */}
            <circle
              cx="0"
              cy="0"
              r="10"
              fill="#060c08"
              stroke={selectedNodeId === 'node-01' ? '#38bdf8' : '#10b981'}
              strokeWidth="2.5"
            />
            {/* Core dot */}
            <circle
              cx="0"
              cy="0"
              r="4.5"
              fill={node1.status === 'CRITICAL' ? '#ef4444' : '#10b981'}
            />

            {/* Label Card */}
            <g transform="translate(15, -35)">
              <rect
                x="0"
                y="0"
                width="140"
                height="44"
                rx="6"
                fill="#0b1320"
                stroke={selectedNodeId === 'node-01' ? '#38bdf8' : '#1e293b'}
                strokeWidth="1.5"
              />
              <text x="8" y="16" fill="#ffffff" fontSize="11" fontWeight="bold">
                Node 01: Ridge Crest
              </text>
              <text x="8" y="32" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                Disp: {node1.displacementMm.toFixed(2)}mm • {node1.status}
              </text>
            </g>
          </g>

          {/* 7. NODE 02 (Mid-Slope Embankment) Interactive Marker */}
          <g
            transform="translate(520, 190)"
            className="cursor-pointer"
            onClick={() => onSelectNode('node-02')}
            onMouseEnter={() => setHoveredNode('node-02')}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Ping ring */}
            <circle
              cx="0"
              cy="0"
              r={selectedNodeId === 'node-02' ? '18' : '14'}
              fill="none"
              stroke={
                node2.status === 'CRITICAL'
                  ? '#ef4444'
                  : node2.status === 'WARNING'
                  ? '#f59e0b'
                  : '#10b981'
              }
              strokeWidth="1.5"
              opacity="0.6"
              className="animate-ping"
            />
            {/* Outer ring */}
            <circle
              cx="0"
              cy="0"
              r="10"
              fill="#060c08"
              stroke={selectedNodeId === 'node-02' ? '#a855f7' : '#10b981'}
              strokeWidth="2.5"
            />
            {/* Core dot */}
            <circle
              cx="0"
              cy="0"
              r="4.5"
              fill={
                node2.status === 'CRITICAL'
                  ? '#ef4444'
                  : node2.status === 'WARNING'
                  ? '#f59e0b'
                  : '#10b981'
              }
            />

            {/* Label Card */}
            <g transform="translate(15, -35)">
              <rect
                x="0"
                y="0"
                width="140"
                height="44"
                rx="6"
                fill="#0b1320"
                stroke={selectedNodeId === 'node-02' ? '#a855f7' : '#1e293b'}
                strokeWidth="1.5"
              />
              <text x="8" y="16" fill="#ffffff" fontSize="11" fontWeight="bold">
                Node 02: Mid-Slope
              </text>
              <text
                x="8"
                y="32"
                fill={
                  node2.status === 'CRITICAL'
                    ? '#f87171'
                    : node2.status === 'WARNING'
                    ? '#fbbf24'
                    : '#4ade80'
                }
                fontSize="10"
                fontFamily="monospace"
              >
                Disp: {node2.displacementMm.toFixed(2)}mm • {node2.status}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Cross-section legend bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-[#1e3a2b] border border-[#2a523a]" />
            <span className="text-slate-300">Overburden Soil</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-[#13231a] border border-[#1b3826]" />
            <span className="text-slate-300">Basal Bedrock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-emerald-400" />
            <span className="text-emerald-400 font-semibold">Shear Plane</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-b-2 border-dashed border-sky-400" />
            <span className="text-sky-400">Borehole Extensometer</span>
          </div>
        </div>

        <div className="text-slate-400 text-[11px]">
          Click on any node pin to focus live telemetry stream
        </div>
      </div>
    </div>
  );
};
