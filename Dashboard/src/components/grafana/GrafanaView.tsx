import React, { useState, useEffect } from 'react';
import {
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Database,
  BarChart3,
  Layers,
  Code2,
  Copy,
  Check,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useMonitoring } from '../../context/MonitoringContext';

export const GrafanaView: React.FC = () => {
  const { selectedNode, stats, pipelineHealth, gateway } = useMonitoring();
  const [copied, setCopied] = useState<boolean>(false);
  const [grafanaConfig, setGrafanaConfig] = useState<any>(null);

  useEffect(() => {
    fetch('/api/grafana/config')
      .then((res) => res.json())
      .then((data) => setGrafanaConfig(data))
      .catch(() => {});
  }, []);

  const history = selectedNode?.history || [];

  const copySqlQuery = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleSql = `SELECT
  timestamp AS "time",
  ax AS "Acc X (m/s²)",
  ay AS "Acc Y (m/s²)",
  az AS "Acc Z (m/s²)",
  displacement_mm AS "Shear Displacement (mm)",
  risk_score AS "ML Risk Score (%)"
FROM telemetry_records
WHERE node_id = '${selectedNode?.id || 'node-01'}'
ORDER BY timestamp DESC
LIMIT 100;`;

  return (
    <div id="grafana-view" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header & Exporter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Grafana Cloud & Local Provisioning
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
              10 PANELS CONFIGURED
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Pre-configured dashboard with Cloud SQL PostgreSQL queries and geotechnical alert rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/grafana/dashboard-json"
            download="bhu_drishti_dashboard.json"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Dashboard JSON</span>
          </a>
        </div>
      </div>

      {/* Integration Setup Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">PostgreSQL Storage</span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {grafanaConfig?.postgres?.configured ? 'CLOUD SQL CONNECTED' : 'IN-MEMORY BUFFER'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-300 font-mono">
            Table: {grafanaConfig?.postgres?.table || 'telemetry_records'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Host: {grafanaConfig?.postgres?.host || 'Cloud SQL'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Grafana Datasource</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {grafanaConfig?.configured ? 'SYNCED' : 'READY TO IMPORT'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-300 font-mono">
            Type: PostgreSQL (Native)
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            UID: {grafanaConfig?.datasourceUid || 'postgres'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Live Ingestion Rate</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {stats.ingestRate} pkt/min
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-300 font-mono">
            Active Nodes: {stats.online}/{stats.total}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Backlog queue: 0
          </div>
        </div>
      </div>

      {/* 10-Panel Analytical Grid Preview */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <span>Dashboard Panels Preview (10 Panels)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Panel 1: Ax / Ay / Az Telemetry */}
          <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-300">
              Panel 1: Ax, Ay, Az Telemetry
            </span>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[-2, 12]} />
                  <Line type="monotone" dataKey="ax" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="ay" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="az" stroke="#10b981" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>Ax: {selectedNode?.mpu6050.accX}</span>
              <span>Ay: {selectedNode?.mpu6050.accY}</span>
              <span>Az: {selectedNode?.mpu6050.accZ}</span>
            </div>
          </div>

          {/* Panel 2: Potentiometer Shear Displacement */}
          <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-300">
              Panel 2: Potentiometer Shear Displacement
            </span>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 20]} />
                  <Area type="monotone" dataKey="displacement" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>Current: {selectedNode?.displacementMm.toFixed(2)} mm</span>
              <span>ADC: {selectedNode?.potValue}</span>
            </div>
          </div>

          {/* Panel 3: Acceleration Magnitude */}
          <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-300">
              Panel 3: Acceleration Magnitude |a|
            </span>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[8, 14]} />
                  <Line type="monotone" dataKey="magnitude" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>|a| = √(Ax² + Ay² + Az²)</span>
              <span className="text-cyan-400 font-bold">~9.81 m/s²</span>
            </div>
          </div>

          {/* Panel 4: Acceleration Deviation */}
          <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-300">
              Panel 4: Acceleration Deviation |Δg|
            </span>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 2]} />
                  <Line type="monotone" dataKey="deviation" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>Threshold: 0.3 m/s²</span>
              <span className="text-amber-400 font-bold">Safe</span>
            </div>
          </div>

          {/* Panel 5: Risk Score Gauge */}
          <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40 space-y-2 flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">
              Panel 5: Geotechnical Risk Score (Gauge)
            </span>
            <div className="text-center py-4">
              <div className="text-4xl font-extrabold text-emerald-400 font-sans">
                {stats.currentRiskScore}%
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Random Forest ML Inference
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>0% Safe</span>
              <span>50% Warning</span>
              <span>75% Critical</span>
            </div>
          </div>

          {/* Panel 6: Risk Status Indicator */}
          <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40 space-y-2 flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">
              Panel 6: Geotechnical Risk Status
            </span>
            <div className="text-center py-4">
              <div
                className={`inline-block px-4 py-2 rounded-xl text-lg font-bold font-mono ${
                  stats.systemHealth === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : stats.systemHealth === 'WARNING'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {stats.systemHealth}
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 text-center">
              Evaluated across all active nodes
            </div>
          </div>

          {/* Panel 7: Node Activity */}
          <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40 space-y-2 flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">
              Panel 7: Node Activity & Online Sensors
            </span>
            <div className="text-center py-4">
              <div className="text-4xl font-extrabold text-white font-sans">
                {stats.online} / {stats.total}
              </div>
              <div className="text-xs font-mono text-emerald-400 mt-1">
                LoRa 433MHz Mesh Online
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 text-center">
              Signal: -62 dBm
            </div>
          </div>

          {/* Panel 8: Ingestion Rate */}
          <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40 space-y-2 flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">
              Panel 8: Ingestion Throughput
            </span>
            <div className="text-center py-4">
              <div className="text-4xl font-extrabold text-white font-sans">
                {stats.ingestRate}
              </div>
              <div className="text-xs font-mono text-emerald-400 mt-1">
                packets per minute
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 text-center">
              Serial Baud: 115200
            </div>
          </div>

          {/* Panel 9 & 10: Historical Timeline & Health */}
          <div className="p-4 rounded-xl bg-[#0e1611] border border-emerald-900/40 space-y-2 flex flex-col justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">
              Panels 9 & 10: Trend & Health Check
            </span>
            <div className="text-center py-3">
              <div className="text-xl font-bold text-emerald-400 font-mono">
                ALL SYSTEMS OPERATIONAL
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Raspberry Pi Gateway + Cloud SQL PostgreSQL
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 text-center">
              Last Synced: Just now
            </div>
          </div>
        </div>
      </div>

      {/* SQL Query Sample Code Block */}
      <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Cloud SQL PostgreSQL Query Sample (Panel 1: Ax/Ay/Az)
          </span>
          <button
            onClick={() => copySqlQuery(sampleSql)}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy SQL'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-[#080d0a] border border-emerald-950 font-mono text-xs text-emerald-300 overflow-x-auto">
          {sampleSql}
        </pre>
      </div>
    </div>
  );
};
