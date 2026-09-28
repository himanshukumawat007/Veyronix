export type NodeStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
export type PipelineStageStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';
export type DataSourceMode = 'LIVE' | 'DEMO';

export interface MPU6050Data {
  accX: number; // m/s^2
  accY: number;
  accZ: number;
  gyroX: number; // deg/s
  gyroY: number;
  gyroZ: number;
  tiltDeg: number;
  magnitude: number; // sqrt(ax^2 + ay^2 + az^2)
  deviation: number; // abs(magnitude - 9.81)
}

export interface TelemetryPoint {
  time: string;
  timestamp?: string;
  nodeId?: string;
  ax: number;
  ay: number;
  az: number;
  pot: number; // Raw potentiometer reading (e.g. 0-1023)
  displacement: number; // Calibrated displacement in mm
  movement: number; // Index 0-100
  magnitude: number; // Acceleration magnitude
  deviation: number; // Deviation from 9.81 m/s^2
  tilt?: number; // deg
  rssi?: number; // dBm
  accX: number;
  accY: number;
  accZ: number;
  riskScore?: number;
  riskStatus?: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface SensorNode {
  id: string;
  name: string;
  zone: string;
  status: NodeStatus;
  movementLevel: 'Normal' | 'Moderate' | 'Severe' | 'None';
  displacementMm: number;
  displacementTrend: 'stable' | 'increasing' | 'decreasing';
  signal: 'Good' | 'Fair' | 'Poor' | 'Lost';
  rssi: number; // dBm
  batteryPct: number;
  lastUpdated: string;
  potValue: number; // Current potentiometer reading
  location: {
    x: number; // percentage on map
    y: number;
    elevationMeters: number;
    zoneLabel: string;
  };
  mpu6050: MPU6050Data;
  history: TelemetryPoint[];
}

export interface GatewayInfo {
  id: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  model: string;
  connectedNodesCount: number;
  totalNodesCount: number;
  packetsReceived: number;
  packetsSent: number;
  signalQuality: string;
  wifiStatus: 'Connected' | 'Disconnected' | 'Reconnecting';
  ipAddress: string;
  firmware: string;
  lastCommunication: string;
  serialPort: string;
  baudRate: number;
  localDbStatus: 'CONNECTED' | 'SYNCING' | 'OFFLINE';
  localQueueSize: number;
  alarmState: {
    color: 'GREEN' | 'YELLOW' | 'RED';
    level: 'NORMAL' | 'WARNING' | 'CRITICAL';
    buzzerActive: boolean;
    lastTriggered: string;
  };
  packetHistory: Array<{
    time: string;
    rate: number;
    dropped: number;
  }>;
}

export interface AlertItem {
  id: string;
  nodeId: string;
  nodeName: string;
  zone: string;
  severity: 'CRITICAL' | 'WARNING' | 'RESOLVED';
  what: string;
  where: string;
  when: string;
  message?: string;
  timestamp: number | string;
  acknowledged: boolean;
  sensorReadings?: {
    ax: number;
    ay: number;
    az: number;
    pot: number;
    magnitude: number;
    deviation: number;
  };
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number; // 0 to 1
  label: string;
  description: string;
}

export interface AIPredictionData {
  riskLevel: 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK';
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  riskScore: number; // 0-100%
  confidence: number; // 0-100%
  predictedCondition: string;
  shortExplanation: string;
  modelType: string;
  isSyntheticTrained: boolean;
  featureImportance: FeatureImportanceItem[];
  factors: {
    movement: string;
    displacement: string;
    confidence: string;
  };
  forecast: {
    status: 'available' | 'collecting_data';
    message?: string;
    points: Array<{
      time: string;
      projectedRisk: number;
      projectedDisp: number;
      confidenceRange: [number, number];
    }>;
  };
  trend: Array<{
    time: string;
    riskScore: number; // 0-100
    level: string;
  }>;
  aiConnected: boolean;
  source: string;
  timestamp: string;
}

export interface PipelineHealth {
  sensor: PipelineStageStatus;
  lora: PipelineStageStatus;
  mega: PipelineStageStatus;
  pi: PipelineStageStatus;
  database: PipelineStageStatus;
  cloud: PipelineStageStatus;
  ai: PipelineStageStatus;
  dashboard: PipelineStageStatus;
  lastIngestTime?: string;
  ingestRatePerMin: number;
  bufferBacklogCount: number;
}

export interface GrafanaConfig {
  configured: boolean;
  url: string;
  orgId: string;
  datasourceUid: string;
  hasApiKey: boolean;
  dashboardUid: string;
  postgres: {
    configured: boolean;
    host: string;
    database: string;
    user: string;
    table: string;
  };
}

export type ActivePage =
  | 'overview'
  | 'analytics'
  | 'ai'
  | 'grafana'
  | 'nodes'
  | 'alerts'
  | 'pipeline'
  | 'map'
  | 'status'
  | 'gateway'
  | 'system';

export type SimulationScenario = 'normal' | 'warning' | 'critical' | 'mixed';

