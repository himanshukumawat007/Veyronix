import { db, withDbRetry } from './index.ts';
import { sensorNodes, telemetryRecords, geotechnicalAlerts, alerts, aiPredictions, gatewayStatus } from './schema.ts';
import { desc, eq } from 'drizzle-orm';

export interface TelemetryInsertInput {
  id: string;
  nodeId: string;
  timestamp?: Date;
  ax: number;
  ay: number;
  az: number;
  pot: number;
  displacementMm: number;
  accelerationMagnitude: number;
  accelerationDeviation: number;
  tiltDeg: number;
  riskStatus: string;
  riskScore: number;
  modelConfidence: number;
  isSynthetic?: boolean;
}

export interface AiPredictionInsertInput {
  id: string;
  nodeId: string;
  timestamp?: Date;
  status: string;
  riskScore: number;
  confidence: number;
  modelVersion?: string;
  prediction: string;
  features?: string;
}

export interface GatewayStatusInput {
  id: string;
  status?: string;
  ipAddress?: string;
  serialPort?: string;
  baudRate?: number;
  bufferBacklog?: number;
  uptimeSeconds?: number;
  systemInfo?: string;
}

// In-memory cache to prevent high-frequency redundant updates to sensor_nodes
const knownNodeLastSync = new Map<string, { lastSync: number; status: string }>();

export async function upsertSensorNode(node: {
  id: string;
  name: string;
  zone: string;
  elevationMeters?: number;
  zoneLabel?: string;
  status?: string;
  batteryPct?: number;
  rssi?: number;
}) {
  try {
    return await withDbRetry(async () => {
      const result = await db
        .insert(sensorNodes)
        .values({
          id: node.id,
          name: node.name,
          zone: node.zone,
          elevationMeters: node.elevationMeters ?? 400,
          zoneLabel: node.zoneLabel ?? 'Zone A',
          status: node.status ?? 'NORMAL',
          batteryPct: node.batteryPct ?? 100,
          rssi: node.rssi ?? -60,
          lastSeen: new Date(),
        })
        .onConflictDoUpdate({
          target: sensorNodes.id,
          set: {
            lastSeen: new Date(),
            status: node.status ?? 'NORMAL',
            batteryPct: node.batteryPct ?? 100,
            rssi: node.rssi ?? -60,
          },
        })
        .returning();

      knownNodeLastSync.set(node.id, {
        lastSync: Date.now(),
        status: node.status ?? 'NORMAL',
      });

      return result[0];
    });
  } catch (error) {
    console.error('Failed to upsert sensor node in Cloud SQL:', error);
    throw new Error('Database error updating sensor node', { cause: error });
  }
}

export async function insertTelemetryRecord(record: TelemetryInsertInput) {
  try {
    // Only upsert sensor_nodes if not recently updated or if status changed
    const cached = knownNodeLastSync.get(record.nodeId);
    const now = Date.now();
    const needsNodeSync = !cached || (now - cached.lastSync > 60000) || (cached.status !== record.riskStatus);

    if (needsNodeSync) {
      try {
        await upsertSensorNode({
          id: record.nodeId,
          name: record.nodeId === 'node-01' ? 'Node 01 (Ridge Crest)' : 'Node 02 (Ridge Slope)',
          zone: 'Zone A — Upper Crest',
          status: record.riskStatus,
        });
      } catch (err: any) {
        console.warn(`Node status synchronization notice for ${record.nodeId}:`, err?.message || err);
      }
    }

    return await withDbRetry(async () => {
      const result = await db
        .insert(telemetryRecords)
        .values({
          id: record.id,
          nodeId: record.nodeId,
          timestamp: record.timestamp ?? new Date(),
          ax: record.ax,
          ay: record.ay,
          az: record.az,
          pot: record.pot,
          displacementMm: record.displacementMm,
          accelerationMagnitude: record.accelerationMagnitude,
          accelerationDeviation: record.accelerationDeviation,
          tiltDeg: record.tiltDeg,
          riskStatus: record.riskStatus,
          riskScore: record.riskScore,
          modelConfidence: record.modelConfidence,
          isSynthetic: record.isSynthetic ?? false,
        })
        .onConflictDoNothing({ target: telemetryRecords.id })
        .returning();
      return result[0] ?? null;
    });
  } catch (error) {
    console.error('Failed to insert telemetry record in Cloud SQL:', error);
    throw new Error('Database error writing telemetry record', { cause: error });
  }
}

export async function getRecentTelemetry(limit: number = 100) {
  try {
    return await withDbRetry(async () => {
      return await db
        .select()
        .from(telemetryRecords)
        .orderBy(desc(telemetryRecords.timestamp))
        .limit(limit);
    });
  } catch (error) {
    console.error('Failed to fetch telemetry records from Cloud SQL:', error);
    throw new Error('Database error reading telemetry records', { cause: error });
  }
}

export async function insertGeotechnicalAlert(alert: {
  id: string;
  nodeId: string;
  timestamp?: Date;
  level: string;
  message: string;
  details?: string;
}) {
  try {
    return await withDbRetry(async () => {
      const result = await db
        .insert(alerts)
        .values({
          id: alert.id,
          nodeId: alert.nodeId,
          timestamp: alert.timestamp ?? new Date(),
          level: alert.level,
          message: alert.message,
          details: alert.details,
          acknowledged: false,
        })
        .onConflictDoNothing()
        .returning();
      return result[0];
    });
  } catch (error) {
    console.error('Failed to insert alert in Cloud SQL:', error);
    throw new Error('Database error creating alert', { cause: error });
  }
}

export async function getRecentAlerts(limit: number = 50) {
  try {
    return await withDbRetry(async () => {
      return await db
        .select()
        .from(alerts)
        .orderBy(desc(alerts.timestamp))
        .limit(limit);
    });
  } catch (error) {
    console.error('Failed to fetch alerts from Cloud SQL:', error);
    throw new Error('Database error reading alerts', { cause: error });
  }
}

export async function acknowledgeAlertInDb(alertId: string, userIdentifier: string) {
  try {
    return await withDbRetry(async () => {
      const result = await db
        .update(alerts)
        .set({
          acknowledged: true,
          acknowledgedBy: userIdentifier,
        })
        .where(eq(alerts.id, alertId))
        .returning();
      return result[0];
    });
  } catch (error) {
    console.error('Failed to acknowledge alert in Cloud SQL:', error);
    throw new Error('Database error acknowledging alert', { cause: error });
  }
}

export async function insertAiPrediction(prediction: AiPredictionInsertInput) {
  try {
    return await withDbRetry(async () => {
      const result = await db
        .insert(aiPredictions)
        .values({
          id: prediction.id,
          nodeId: prediction.nodeId,
          timestamp: prediction.timestamp ?? new Date(),
          status: prediction.status,
          riskScore: prediction.riskScore,
          confidence: prediction.confidence,
          modelVersion: prediction.modelVersion ?? 'v1',
          prediction: prediction.prediction,
          features: prediction.features,
        })
        .returning();
      return result[0];
    });
  } catch (error) {
    console.error('Failed to insert AI prediction in Cloud SQL:', error);
    throw new Error('Database error saving AI prediction', { cause: error });
  }
}

export async function getRecentAiPredictions(limit: number = 50) {
  try {
    return await withDbRetry(async () => {
      return await db
        .select()
        .from(aiPredictions)
        .orderBy(desc(aiPredictions.timestamp))
        .limit(limit);
    });
  } catch (error) {
    console.error('Failed to fetch AI predictions from Cloud SQL:', error);
    throw new Error('Database error reading AI predictions', { cause: error });
  }
}

export async function upsertGatewayStatus(gw: GatewayStatusInput) {
  try {
    return await withDbRetry(async () => {
      const result = await db
        .insert(gatewayStatus)
        .values({
          id: gw.id,
          status: gw.status ?? 'ONLINE',
          lastHeartbeat: new Date(),
          ipAddress: gw.ipAddress,
          serialPort: gw.serialPort ?? '/dev/ttyACM0',
          baudRate: gw.baudRate ?? 115200,
          bufferBacklog: gw.bufferBacklog ?? 0,
          uptimeSeconds: gw.uptimeSeconds ?? 0,
          systemInfo: gw.systemInfo,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: gatewayStatus.id,
          set: {
            status: gw.status ?? 'ONLINE',
            lastHeartbeat: new Date(),
            ipAddress: gw.ipAddress,
            serialPort: gw.serialPort ?? '/dev/ttyACM0',
            baudRate: gw.baudRate ?? 115200,
            bufferBacklog: gw.bufferBacklog ?? 0,
            uptimeSeconds: gw.uptimeSeconds ?? 0,
            systemInfo: gw.systemInfo,
            updatedAt: new Date(),
          },
        })
        .returning();
      return result[0];
    });
  } catch (error) {
    console.error('Failed to update gateway status in Cloud SQL:', error);
    throw new Error('Database error updating gateway status', { cause: error });
  }
}

export async function getGatewayStatus(id: string = 'pi3b-gateway-01') {
  try {
    return await withDbRetry(async () => {
      const rows = await db
        .select()
        .from(gatewayStatus)
        .where(eq(gatewayStatus.id, id))
        .limit(1);
      return rows[0] || null;
    });
  } catch (error) {
    console.error('Failed to fetch gateway status from Cloud SQL:', error);
    throw new Error('Database error reading gateway status', { cause: error });
  }
}

