/** Frontend mirror of the platform API contracts (server/platform/*). */

export type RiskLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
export type Health = 'HEALTHY' | 'WARNING' | 'FAULT' | 'NOT_FITTED';
export type ServiceState = 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
export type Scenario = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'SENSOR_FAULT';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type Role = 'AUTHORITY' | 'MINE_OPERATOR';

export interface DemoState {
  dataMode: 'DEMO';
  scenario: Scenario;
  internetOnline: boolean;
  synchronizing: boolean;
  syncedUntil: number;
  prototypeMode: 'DEMO' | 'LIVE';
  serverTime: number;
  lastTick: number;
}

export interface Meta {
  name: string;
  version: string;
  demo: DemoState;
  grafana: { publicUrl: string; dashboardUid: string; dashboardUrl: string; configured: boolean };
  openaiConfigured: boolean;
  predictionModel: string;
  demoControlsPublic: boolean;
}

export interface PublicSummary {
  overall: RiskLevel;
  headline: string;
  totalZones: number;
  activeZones: number;
  normalZones: number;
  warningZones: number;
  criticalZones: number;
  activeAlerts: number;
  onlineNodes: number;
  totalNodes: number;
  lastUpdate: number | null;
  stale: boolean;
  demo: DemoState;
}

export interface PublicZone {
  id: string;
  label: string;
  siteName: string;
  name: string;
  regionId: string;
  regionName: string;
  lat: number;
  lng: number;
  description: string;
  status: RiskLevel;
  message: string;
  activeNodes: number;
  lastUpdate: number | null;
  stale: boolean;
  currentWarning: { alertId: string; severity: 'WARNING' | 'CRITICAL'; title: string; recommendation: string; since: number } | null;
  isDemo: boolean;
}

export interface PublicRegion {
  id: string;
  name: string;
  status: RiskLevel;
  zoneCount: number;
  warningZones: number;
  criticalZones: number;
  activeAlerts: number;
  zones: Array<{ id: string; label: string; status: RiskLevel }>;
}

export interface PublicAlert {
  id: string;
  zoneId: string;
  severity: 'WARNING' | 'CRITICAL';
  location: string;
  regionName: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  recommendation: string;
  detectedAt: number;
  updatedAt: number;
  status: AlertStatus;
  conditionCleared: boolean;
  isDemo: boolean;
}

export interface SessionUser {
  username: string;
  role: Role;
  name: string;
  organisation: string;
  expiresAt: number;
}

export interface SensorReading {
  t: number;
  tiltDeg: number;
  vibration: number;
  displacementMm: number;
  crackMm: number | null;
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

export interface FusionResult {
  score: number;
  status: RiskLevel;
  elevatedSignals: string[];
  corroborated: boolean;
  suppressedSingleSensor: boolean;
  note: string;
}

export interface NodeView {
  id: string;
  zoneId: string;
  name: string;
  lat: number;
  lng: number;
  status: RiskLevel;
  batteryPct: number;
  rssi: number;
  lastSeen: number | null;
  latest: SensorReading | null;
  health: SensorHealth;
  fusion: FusionResult | null;
  dataSource: 'DEMO' | 'LIVE';
  edgeClassifier: { status: string; riskScore: number; confidence: number; model: string } | null;
  gatewayId?: string;
  zoneLabel?: string;
  thresholds?: { warningScore: number; criticalScore: number };
  limits?: Record<'tiltDeg' | 'vibration' | 'displacementMm' | 'crackMm', { warn: number; crit: number; label: string }>;
}

export interface ZoneView {
  id: string;
  name: string;
  siteName: string;
  label: string;
  regionId: string;
  regionName: string;
  lat: number;
  lng: number;
  description: string;
  dataSource: 'DEMO' | 'LIVE';
  publicVisible: boolean;
  monitoringEnabled: boolean;
  thresholds: { warningScore: number; criticalScore: number };
  gatewayId: string;
  status: RiskLevel;
  riskScore: number;
  activeNodes: number;
  totalNodes: number;
  offlineNodes: number;
  lastUpdate: number | null;
  stale: boolean;
  activeAlert: { id: string; severity: 'WARNING' | 'CRITICAL'; status: AlertStatus } | null;
}

export interface GatewayView {
  id: string;
  zoneId: string;
  zoneLabel?: string;
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
  nodes?: NodeView[];
}

export interface Prediction {
  zoneId: string;
  zoneLabel?: string;
  regionName?: string;
  currentLevel: RiskLevel;
  currentScore: number;
  predictedLevel: RiskLevel;
  predictedScore: number;
  horizonMinutes: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  confidence: number;
  timeline: Array<{ minutesAhead: number; score: number; level: RiskLevel }>;
  history: Array<{ t: number; score: number }>;
  model: string;
  simulated: boolean;
  explanation: string;
}

export interface ZoneDetail extends ZoneView {
  nodes: NodeView[];
  gateway: GatewayView | null;
  prediction: Prediction | null;
}

export interface AlertChannelState {
  channel: 'LOCAL_ALARM' | 'DASHBOARD' | 'SMS' | 'EMAIL';
  state: 'SENT' | 'QUEUED' | 'NOT_CONFIGURED';
  at: number | null;
  simulated: boolean;
}

export interface AlertRecord {
  id: string;
  zoneId: string;
  zoneLabel: string;
  regionName: string;
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

export interface Incident {
  id: string;
  zoneId: string;
  zoneLabel: string;
  regionName: string;
  severity: 'WARNING' | 'CRITICAL';
  trigger: string;
  startedAt: number;
  endedAt: number | null;
  status: 'OPEN' | 'CLOSED';
  durationMin: number;
  events: Array<{ type: 'DETECTION' | 'ESCALATION' | 'ALERT' | 'ACKNOWLEDGEMENT' | 'RESOLUTION'; at: number; note: string }>;
  isDemo: boolean;
}

export interface RegionView {
  id: string;
  name: string;
  state: string;
  status: RiskLevel;
  zoneCount: number;
  nodes: number;
  activeNodes: number;
  warningZones: number;
  criticalZones: number;
  activeAlerts: number;
  maxRiskScore: number;
  zones: ZoneView[];
}

export interface SystemHealth {
  services: Array<{ id: string; name: string; state: ServiceState; detail: string }>;
  checkedAt: number;
  demo: DemoState;
}

export interface Report {
  period: 'daily' | 'weekly';
  generatedAt: number;
  from: number;
  isDemo: boolean;
  totals: { zones: number; alerts: number; criticalAlerts: number; warningAlerts: number; incidents: number; openIncidents: number; nodesOnline: number; nodesTotal: number };
  zones: Array<{ zoneId: string; zone: string; region: string; currentStatus: RiskLevel; avgRiskScore: number; maxRiskScore: number; alerts: number; activeNodes: number; totalNodes: number }>;
  riskEvents: Array<{ id: string; zone: string; severity: string; trigger: string; startedAt: number; status: string }>;
  alertHistory: Array<{ id: string; zone: string; severity: string; detectedAt: number; status: string; acknowledgedBy: string | null; resolvedAt: number | null }>;
  nodeHealth: { offline: number; batteryIssues: number; loraIssues: number; sensorWarnings: number };
  dailyTrend: Array<{ date: string; avgScore: number; maxScore: number; alerts: number }>;
}

export interface AiSummary {
  zoneId: string;
  text: string;
  source: string;
  generatedAt: number;
}
