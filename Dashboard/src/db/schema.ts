import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Define the 'users' table using Firebase Auth UID.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('geotech_engineer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define the 'sensor_nodes' table.
export const sensorNodes = pgTable('sensor_nodes', {
  id: text('id').primaryKey(), // e.g. 'node-01', 'node-02'
  name: text('name').notNull(),
  zone: text('zone').notNull(),
  elevationMeters: doublePrecision('elevation_meters').default(400),
  zoneLabel: text('zone_label').default('Zone A'),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  status: text('status').default('NORMAL').notNull(),
  batteryPct: integer('battery_pct').default(100).notNull(),
  rssi: integer('rssi').default(-60).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define the 'telemetry_records' table with indexes on node_id and timestamp.
export const telemetryRecords = pgTable(
  'telemetry_records',
  {
    id: text('id').primaryKey(),
    nodeId: text('node_id')
      .references(() => sensorNodes.id)
      .notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    ax: doublePrecision('ax').notNull(),
    ay: doublePrecision('ay').notNull(),
    az: doublePrecision('az').notNull(),
    pot: doublePrecision('pot').notNull(),
    displacementMm: doublePrecision('displacement_mm').notNull(),
    accelerationMagnitude: doublePrecision('acceleration_magnitude').notNull(),
    accelerationDeviation: doublePrecision('acceleration_deviation').notNull(),
    tiltDeg: doublePrecision('tilt_deg').notNull(),
    riskStatus: text('risk_status').notNull(),
    riskScore: doublePrecision('risk_score').notNull(),
    modelConfidence: doublePrecision('model_confidence').notNull(),
    isSynthetic: boolean('is_synthetic').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_telemetry_node_id').on(table.nodeId),
    index('idx_telemetry_timestamp').on(table.timestamp),
  ]
);

// Define the 'ai_predictions' table with indexes on node_id and timestamp.
export const aiPredictions = pgTable(
  'ai_predictions',
  {
    id: text('id').primaryKey(),
    nodeId: text('node_id')
      .references(() => sensorNodes.id)
      .notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    status: text('status').notNull(), // 'NORMAL' | 'WARNING' | 'CRITICAL'
    riskScore: doublePrecision('risk_score').notNull(),
    confidence: doublePrecision('confidence').notNull(),
    modelVersion: text('model_version').default('v1').notNull(),
    prediction: text('prediction').notNull(),
    features: text('features'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_ai_predictions_node_id').on(table.nodeId),
    index('idx_ai_predictions_timestamp').on(table.timestamp),
  ]
);

// Define the 'alerts' table with indexes on node_id and timestamp.
export const alerts = pgTable(
  'alerts',
  {
    id: text('id').primaryKey(),
    nodeId: text('node_id')
      .references(() => sensorNodes.id)
      .notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    level: text('level').notNull(), // 'WARNING' | 'CRITICAL'
    message: text('message').notNull(),
    details: text('details'),
    acknowledged: boolean('acknowledged').default(false).notNull(),
    acknowledgedBy: text('acknowledged_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_alerts_node_id').on(table.nodeId),
    index('idx_alerts_timestamp').on(table.timestamp),
  ]
);

// Define the 'geotechnical_alerts' table for backward compatibility.
export const geotechnicalAlerts = pgTable('geotechnical_alerts', {
  id: text('id').primaryKey(),
  nodeId: text('node_id')
    .references(() => sensorNodes.id)
    .notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  level: text('level').notNull(), // 'WARNING' | 'CRITICAL'
  message: text('message').notNull(),
  details: text('details'),
  acknowledged: boolean('acknowledged').default(false).notNull(),
  acknowledgedBy: text('acknowledged_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define the 'gateway_status' table.
export const gatewayStatus = pgTable('gateway_status', {
  id: text('id').primaryKey(), // e.g. 'pi3b-gateway-01'
  status: text('status').default('ONLINE').notNull(), // 'ONLINE' | 'DEGRADED' | 'OFFLINE'
  lastHeartbeat: timestamp('last_heartbeat').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  serialPort: text('serial_port').default('/dev/ttyACM0'),
  baudRate: integer('baud_rate').default(115200),
  bufferBacklog: integer('buffer_backlog').default(0),
  uptimeSeconds: integer('uptime_seconds').default(0),
  systemInfo: text('system_info'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const sensorNodesRelations = relations(sensorNodes, ({ many }) => ({
  telemetry: many(telemetryRecords),
  predictions: many(aiPredictions),
  alerts: many(alerts),
}));

export const telemetryRecordsRelations = relations(telemetryRecords, ({ one }) => ({
  node: one(sensorNodes, {
    fields: [telemetryRecords.nodeId],
    references: [sensorNodes.id],
  }),
}));

export const aiPredictionsRelations = relations(aiPredictions, ({ one }) => ({
  node: one(sensorNodes, {
    fields: [aiPredictions.nodeId],
    references: [sensorNodes.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  node: one(sensorNodes, {
    fields: [alerts.nodeId],
    references: [sensorNodes.id],
  }),
}));

