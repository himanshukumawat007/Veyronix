import { SensorNode, GatewayInfo, AlertItem, AIPredictionData, TelemetryPoint } from '../types';

function generateInitialHistory(baseDisp: number, baseMove: number): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  for (let i = 12; i >= 0; i--) {
    const t = new Date(now - i * 15000);
    const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const disp = Number((baseDisp + (Math.sin(i * 0.5) * 0.08)).toFixed(2));
    const ax = Number((0.02 + Math.sin(i * 0.3) * 0.02).toFixed(3));
    const ay = Number((0.01 + Math.cos(i * 0.3) * 0.02).toFixed(3));
    const az = Number((9.81 + Math.sin(i * 0.2) * 0.02).toFixed(3));
    const mag = Number(Math.sqrt(ax * ax + ay * ay + az * az).toFixed(3));
    const dev = Number(Math.abs(mag - 9.806).toFixed(3));
    const pot = Math.round((disp / 50.0) * 1023);

    points.push({
      time: timeStr,
      timestamp: t.toISOString(),
      ax,
      ay,
      az,
      pot,
      displacement: disp,
      movement: baseMove + Math.round(Math.sin(i * 0.8) * 3),
      magnitude: mag,
      deviation: dev,
      tilt: 0.8,
      rssi: -62,
      accX: ax,
      accY: ay,
      accZ: az,
      riskScore: 16,
      riskStatus: 'NORMAL',
    });
  }
  return points;
}

export const INITIAL_NODES: SensorNode[] = [
  {
    id: 'node-01',
    name: 'Node 01',
    zone: 'Zone A — Ridge Crest',
    status: 'NORMAL',
    movementLevel: 'Normal',
    displacementMm: 0.4,
    displacementTrend: 'stable',
    signal: 'Good',
    rssi: -62,
    batteryPct: 98,
    lastUpdated: '1 sec ago',
    potValue: 18,
    location: { x: 22, y: 18, elevationMeters: 412, zoneLabel: 'Zone A' },
    mpu6050: {
      accX: 0.02,
      accY: 0.01,
      accZ: 9.81,
      gyroX: 0.01,
      gyroY: 0.02,
      gyroZ: 0.0,
      tiltDeg: 0.8,
      magnitude: 9.81,
      deviation: 0.004,
    },
    history: generateInitialHistory(0.4, 12),
  },
  {
    id: 'node-02',
    name: 'Node 02',
    zone: 'Zone A — Ridge Slope',
    status: 'NORMAL',
    movementLevel: 'Normal',
    displacementMm: 0.6,
    displacementTrend: 'stable',
    signal: 'Good',
    rssi: -65,
    batteryPct: 94,
    lastUpdated: '2 sec ago',
    potValue: 24,
    location: { x: 38, y: 24, elevationMeters: 398, zoneLabel: 'Zone A' },
    mpu6050: {
      accX: 0.04,
      accY: 0.03,
      accZ: 9.79,
      gyroX: 0.02,
      gyroY: -0.01,
      gyroZ: 0.01,
      tiltDeg: 1.1,
      magnitude: 9.79,
      deviation: 0.016,
    },
    history: generateInitialHistory(0.6, 14),
  },
];

export const INITIAL_GATEWAY: GatewayInfo = {
  id: 'pi3b-gateway-01',
  status: 'ONLINE',
  model: 'Raspberry Pi 3B (ARMv7) + Arduino Mega 2560 LoRa',
  connectedNodesCount: 2,
  totalNodesCount: 2,
  packetsReceived: 24892,
  packetsSent: 24876,
  signalQuality: 'Excellent (-64 dBm)',
  wifiStatus: 'Connected',
  ipAddress: '192.168.1.142',
  firmware: 'v2.4.1-bhu-pi3b',
  lastCommunication: '1 sec ago',
  serialPort: '/dev/ttyACM0',
  baudRate: 115200,
  localDbStatus: 'CONNECTED',
  localQueueSize: 0,
  alarmState: {
    color: 'GREEN',
    level: 'NORMAL',
    buzzerActive: false,
    lastTriggered: new Date().toISOString(),
  },
  packetHistory: [
    { time: '12:00', rate: 24, dropped: 0 },
    { time: '12:01', rate: 25, dropped: 0 },
    { time: '12:02', rate: 24, dropped: 1 },
    { time: '12:03', rate: 26, dropped: 0 },
    { time: '12:04', rate: 23, dropped: 0 },
    { time: '12:05', rate: 25, dropped: 0 },
    { time: '12:06', rate: 24, dropped: 0 },
    { time: '12:07', rate: 25, dropped: 0 },
  ],
};

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'alert-1',
    nodeId: 'node-02',
    nodeName: 'Node 02',
    zone: 'Zone A — Ridge Slope',
    severity: 'WARNING',
    what: 'Localized embankment creep and elevated subsurface vibration',
    where: 'Zone A — Embankment Slope',
    when: '14 min ago',
    timestamp: Date.now() - 14 * 60 * 1000,
    acknowledged: false,
    sensorReadings: {
      ax: 0.35,
      ay: 0.41,
      az: 9.72,
      pot: 85,
      magnitude: 9.73,
      deviation: 0.076,
    },
  },
];

export const INITIAL_AI_PREDICTION: AIPredictionData = {
  riskLevel: 'LOW RISK',
  status: 'NORMAL',
  riskScore: 16.4,
  confidence: 94.2,
  predictedCondition: 'Stable geotechnical baseline',
  shortExplanation: 'Ground movement and 3-axis vibrations are within nominal threshold.',
  modelType: 'Random Forest (Geotechnical Classifier)',
  isSyntheticTrained: true,
  featureImportance: [
    { feature: 'acceleration_deviation', importance: 0.38, label: 'Acceleration Deviation (Δg)', description: 'Variation from nominal 9.81 m/s²' },
    { feature: 'pot', importance: 0.28, label: 'Potentiometer (Displacement)', description: 'Physical borehole shear displacement' },
    { feature: 'ax', importance: 0.14, label: 'Ax (Transverse Shear)', description: 'Cross-slope horizontal acceleration' },
    { feature: 'ay', importance: 0.12, label: 'Ay (Down-Slope Thrust)', description: 'Down-dip gravitational slip acceleration' },
    { feature: 'az', importance: 0.08, label: 'Az (Vertical Lift / Settlement)', description: 'Vertical compaction or settlement' },
  ],
  forecast: {
    status: 'available',
    points: [
      { time: '+15m', projectedRisk: 17.2, projectedDisp: 0.42, confidenceRange: [12, 22] },
      { time: '+30m', projectedRisk: 18.0, projectedDisp: 0.45, confidenceRange: [14, 25] },
      { time: '+45m', projectedRisk: 18.5, projectedDisp: 0.48, confidenceRange: [15, 27] },
      { time: '+60m', projectedRisk: 19.1, projectedDisp: 0.50, confidenceRange: [15, 30] },
    ],
  },
  factors: {
    movement: 'Stable (0.02 m/s² dynamic shear)',
    displacement: '0.4 mm (Baseline nominal)',
    confidence: '94% (Random Forest Model)',
  },
  trend: [
    { time: '12:00', riskScore: 15, level: 'LOW' },
    { time: '12:05', riskScore: 16, level: 'LOW' },
    { time: '12:10', riskScore: 14, level: 'LOW' },
    { time: '12:15', riskScore: 17, level: 'LOW' },
    { time: '12:20', riskScore: 16, level: 'LOW' },
  ],
  aiConnected: true,
  source: 'GEMINI 3.6 FLASH + RF CLASSIFIER',
  timestamp: 'Just now',
};
