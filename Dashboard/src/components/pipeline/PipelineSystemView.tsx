import React, { useState } from 'react';
import {
  Network,
  Cpu,
  Radio,
  Database,
  Cloud,
  BrainCircuit,
  LayoutDashboard,
  ArrowRight,
  Download,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';

export const PipelineSystemView: React.FC = () => {
  const { pipelineHealth, gateway, stats } = useMonitoring();
  const [apiEndpoint, setApiEndpoint] = useState<string>('/health');
  const [apiOutput, setApiOutput] = useState<string>('');
  const [loadingApi, setLoadingApi] = useState<boolean>(false);

  const testEndpoints = [
    '/health',
    '/api/db/status',
    '/api/db/telemetry?limit=5',
    '/api/db/alerts?limit=5',
    '/api/sensors/latest',
    '/api/system/status',
    '/api/nodes',
    '/api/mode',
    '/api/grafana/config',
  ];

  const handleTestApi = async (ep: string) => {
    setApiEndpoint(ep);
    setLoadingApi(true);
    try {
      const resp = await fetch(ep);
      const data = await resp.json();
      setApiOutput(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiOutput('Error calling endpoint: ' + err?.message);
    } finally {
      setLoadingApi(false);
    }
  };

  const stages = [
    {
      id: 'nano',
      title: 'Arduino Nano',
      subtitle: 'Field Sensor Node',
      desc: 'Samples MPU6050 (3-axis accel) & linear potentiometer @ 10Hz',
      status: pipelineHealth.sensor,
      icon: Radio,
    },
    {
      id: 'lora',
      title: 'LoRa 433MHz',
      subtitle: 'SX1278 Long Range Radio',
      desc: 'Transmits timestamp, ax, ay, az, pot packets over ~2km',
      status: pipelineHealth.lora,
      icon: Network,
    },
    {
      id: 'mega',
      title: 'Arduino Mega 2560',
      subtitle: 'LoRa Base Station Receiver',
      desc: 'Receives radio packets and forwards over USB Serial at 115200 baud',
      status: pipelineHealth.mega,
      icon: Cpu,
    },
    {
      id: 'pi',
      title: 'Raspberry Pi 3B',
      subtitle: 'Edge Gateway & Alarm Controller',
      desc: 'Ingests serial, controls Green/Yellow/Red GPIO LEDs & Buzzer',
      status: pipelineHealth.pi,
      icon: Cpu,
    },
    {
      id: 'sqlite',
      title: 'Local SQLite DB',
      subtitle: 'Offline-First Storage',
      desc: 'Guarantees zero data loss during network outages with auto-sync',
      status: pipelineHealth.database,
      icon: Database,
    },
    {
      id: 'cloudsql',
      title: 'Cloud SQL (PostgreSQL)',
      subtitle: 'Managed Relational Database',
      desc: 'Stores durable time-series telemetry, alerts, and operators with Drizzle ORM',
      status: 'ONLINE',
      icon: Database,
    },
    {
      id: 'cloud',
      title: 'Node.js Ingestion Engine',
      subtitle: 'Real-Time Pipeline Ingestion',
      desc: 'Receives burst backlog and live HTTP telemetry streams into Cloud SQL PostgreSQL',
      status: pipelineHealth.cloud,
      icon: Cloud,
    },
    {
      id: 'ai',
      title: 'ML & Gemini AI Engine',
      subtitle: 'Dual Geotechnical Intelligence',
      desc: 'Random Forest geotechnical classifier + Gemini 3.6 Flash interpretation',
      status: pipelineHealth.ai,
      icon: BrainCircuit,
    },
    {
      id: 'dashboard',
      title: 'Grafana & Web UI',
      subtitle: 'Analytical Visualization',
      desc: '10-panel real-time dashboard + interactive hazard command center',
      status: pipelineHealth.dashboard,
      icon: LayoutDashboard,
    },
  ];

  return (
    <div id="pipeline-system-view" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            End-to-End System Architecture & Diagnostics
          </h2>
          <p className="text-xs text-slate-400">
            Physical field sensors → LoRa radio link → Raspberry Pi 3B gateway → Cloud SQL (PostgreSQL) &amp; AI
          </p>
        </div>

        <a
          href="/api/export-project-zip"
          download="bhu_drishti_full_project.zip"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download Complete Project ZIP</span>
        </a>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-4">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 block">
          Telemetry Data Pipeline Stages
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-mono">
                        {stage.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {stage.subtitle}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`h-2 w-2 rounded-full ${
                      stage.status === 'ONLINE'
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                        : 'bg-amber-400'
                    }`}
                  />
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {stage.desc}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  <span>Step {idx + 1} of 8</span>
                  <span className="text-emerald-400 font-bold">{stage.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live REST API Tester */}
      <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Live REST API Endpoint Inspector
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Real Node.js Server @ Port 3000
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Inspect the live responses returned by the BHU-DRISHTI backend endpoints in real-time.
        </p>

        {/* Endpoint Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {testEndpoints.map((ep) => (
            <button
              key={ep}
              onClick={() => handleTestApi(ep)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-colors cursor-pointer ${
                apiEndpoint === ep
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {ep}
            </button>
          ))}
        </div>

        {/* API Response Display */}
        <div className="relative">
          <pre className="p-4 rounded-xl bg-[#080d0a] border border-emerald-950 font-mono text-xs text-emerald-300 max-h-64 overflow-y-auto">
            {loadingApi ? 'Querying API endpoint...' : apiOutput || 'Click any endpoint above to execute a real GET query.'}
          </pre>
        </div>
      </div>

      {/* Docker Compose Quick Deployment Guide */}
      <div className="p-5 rounded-2xl bg-[#0e1611] border border-emerald-900/40 space-y-3 text-xs font-mono">
        <span className="text-slate-300 font-bold block text-sm">
          Docker Compose Containerized Stack
        </span>
        <p className="text-slate-400">
          The full repository contains <code>docker-compose.yml</code> configured for zero-configuration
          multi-container deployment:
        </p>
        <div className="p-3 rounded-xl bg-[#080d0a] border border-emerald-950 text-slate-300 space-y-1">
          <div className="text-emerald-400"># Start full stack: Dashboard + PostgreSQL + AI Microservice</div>
          <div>docker compose up -d</div>
          <div className="text-slate-400 mt-2"># Web UI: http://localhost:3000</div>
          <div className="text-slate-400"># PostgreSQL: localhost:5432</div>
          <div className="text-slate-400"># ML Flask Microservice: http://localhost:5000</div>
        </div>
      </div>
    </div>
  );
};
