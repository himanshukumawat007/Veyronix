/**
 * BHU-DRISHTI Platform — shared domain types (backend).
 * The frontend mirrors these in src/platform/services/types.ts.
 */

export type RiskLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
export type Health = 'HEALTHY' | 'WARNING' | 'FAULT' | 'NOT_FITTED';
export type ServiceState = 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
export type Scenario = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'SENSOR_FAULT';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type Role = 'AUTHORITY' | 'MINE_OPERATOR';
export type DataSource = 'DEMO' | 'LIVE';

export interface Region {
  id: string;
  name: string;
  state: string;
}

export interface Zone {
  id: string;
  name: string;
  siteName: string;
  regionId: string;
  lat: number;
  lng: number;
  gatewayId: string;
  description: string;
  /** Operator-managed */
  monitoringEnabled: boolean;
  thresholds: { warningScore: number; criticalScore: number };
  /** DEMO = simulated by the platform engine; LIVE = fed by real hardware telemetry */
  dataSource: DataSource;
}

export interface SensorReading {
  t: number; // epoch ms
  tiltDeg: number;
  vibration: number; // m/s² (acceleration deviation / piezo RMS proxy)
  displacementMm: number;
  crackMm: number | null; // null when the sensor is not fitted
  riskScore: number;
  status: RiskLevel;
}

export interface SensorHealth {
  mpu6050: Health;
  piezo: Health;
  potentiometer: Health;
  battery: Health;
  lora: Health;
}

export interface NodeState {
  id: string;
  zoneId: string;
  name: string;
  lat: number;
  lng: number;
  status: RiskLevel;
  batteryPct: number;
  rssi: number;
  lastSeen: number;
  latest: SensorReading | null;
  health: SensorHealth;
  /** Fusion diagnostics for the latest reading */
  fusion: FusionResult | null;
  history: SensorReading[];
  dataSource: DataSource;
}

export interface FusionResult {
  score: number;
  status: RiskLevel;
  elevatedSignals: string[];
  corroborated: boolean;
  suppressedSingleSensor: boolean;
  note: string;
}

export interface AlertChannelState {
  channel: 'LOCAL_ALARM' | 'DASHBOARD' | 'SMS' | 'EMAIL';
  state: 'SENT' | 'QUEUED' | 'NOT_CONFIGURED';
  at: number | null;
  /** true when delivery is simulated (no SMS/email provider configured in the prototype) */
  simulated: boolean;
}

export interface AlertRecord {
  id: string; // BD-1024
  zoneId: string;
  severity: 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string;
  detectedAt: number;
  updatedAt: number;
  status: AlertStatus;
  acknowledgedBy: string | null;
  acknowledgedAt: number | null;
  resolvedBy: string | null;
  resolvedAt: number | null;
  conditionCleared: boolean;
  peakRiskScore: number;
  channels: AlertChannelState[];
  incidentId: string;
  isDemo: boolean;
}

export interface IncidentEvent {
  type: 'DETECTION' | 'ESCALATION' | 'ALERT' | 'ACKNOWLEDGEMENT' | 'RESOLUTION';
  at: number;
  note: string;
}

export interface Incident {
  id: string;
  zoneId: string;
  severity: 'WARNING' | 'CRITICAL';
  trigger: string;
  startedAt: number;
  endedAt: number | null;
  status: 'OPEN' | 'CLOSED';
  events: IncidentEvent[];
  isDemo: boolean;
}

export interface GatewayState {
  id: string;
  zoneId: string;
  hardware: string;
  loraStatus: 'ONLINE' | 'OFFLINE';
  internet: 'ONLINE' | 'OFFLINE';
  localDb: 'HEALTHY' | 'DEGRADED';
  localMonitoring: ServiceState;
  grafana: ServiceState;
  remoteAlerts: ServiceState;
  cloudSync: 'SYNCED' | 'SYNCHRONIZING' | 'PAUSED';
  backlog: number;
  cpuPct: number;
  memoryPct: number;
  storagePct: number;
  temperatureC: number;
  lastSync: number;
  uptimeSec: number;
  localAlarm: 'GREEN' | 'YELLOW' | 'RED';
  buzzerActive: boolean;
}

export interface Prediction {
  zoneId: string;
  currentLevel: RiskLevel;
  currentScore: number;
  predictedLevel: RiskLevel;
  predictedScore: number;
  horizonMinutes: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  confidence: number; // 0-100
  timeline: Array<{ minutesAhead: number; score: number; level: RiskLevel }>;
  history: Array<{ t: number; score: number }>;
  model: string;
  simulated: boolean;
  explanation: string;
}
