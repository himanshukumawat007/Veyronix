import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SensorNode,
  GatewayInfo,
  AlertItem,
  AIPredictionData,
  ActivePage,
  SimulationScenario,
  NodeStatus,
  DataSourceMode,
  PipelineHealth,
} from '../types';
import {
  INITIAL_NODES,
  INITIAL_GATEWAY,
  INITIAL_ALERTS,
  INITIAL_AI_PREDICTION,
} from '../services/telemetryData';

interface MonitoringContextType {
  nodes: SensorNode[];
  gateway: GatewayInfo;
  alerts: AlertItem[];
  aiPrediction: AIPredictionData;
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedNode: SensorNode | null;
  dataSourceMode: DataSourceMode;
  setDataSourceMode: (mode: DataSourceMode) => Promise<void>;
  pipelineHealth: PipelineHealth;
  connectionStatus: 'LIVE' | 'PAUSED' | 'DISCONNECTED' | 'DELAYED';
  setConnectionStatus: (status: 'LIVE' | 'PAUSED' | 'DISCONNECTED' | 'DELAYED') => void;
  lastSyncTime: Date;
  scenario: SimulationScenario;
  setScenario: (scenario: SimulationScenario) => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  triggerAiEvaluation: () => Promise<void>;
  isEvaluatingAi: boolean;
  inspectModalNode: SensorNode | null;
  setInspectModalNodeId: (id: string | null) => void;
  openNodeTelemetry: (nodeId: string) => void;
  silenceAlarmBuzzer: () => Promise<void>;
  ingestTestPacket: (ax: number, ay: number, az: number, pot: number) => Promise<void>;
  stats: {
    total: number;
    online: number;
    normal: number;
    warning: number;
    critical: number;
    offline: number;
    systemHealth: 'NORMAL' | 'WARNING' | 'CRITICAL';
    ingestRate: number;
    currentRiskScore: number;
  };
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export const MonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<SensorNode[]>(INITIAL_NODES);
  const [gateway, setGateway] = useState<GatewayInfo>(INITIAL_GATEWAY);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [aiPrediction, setAiPrediction] = useState<AIPredictionData>(INITIAL_AI_PREDICTION);
  const [activePage, setActivePage] = useState<ActivePage>('overview');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-01');
  const [inspectModalNodeId, setInspectModalNodeId] = useState<string | null>(null);
  const [dataSourceMode, setDataSourceModeState] = useState<DataSourceMode>('DEMO');
  const [connectionStatus, setConnectionStatus] = useState<'LIVE' | 'PAUSED' | 'DISCONNECTED' | 'DELAYED'>('LIVE');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [scenario, setScenarioState] = useState<SimulationScenario>('mixed');
  const [isEvaluatingAi, setIsEvaluatingAi] = useState<boolean>(false);

  const [pipelineHealth, setPipelineHealth] = useState<PipelineHealth>({
    sensor: 'ONLINE',
    lora: 'ONLINE',
    mega: 'ONLINE',
    pi: 'ONLINE',
    database: 'ONLINE',
    cloud: 'ONLINE',
    ai: 'ONLINE',
    dashboard: 'ONLINE',
    ingestRatePerMin: 24,
    bufferBacklogCount: 0,
  });

  const openNodeTelemetry = useCallback((nodeId: string) => {
    setInspectModalNodeId(nodeId);
    setSelectedNodeId(nodeId);
  }, []);

  const inspectModalNode = useMemo(() => {
    if (!inspectModalNodeId) return null;
    return nodes.find((n) => n.id === inspectModalNodeId) || null;
  }, [nodes, inspectModalNodeId]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return nodes[0] || null;
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null;
  }, [nodes, selectedNodeId]);

  // High-level system statistics
  const stats = useMemo(() => {
    let online = 0;
    let normal = 0;
    let warning = 0;
    let critical = 0;
    let offline = 0;

    nodes.forEach((n) => {
      if (n.status === 'OFFLINE') offline++;
      else {
        online++;
        if (n.status === 'CRITICAL') critical++;
        else if (n.status === 'WARNING') warning++;
        else normal++;
      }
    });

    const systemHealth: 'NORMAL' | 'WARNING' | 'CRITICAL' =
      critical > 0 ? 'CRITICAL' : warning > 0 ? 'WARNING' : 'NORMAL';

    const currentRiskScore =
      critical > 0
        ? Math.max(75, aiPrediction.riskScore)
        : warning > 0
        ? Math.max(45, aiPrediction.riskScore)
        : Math.min(28, aiPrediction.riskScore);

    return {
      total: nodes.length,
      online,
      normal,
      warning,
      critical,
      offline,
      systemHealth,
      ingestRate: pipelineHealth.ingestRatePerMin,
      currentRiskScore,
    };
  }, [nodes, aiPrediction.riskScore, pipelineHealth.ingestRatePerMin]);

  // Mode Switcher (LIVE vs DEMO)
  const setDataSourceMode = useCallback(async (newMode: DataSourceMode) => {
    setDataSourceModeState(newMode);
    try {
      await fetch('/api/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch {
      // Ignored in offline dev
    }
  }, []);

  // Silence physical Raspberry Pi alarm buzzer
  const silenceAlarmBuzzer = useCallback(async () => {
    setGateway((prev) => ({
      ...prev,
      alarmState: { ...prev.alarmState, buzzerActive: false },
    }));
    try {
      await fetch('/api/alarm/silence', { method: 'POST' });
    } catch {
      // Silent catch
    }
  }, []);

  // Ingest manual packet for testing
  const ingestTestPacket = useCallback(
    async (ax: number, ay: number, az: number, pot: number) => {
      try {
        const resp = await fetch('/api/telemetry/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            node_id: selectedNodeId || 'node-01',
            ax,
            ay,
            az,
            pot,
            is_synthetic: dataSourceMode === 'DEMO',
          }),
        });
        if (resp.ok) {
          // Immediately poll latest
          pollLatestTelemetry();
        }
      } catch {
        // Ignored
      }
    },
    [selectedNodeId, dataSourceMode]
  );

  // Scenario switch helper
  const setScenario = useCallback((newScenario: SimulationScenario) => {
    setScenarioState(newScenario);
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (newScenario === 'normal') {
          return {
            ...n,
            status: 'NORMAL' as NodeStatus,
            movementLevel: 'Normal' as const,
            displacementMm: 0.4,
            potValue: 18,
            mpu6050: {
              ...n.mpu6050,
              accX: 0.02,
              accY: 0.01,
              accZ: 9.81,
              magnitude: 9.81,
              deviation: 0.004,
            },
          };
        } else if (newScenario === 'warning') {
          if (n.id === 'node-02' || n.id === 'node-01') {
            return {
              ...n,
              status: 'WARNING' as NodeStatus,
              movementLevel: 'Moderate' as const,
              displacementMm: 4.6,
              potValue: 94,
              mpu6050: {
                ...n.mpu6050,
                accX: 0.38,
                accY: 0.42,
                accZ: 9.72,
                magnitude: 9.73,
                deviation: 0.076,
              },
            };
          }
          return n;
        } else if (newScenario === 'critical') {
          return {
            ...n,
            status: 'CRITICAL' as NodeStatus,
            movementLevel: 'Severe' as const,
            displacementMm: 15.8,
            potValue: 324,
            mpu6050: {
              ...n.mpu6050,
              accX: 1.54,
              accY: 1.82,
              accZ: 9.38,
              magnitude: 9.68,
              deviation: 0.126,
            },
          };
        }
        return n;
      })
    );
  }, []);

  // Poll latest telemetry from backend
  const pollLatestTelemetry = useCallback(async () => {
    try {
      const [latestRes, statusRes, alertRes] = await Promise.all([
        fetch('/api/sensors/latest'),
        fetch('/api/system/status'),
        fetch('/api/alerts'),
      ]);

      if (statusRes.ok) {
        const sysData = await statusRes.json();
        if (sysData.pipeline) setPipelineHealth(sysData.pipeline);
        if (sysData.mode) setDataSourceModeState(sysData.mode);
        if (sysData.alarm) {
          setGateway((prev) => ({
            ...prev,
            alarmState: sysData.alarm,
          }));
        }
      }

      if (alertRes.ok) {
        const alertData = await alertRes.json();
        if (Array.isArray(alertData) && alertData.length > 0) {
          setAlerts(alertData);
        }
      }

      if (latestRes.ok) {
        const latestData = await latestRes.json();
        const records = Array.isArray(latestData) ? latestData : [latestData];

        if (records.length > 0) {
          setNodes((prevNodes) =>
            prevNodes.map((node) => {
              const rec = records.find((r: any) => r.node_id === node.id);
              if (!rec) return node;

              const timeStr = new Date(rec.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              const newPoint = {
                time: timeStr.slice(0, 5),
                timestamp: rec.timestamp,
                ax: rec.ax,
                ay: rec.ay,
                az: rec.az,
                pot: rec.pot,
                displacement: rec.displacement_mm,
                movement:
                  rec.risk_status === 'CRITICAL' ? 88 : rec.risk_status === 'WARNING' ? 48 : 12,
                magnitude: rec.acceleration_magnitude,
                deviation: rec.acceleration_deviation,
                tilt: rec.tilt_deg,
                rssi: node.rssi,
                accX: rec.ax,
                accY: rec.ay,
                accZ: rec.az,
                riskScore: rec.risk_score,
                riskStatus: rec.risk_status,
              };

              const updatedHistory = [...node.history.slice(-14), newPoint];

              return {
                ...node,
                status: rec.risk_status,
                displacementMm: rec.displacement_mm,
                potValue: rec.pot,
                lastUpdated: '1 sec ago',
                mpu6050: {
                  ...node.mpu6050,
                  accX: rec.ax,
                  accY: rec.ay,
                  accZ: rec.az,
                  magnitude: rec.acceleration_magnitude,
                  deviation: rec.acceleration_deviation,
                  tiltDeg: rec.tilt_deg,
                },
                history: updatedHistory,
              };
            })
          );
        }
      }
    } catch {
      // Offline fallback
    }
  }, []);

  // AI Evaluation fetch
  const triggerAiEvaluation = useCallback(async () => {
    setIsEvaluatingAi(true);
    try {
      const avgDisplacement =
        nodes.reduce((acc, curr) => acc + curr.displacementMm, 0) / (nodes.length || 1);

      const response = await fetch('/api/ai-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({
            id: n.id,
            name: n.name,
            zone: n.zone,
            status: n.status,
            displacement: n.displacementMm,
            movement: n.movementLevel,
            tilt: n.mpu6050.tiltDeg,
          })),
          criticalCount: stats.critical,
          warningCount: stats.warning,
          avgDisplacement,
        }),
      });

      if (!response.ok) throw new Error('AI evaluation request failed');
      const data = await response.json();

      const computedRisk =
        data.riskLevel === 'HIGH RISK' ? 85 : data.riskLevel === 'MODERATE RISK' ? 52 : 18;

      setAiPrediction((prev) => ({
        ...prev,
        riskLevel: data.riskLevel,
        status: data.riskLevel === 'HIGH RISK' ? 'CRITICAL' : data.riskLevel === 'MODERATE RISK' ? 'WARNING' : 'NORMAL',
        riskScore: computedRisk,
        shortExplanation: data.shortExplanation,
        factors: data.factors,
        trend: [
          ...prev.trend.slice(-6),
          {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            riskScore: computedRisk,
            level: data.riskLevel.replace(' RISK', ''),
          },
        ],
        aiConnected: Boolean(data.aiConnected),
        source: data.source || (data.aiConnected ? 'GEMINI 3.6 FLASH' : 'LOCAL ML CLASSIFIER'),
        timestamp: 'Just now',
      }));
    } catch {
      setAiPrediction((prev) => ({
        ...prev,
        aiConnected: false,
        source: 'LOCAL ML CLASSIFIER (Gemini Offline)',
        timestamp: 'Just now',
      }));
    } finally {
      setIsEvaluatingAi(false);
    }
  }, [nodes, stats.critical, stats.warning]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    try {
      await fetch('/api/alerts/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId }),
      });
    } catch {
      // Ignored
    }
  }, []);

  // Periodic real-time interval (2.5s)
  useEffect(() => {
    if (connectionStatus !== 'LIVE') return;

    const interval = setInterval(() => {
      setLastSyncTime(new Date());
      pollLatestTelemetry();
    }, 2500);

    return () => clearInterval(interval);
  }, [connectionStatus, pollLatestTelemetry]);

  return (
    <MonitoringContext.Provider
      value={{
        nodes,
        gateway,
        alerts,
        aiPrediction,
        activePage,
        setActivePage,
        selectedNodeId,
        setSelectedNodeId,
        selectedNode,
        dataSourceMode,
        setDataSourceMode,
        pipelineHealth,
        connectionStatus,
        setConnectionStatus,
        lastSyncTime,
        scenario,
        setScenario,
        acknowledgeAlert,
        triggerAiEvaluation,
        isEvaluatingAi,
        inspectModalNode,
        setInspectModalNodeId,
        openNodeTelemetry,
        silenceAlarmBuzzer,
        ingestTestPacket,
        stats,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = (): MonitoringContextType => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};
