import React, { useState, useMemo } from 'react';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Database,
  Cpu,
  Clock,
  Bell,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sliders,
  Mountain,
  Layers,
  Compass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useMonitoring } from '../../context/MonitoringContext';
import { SlopeTopographyVisualizer } from './SlopeTopographyVisualizer';
import { RiskDistributionAndTimeline } from './RiskDistributionAndTimeline';
import { KinematicInstruments } from './KinematicInstruments';

export const OverviewView: React.FC = () => {
  const {
    nodes,
    gateway,
    stats,
    alerts,
    aiPrediction,
    pipelineHealth,
    acknowledgeAlert,
    setActivePage,
    openNodeTelemetry,
    silenceAlarmBuzzer,
  } = useMonitoring();

  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-01');
  const [timeRange, setTimeRange] = useState<'5m' | '30m' | '1h' | '6h' | '24h'>('30m');

  const activeNode = useMemo(() => {
    return (
      nodes.find((n) => n.id === selectedNodeId) ||
      nodes.find((n) => n.status === 'CRITICAL') ||
      nodes.find((n) => n.status === 'WARNING') ||
      nodes[0]
    );
  }, [nodes, selectedNodeId]);

  // Accelerometer chart data
  const accelData = useMemo(() => {
    if (!activeNode || !activeNode.history) return [];
    return activeNode.history.map((pt) => ({
      time: pt.time,
      ax: pt.ax,
      ay: pt.ay,
      az: pt.az,
      mag: pt.magnitude,
      dev: pt.deviation,
    }));
  }, [activeNode]);

  // Potentiometer displacement data
  const dispData = useMemo(() => {
    if (!activeNode || !activeNode.history) return [];
    return activeNode.history.map((pt) => ({
      time: pt.time,
      displacement: pt.displacement,
      pot: pt.pot,
    }));
  }, [activeNode]);

  // Recent alerts
  const recentAlerts = useMemo(() => {
    return alerts.slice(0, 3);
  }, [alerts]);

  const pipelineStages = [
    { label: 'Sensor (Nano)', status: pipelineHealth.sensor },
    { label: 'LoRa 433MHz', status: pipelineHealth.lora },
    { label: 'Mega Gateway', status: pipelineHealth.mega },
    { label: 'Raspberry Pi 3B', status: pipelineHealth.pi },
    { label: 'Local SQLite DB', status: pipelineHealth.database },
    { label: 'Cloud SQL (PostgreSQL)', status: pipelineHealth.cloud },
    { label: 'ML AI Engine', status: pipelineHealth.ai },
    { label: 'Dashboard UI', status: pipelineHealth.dashboard },
  ];

  return (
    <div id="overview-view" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* 1. THE 6 PRIMARY KPI BOXES (CRISP, ATTRACTIVE & HIGH CONTRAST) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* BOX 1: Overall Geotechnical Risk Score */}
        <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40 shadow-sm flex flex-col justify-between hover:border-emerald-700/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Risk Index
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                stats.systemHealth === 'CRITICAL'
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : stats.systemHealth === 'WARNING'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {stats.systemHealth}
            </span>
          </div>
          <div className="mt-2">
            <div
              className={`text-3xl font-extrabold tracking-tight font-sans ${
                stats.systemHealth === 'CRITICAL'
                  ? 'text-red-400'
                  : stats.systemHealth === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {stats.currentRiskScore}%
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate mt-1">
              {aiPrediction.predictedCondition}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-950 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Ensemble RF</span>
            <span className="text-emerald-400">95% Conf</span>
          </div>
        </div>

        {/* BOX 2: Active Sensor Nodes */}
        <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40 shadow-sm flex flex-col justify-between hover:border-emerald-700/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Sensor Array
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800">
              ONLINE
            </span>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-white tracking-tight font-sans">
              {stats.online} / {stats.total}
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-1">
              Field Transceivers
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-950 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>LoRa 433MHz</span>
            <span className="text-sky-400 font-bold">-62 dBm</span>
          </div>
        </div>

        {/* BOX 3: Surface Shear Displacement */}
        <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40 shadow-sm flex flex-col justify-between hover:border-emerald-700/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Displacement
            </span>
            <span className="text-emerald-400 text-xs font-mono font-bold">
              POT ADC
            </span>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight font-sans">
              {activeNode?.displacementMm.toFixed(2)}{' '}
              <span className="text-lg font-normal text-slate-300">mm</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-1 truncate">
              {activeNode?.name}: Borehole Shear
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-950 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Threshold: 7.5mm</span>
            <span className="text-emerald-400">Safe</span>
          </div>
        </div>

        {/* BOX 4: 3-Axis Kinematic Vector */}
        <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40 shadow-sm flex flex-col justify-between hover:border-emerald-700/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Kinematics
            </span>
            <span className="text-purple-400 text-xs font-mono font-bold">
              MPU6050
            </span>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-purple-400 tracking-tight font-sans">
              {activeNode?.mpu6050.accZ.toFixed(2)}{' '}
              <span className="text-lg font-normal text-slate-300">m/s²</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-1">
              Vertical Gravity Vector
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-950 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Tilt Angle</span>
            <span className="text-purple-300 font-bold">{activeNode?.mpu6050.tiltDeg || 1.1}°</span>
          </div>
        </div>

        {/* BOX 5: Raspberry Pi 3B Hardware Alarm */}
        <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40 shadow-sm flex flex-col justify-between hover:border-emerald-700/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Pi Alarm State
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                gateway.alarmState?.color === 'RED'
                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse'
                  : gateway.alarmState?.color === 'YELLOW'
                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)]'
                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
              }`}
            />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span
                className={`text-3xl font-extrabold font-mono tracking-tight ${
                  gateway.alarmState?.color === 'RED'
                    ? 'text-red-400'
                    : gateway.alarmState?.color === 'YELLOW'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {gateway.alarmState?.color || 'GREEN'}
              </span>
              {gateway.alarmState?.buzzerActive && (
                <button
                  onClick={silenceAlarmBuzzer}
                  className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-500 cursor-pointer flex items-center gap-1 animate-pulse"
                >
                  <VolumeX className="h-3 w-3" /> MUTE
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-1">
              GPIO 17/27/22 LEDs
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-950 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Buzzer Pin 23</span>
            <span className="text-emerald-400">
              {gateway.alarmState?.buzzerActive ? 'SOUNDING' : 'Silent'}
            </span>
          </div>
        </div>

        {/* BOX 6: Ingestion Throughput & SQLite Cache */}
        <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40 shadow-sm flex flex-col justify-between hover:border-emerald-700/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Throughput
            </span>
            <span className="text-cyan-400 text-xs font-mono font-bold">
              CLOUD SQL
            </span>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-white tracking-tight font-sans">
              {stats.ingestRate}{' '}
              <span className="text-sm font-normal text-slate-300">pkt/m</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-1">
              Local Queue: {gateway.localQueueSize} unsynced
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-950 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>SQLite Offline DB</span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 3. DIGITAL GEOTECHNICAL SLOPE TWIN & BOREHOLE CROSS-SECTION */}
      <SlopeTopographyVisualizer
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onSelectNode={(id) => setSelectedNodeId(id)}
        systemRisk={stats.systemHealth}
      />

      {/* 4. RISK TIME CHART & GEOTECHNICAL RISK DISTRIBUTION (SIDE-BY-SIDE) */}
      <RiskDistributionAndTimeline
        history={activeNode?.history || []}
        currentRiskScore={stats.currentRiskScore}
        systemRisk={stats.systemHealth}
        nodeName={activeNode?.name || 'Node 01'}
      />

      {/* 5. KINEMATIC HORIZON & BOREHOLE INCLINOMETER INSTRUMENTS */}
      {activeNode && <KinematicInstruments node={activeNode} />}

      {/* 6. PRIMARY ACCELEROMETER & POTENTIOMETER TELEMETRY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: MPU6050 3-Axis Accelerometer */}
        <div className="p-5 rounded-2xl bg-[#0d1611] border border-emerald-900/40 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  MPU6050 3-Axis Accelerometer ({activeNode?.name || 'Node 01'})
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {activeNode?.zone}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Ax (Transverse Shear), Ay (Slope Thrust), Az (Vertical Gravity) in m/s²
              </p>
            </div>

            {/* Time Filter */}
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
              {(['5m', '30m', '1h'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-0.5 rounded-lg cursor-pointer ${
                    timeRange === r
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[-2, 12]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="ax"
                  name="Ax (Transverse)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ay"
                  name="Ay (Thrust)"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="az"
                  name="Az (Vertical)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 2: Potentiometer Physical Shear Displacement */}
        <div className="p-5 rounded-2xl bg-[#0d1611] border border-emerald-900/40 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Potentiometer Physical Displacement ({activeNode?.name || 'Node 01'})
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  EXTENSOMETER
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Direct borehole displacement in mm (Potentiometer ADC calibration)
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400">
              Current: {activeNode?.displacementMm.toFixed(2)} mm
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dispData}>
                <defs>
                  <linearGradient id="dispGradOverview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 15]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="displacement"
                  name="Displacement (mm)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dispGradOverview)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7. DATA PIPELINE STAGES STRIP */}
      <div className="p-4 rounded-2xl bg-[#0d1611] border border-emerald-900/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            End-to-End Hardware &amp; Cloud Telemetry Pipeline
          </span>
          <button
            onClick={() => setActivePage('pipeline')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            <span>Diagnostics Hub</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {pipelineStages.map((stage, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
            >
              <span className="text-[11px] text-slate-300 font-medium truncate">
                {stage.label}
              </span>
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    stage.status === 'ONLINE'
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                      : stage.status === 'DEGRADED'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                />
                <span className="text-xs font-mono font-bold text-white">
                  {stage.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. RECENT ACTIVE ALERTS & THRESHOLD EVENTS */}
      <div className="p-5 rounded-2xl bg-[#0d1611] border border-emerald-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Recent Hazard Alerts &amp; Threshold Events
            </h3>
          </div>
          <button
            onClick={() => setActivePage('alerts')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            <span>All Alerts</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-300 font-mono">
            No active alarms. All monitored slope sensors are operating within nominal baseline limits.
          </div>
        ) : (
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <div>
                    <span className="font-semibold text-white">{alert.what}</span>
                    <div className="text-[11px] text-slate-400">
                      {alert.nodeName} • {alert.where} • {alert.when}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => openNodeTelemetry(alert.nodeId)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 text-xs font-semibold cursor-pointer"
                  >
                    Inspect Node
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
