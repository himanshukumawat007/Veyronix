/**
 * BHU-DRISHTI Platform Engine
 *
 * Maintains the multi-site monitoring state used by the public portal, authority dashboard and
 * mine-operator dashboard:
 *   - DEMO zones: realistic simulated telemetry driven by a scenario (NORMAL / WARNING / CRITICAL /
 *     SENSOR_FAULT) so the full alert chain can be demonstrated.
 *   - LIVE zone ("proto-rig"): mirrors the real hardware prototype telemetry ingested through
 *     POST /api/sensor-data (see server/telemetryStore.ts and pi/serial_receiver.py).
 *   - Offline-first behaviour: when the internet link is cut, gateways keep logging and sounding
 *     local alarms; the cloud copy freezes and is back-filled when the link returns.
 */
import { telemetryStore } from '../telemetryStore';
import { fuse } from './fusion';
import { predict } from './predictor';
import { HISTORICAL_INCIDENTS, REGIONS, SCENARIO_TARGETS, ZONES, type ZoneSeed } from './seed';
import type {
  AlertChannelState,
  AlertRecord,
  GatewayState,
  Incident,
  NodeState,
  Prediction,
  RiskLevel,
  Scenario,
  SensorHealth,
  SensorReading,
} from './types';

const TICK_MS = 3000;
const HISTORY_MAX = 1800;
const SEED_MINUTES = 120;
const SEED_STEP_MS = 30000;
const DRAIN_MS_PER_TICK = 45000; // how much buffered data the gateway back-fills per tick after reconnect
const OFFLINE_AFTER_MS = 45000;

const LEVEL_RANK: Record<RiskLevel, number> = { OFFLINE: -1, NORMAL: 0, WARNING: 1, CRITICAL: 2 };

// Deterministic PRNG so the demo topology is identical on every start
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260927);
const noise = (n: number) => (Math.random() - 0.5) * 2 * n;
const r1 = (v: number, d = 2) => Number(v.toFixed(d));

interface NodeInternal extends NodeState {
  baseTilt: number;
  baseDisp: number;
  baseCrack: number;
  k: number;
  permanentlyOffline: boolean;
  edgeClassifier?: { status: string; riskScore: number; confidence: number; model: string } | null;
}

interface ZoneRuntime {
  seed: ZoneSeed;
  stress: number;
  scoreHistory: Array<{ t: number; score: number }>;
  localStatus: RiskLevel;
  silenced: boolean;
  firstElevatedAt: number | null;
}

export interface DemoState {
  dataMode: 'DEMO';
  scenario: Scenario;
  internetOnline: boolean;
  syncedUntil: number;
  synchronizing: boolean;
  startedAt: number;
}

class PlatformEngine {
  zones = new Map<string, ZoneRuntime>();
  nodes = new Map<string, NodeInternal>();
  gateways = new Map<string, GatewayState>();
  alerts: AlertRecord[] = [];
  incidents: Incident[] = [];
  dailyAggregates = new Map<string, Array<{ date: string; avgScore: number; maxScore: number; alerts: number }>>();
  demo: DemoState = {
    dataMode: 'DEMO',
    scenario: 'NORMAL',
    internetOnline: true,
    syncedUntil: Date.now(),
    synchronizing: false,
    startedAt: Date.now(),
  };
  lastTick = Date.now();
  private alertSeq = 1024;
  private incidentSeq = 1;
  private predictionCache = new Map<string, { at: number; value: Prediction }>();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.buildTopology();
    this.seedHistory();
    this.seedIncidents();
    this.seedAggregates();
    this.tick();
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.timer.unref?.();
  }

  // ------------------------------------------------------------------ topology & seeding
  private buildTopology() {
    let nodeNo = 1;
    let gwNo = 0;
    for (const z of ZONES) {
      this.zones.set(z.id, { seed: z, stress: 0.04, scoreHistory: [], localStatus: 'NORMAL', silenced: false, firstElevatedAt: null });
      gwNo++;
      for (let i = 0; i < z.nodeCount; i++) {
        const id = `NODE-${String(nodeNo).padStart(3, '0')}`;
        nodeNo++;
        const angle = (i / z.nodeCount) * Math.PI * 2 + rand();
        const dist = 0.004 + rand() * 0.006;
        const permanentlyOffline = id === SCENARIO_TARGETS.permanentlyOfflineNode;
        this.nodes.set(id, {
          id,
          zoneId: z.id,
          name: `${id} · ${['North', 'East', 'South', 'West'][i % 4]} sector`,
          lat: r1(z.lat + Math.sin(angle) * dist, 5),
          lng: r1(z.lng + Math.cos(angle) * dist, 5),
          status: 'NORMAL',
          batteryPct: permanentlyOffline ? 3 : Math.round(62 + rand() * 36),
          rssi: Math.round(-68 - rand() * 28),
          lastSeen: Date.now(),
          latest: null,
          health: this.defaultHealth(),
          fusion: null,
          history: [],
          dataSource: 'DEMO',
          baseTilt: 0.3 + rand() * 0.7,
          baseDisp: 0.4 + rand() * 0.8,
          baseCrack: 0.2 + rand() * 0.3,
          k: i === z.nodeCount - 1 ? 0.62 : 0.95 + rand() * 0.2,
          permanentlyOffline,
        });
      }
      this.gateways.set(z.gatewayId, {
        id: z.gatewayId,
        zoneId: z.id,
        hardware: z.dataSource === 'LIVE' ? 'Raspberry Pi 3B (hardware prototype)' : 'Raspberry Pi gateway (simulated)',
        loraStatus: 'ONLINE',
        internet: 'ONLINE',
        localDb: 'HEALTHY',
        localMonitoring: 'OPERATIONAL',
        grafana: 'OPERATIONAL',
        remoteAlerts: 'OPERATIONAL',
        cloudSync: 'SYNCED',
        backlog: 0,
        cpuPct: 20 + gwNo,
        memoryPct: 40,
        storagePct: 21 + gwNo,
        temperatureC: 48,
        lastSync: Date.now(),
        uptimeSec: 86400 * (3 + gwNo) + Math.round(rand() * 5000),
        localAlarm: 'GREEN',
        buzzerActive: false,
      });
    }
    // Hardware prototype nodes (fed by telemetryStore)
    for (const meta of telemetryStore.nodes.values()) {
      this.nodes.set(meta.id, {
        id: meta.id,
        zoneId: 'proto-rig',
        name: meta.name,
        lat: 0,
        lng: 0,
        status: 'OFFLINE',
        batteryPct: meta.batteryPct,
        rssi: meta.rssi,
        lastSeen: 0,
        latest: null,
        health: { ...this.defaultHealth(), piezo: 'NOT_FITTED' },
        fusion: null,
        history: [],
        dataSource: 'LIVE',
        baseTilt: 0,
        baseDisp: 0,
        baseCrack: 0,
        k: 1,
        permanentlyOffline: false,
        edgeClassifier: null,
      });
    }
  }

  private defaultHealth(): SensorHealth {
    return { mpu6050: 'HEALTHY', piezo: 'HEALTHY', potentiometer: 'HEALTHY', battery: 'HEALTHY', lora: 'HEALTHY' };
  }

  private seedHistory() {
    const now = Date.now();
    for (let t = now - SEED_MINUTES * 60000; t < now; t += SEED_STEP_MS) {
      for (const zr of this.zones.values()) {
        if (zr.seed.dataSource !== 'DEMO') continue;
        let maxScore = 0;
        for (const n of this.nodesOfZone(zr.seed.id)) {
          if (n.permanentlyOffline && t > now - 50 * 60000) continue; // went offline ~50 min ago
          const reading = this.generateReading(n, 0.04, t, false);
          const f = fuse(reading, zr.seed.thresholds);
          const rec: SensorReading = { ...reading, t, riskScore: f.score, status: f.status };
          n.history.push(rec);
          n.latest = rec;
          n.lastSeen = t;
          maxScore = Math.max(maxScore, f.score);
        }
        zr.scoreHistory.push({ t, score: maxScore });
      }
    }
  }

  private seedIncidents() {
    const now = Date.now();
    for (const h of HISTORICAL_INCIDENTS) {
      const start = now - h.daysAgo * 86400000;
      const end = start + h.durationMin * 60000;
      const id = this.nextIncidentId(start);
      const alertId = `BD-${this.alertSeq++}`;
      const events: Incident['events'] = [
        { type: 'DETECTION', at: start, note: 'Correlated sensor change detected by fusion engine' },
      ];
      if (h.severity === 'CRITICAL') {
        events.push({ type: 'ESCALATION', at: start + 6 * 60000, note: 'Risk escalated WARNING → CRITICAL' });
      }
      events.push({ type: 'ALERT', at: start + 7 * 60000, note: `Alert ${alertId} issued (local alarm, dashboard, SMS, email)` });
      events.push({ type: 'ACKNOWLEDGEMENT', at: start + 15 * 60000, note: 'Acknowledged by control room (demo)' });
      events.push({ type: 'RESOLUTION', at: end, note: 'Readings returned to normal; field inspection closed' });
      this.incidents.push({ id, zoneId: h.zoneId, severity: h.severity, trigger: h.trigger, startedAt: start, endedAt: end, status: 'CLOSED', events, isDemo: true });

      // Keep the most recent historical event visible as a resolved alert in the alert centre
      if (h.daysAgo < 1) {
        const zone = this.zones.get(h.zoneId)!.seed;
        this.alerts.push({
          id: alertId,
          zoneId: h.zoneId,
          severity: h.severity,
          title: `${h.severity === 'CRITICAL' ? 'Ground movement alert' : 'Ground movement warning'} — ${zone.siteName}, ${zone.name}`,
          description: h.trigger,
          recommendation: this.recommendationFor(h.severity),
          detectedAt: start,
          updatedAt: end,
          status: 'RESOLVED',
          acknowledgedBy: 'Control room (demo)',
          acknowledgedAt: start + 15 * 60000,
          resolvedBy: 'Control room (demo)',
          resolvedAt: end,
          conditionCleared: true,
          peakRiskScore: h.severity === 'CRITICAL' ? 81 : 47,
          channels: this.channels(true, start, zone.dataSource === 'DEMO'),
          incidentId: id,
          isDemo: true,
        });
      }
    }
    this.incidents.sort((a, b) => b.startedAt - a.startedAt);
  }

  private seedAggregates() {
    const day = 86400000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const zr of this.zones.values()) {
      if (zr.seed.dataSource !== 'DEMO') continue;
      const rows: Array<{ date: string; avgScore: number; maxScore: number; alerts: number }> = [];
      for (let d = 14; d >= 1; d--) {
        const dayStart = today.getTime() - d * day;
        const inc = this.incidents.filter((i) => i.zoneId === zr.seed.id && i.startedAt >= dayStart && i.startedAt < dayStart + day);
        const peak = inc.some((i) => i.severity === 'CRITICAL') ? 72 + rand() * 12 : inc.length ? 40 + rand() * 12 : 14 + rand() * 10;
        rows.push({ date: new Date(dayStart).toISOString().slice(0, 10), avgScore: r1(8 + rand() * 5 + (inc.length ? 6 : 0), 1), maxScore: r1(peak, 1), alerts: inc.length });
      }
      this.dailyAggregates.set(zr.seed.id, rows);
    }
  }

  // ------------------------------------------------------------------ simulation
  private generateReading(n: NodeInternal, stress: number, t: number, fault: boolean) {
    const s = stress * n.k;
    const slow = Math.sin(t / 900000 + n.baseTilt * 10) * 0.05;
    let tiltDeg = n.baseTilt + s * 7 + slow + noise(0.05);
    const vibration = 0.02 + s * 1.3 * (0.85 + Math.random() * 0.3) + Math.abs(noise(0.012));
    const displacementMm = n.baseDisp + s * 11 + noise(0.05);
    const crackMm = n.baseCrack + s * 4 + noise(0.03);
    if (fault) tiltDeg += 8.5 + noise(0.4); // drifting MPU6050 — only one signal moves
    return {
      tiltDeg: r1(Math.max(0, tiltDeg)),
      vibration: r1(Math.max(0, vibration), 3),
      displacementMm: r1(Math.max(0, displacementMm)),
      crackMm: r1(Math.max(0, crackMm)),
    };
  }

  private targetStress(zoneId: string): number {
    const sc = this.demo.scenario;
    if (sc === 'WARNING' && zoneId === SCENARIO_TARGETS.warningZone) return 0.5;
    if (sc === 'CRITICAL' && zoneId === SCENARIO_TARGETS.criticalZone) return 0.95;
    if (sc === 'CRITICAL' && zoneId === SCENARIO_TARGETS.warningZone) return 0.48;
    return 0.04;
  }

  tick() {
    const now = Date.now();
    this.lastTick = now;

    for (const zr of this.zones.values()) {
      if (zr.seed.dataSource === 'LIVE') {
        this.refreshLiveZone(zr, now);
        continue;
      }
      const target = this.targetStress(zr.seed.id);
      const rate = target > zr.stress ? 0.16 : 0.12;
      zr.stress += (target - zr.stress) * rate;
      let maxScore = 0;
      let worst: RiskLevel = 'NORMAL';
      for (const n of this.nodesOfZone(zr.seed.id)) {
        if (n.permanentlyOffline) {
          n.status = 'OFFLINE';
          n.health = { ...n.health, lora: 'FAULT', battery: 'FAULT' };
          continue;
        }
        const fault = this.demo.scenario === 'SENSOR_FAULT' && n.id === SCENARIO_TARGETS.sensorFaultNode;
        const reading = this.generateReading(n, zr.stress, now, fault);
        const f = fuse(reading, zr.seed.thresholds);
        const rec: SensorReading = { ...reading, t: now, riskScore: f.score, status: f.status };
        n.history.push(rec);
        if (n.history.length > HISTORY_MAX) n.history.shift();
        n.latest = rec;
        n.fusion = f;
        n.lastSeen = now;
        n.status = f.status;
        n.batteryPct = Math.max(5, n.batteryPct - (Math.random() < 0.004 ? 1 : 0));
        n.rssi = Math.round(Math.max(-118, Math.min(-55, n.rssi + noise(1.5))));
        n.health = {
          mpu6050: fault ? 'WARNING' : 'HEALTHY',
          piezo: 'HEALTHY',
          potentiometer: 'HEALTHY',
          battery: n.batteryPct < 15 ? 'FAULT' : n.batteryPct < 30 ? 'WARNING' : 'HEALTHY',
          lora: n.rssi < -112 ? 'FAULT' : n.rssi < -102 ? 'WARNING' : 'HEALTHY',
        };
        maxScore = Math.max(maxScore, f.score);
        if (LEVEL_RANK[f.status] > LEVEL_RANK[worst]) worst = f.status;
      }
      zr.scoreHistory.push({ t: now, score: maxScore });
      if (zr.scoreHistory.length > HISTORY_MAX) zr.scoreHistory.shift();
      zr.localStatus = worst;
      if (worst === 'NORMAL') zr.silenced = false;
    }

    this.advanceSync(now);
    this.updateGateways(now);
    this.evaluateAlerts(now);
    this.updateTodayAggregates();
  }

  /** Mirror real prototype telemetry (or its own demo cycle) from telemetryStore. */
  private refreshLiveZone(zr: ZoneRuntime, now: number) {
    let maxScore = 0;
    let worst: RiskLevel = 'NORMAL';
    let anyOnline = false;
    for (const n of this.nodesOfZone(zr.seed.id)) {
      const recs = telemetryStore.getHistory({ range: '6h', nodeId: n.id, limit: HISTORY_MAX });
      n.history = recs.map((r) => {
        const f = fuse({ tiltDeg: r.tilt_deg, vibration: r.acceleration_deviation, displacementMm: r.displacement_mm, crackMm: null }, zr.seed.thresholds);
        return {
          t: new Date(r.timestamp).getTime(),
          tiltDeg: r.tilt_deg,
          vibration: r.acceleration_deviation,
          displacementMm: r.displacement_mm,
          crackMm: null,
          riskScore: f.score,
          status: f.status,
        };
      });
      const last = recs[recs.length - 1];
      n.latest = n.history[n.history.length - 1] || null;
      n.lastSeen = n.latest?.t || 0;
      const meta = telemetryStore.nodes.get(n.id);
      if (meta) {
        n.batteryPct = meta.batteryPct;
        n.rssi = meta.rssi;
      }
      n.fusion = n.latest
        ? fuse({ tiltDeg: n.latest.tiltDeg, vibration: n.latest.vibration, displacementMm: n.latest.displacementMm, crackMm: null }, zr.seed.thresholds)
        : null;
      n.edgeClassifier = last
        ? { status: last.risk_status, riskScore: last.risk_score, confidence: last.model_confidence, model: 'Edge ML classifier (server/mlEngine.ts)' }
        : null;
      const online = n.latest !== null && now - n.lastSeen < OFFLINE_AFTER_MS;
      n.status = online ? n.fusion!.status : 'OFFLINE';
      n.health = {
        mpu6050: online ? 'HEALTHY' : 'FAULT',
        piezo: 'NOT_FITTED',
        potentiometer: online ? 'HEALTHY' : 'FAULT',
        battery: n.batteryPct < 15 ? 'FAULT' : n.batteryPct < 30 ? 'WARNING' : 'HEALTHY',
        lora: online ? 'HEALTHY' : 'FAULT',
      };
      if (online) {
        anyOnline = true;
        maxScore = Math.max(maxScore, n.fusion!.score);
        if (LEVEL_RANK[n.status] > LEVEL_RANK[worst]) worst = n.status;
      }
    }
    zr.localStatus = anyOnline ? worst : 'OFFLINE';
    zr.scoreHistory.push({ t: now, score: maxScore });
    if (zr.scoreHistory.length > HISTORY_MAX) zr.scoreHistory.shift();
  }

  private advanceSync(now: number) {
    const d = this.demo;
    if (!d.internetOnline) {
      d.synchronizing = false;
      return;
    }
    if (d.syncedUntil < now - TICK_MS) {
      d.synchronizing = true;
      d.syncedUntil = Math.min(now, d.syncedUntil + DRAIN_MS_PER_TICK);
    } else {
      d.synchronizing = false;
      d.syncedUntil = now;
    }
  }

  private updateGateways(now: number) {
    const d = this.demo;
    for (const gw of this.gateways.values()) {
      const zr = this.zones.get(gw.zoneId)!;
      if (zr.seed.dataSource === 'LIVE') {
        const pipe = telemetryStore.getPipelineStatus();
        const alarm = telemetryStore.alarmState;
        const fresh = now - new Date(pipe.lastIngestTime).getTime() < OFFLINE_AFTER_MS;
        Object.assign(gw, {
          loraStatus: fresh ? 'ONLINE' : 'OFFLINE',
          internet: 'ONLINE',
          cloudSync: 'SYNCED',
          backlog: pipe.bufferBacklogCount,
          lastSync: new Date(pipe.lastIngestTime).getTime(),
          localAlarm: alarm.color,
          buzzerActive: alarm.buzzerActive,
          localMonitoring: fresh ? 'OPERATIONAL' : 'DEGRADED',
          remoteAlerts: 'OPERATIONAL',
        } as Partial<GatewayState>);
        continue;
      }
      const backlog = this.nodesOfZone(zr.seed.id).reduce(
        (acc, n) => acc + n.history.filter((h) => h.t > d.syncedUntil).length,
        0,
      );
      gw.internet = d.internetOnline ? 'ONLINE' : 'OFFLINE';
      gw.remoteAlerts = d.internetOnline ? 'OPERATIONAL' : 'OFFLINE';
      gw.cloudSync = !d.internetOnline ? 'PAUSED' : d.synchronizing ? 'SYNCHRONIZING' : 'SYNCED';
      gw.backlog = backlog;
      gw.lastSync = d.syncedUntil;
      gw.localMonitoring = 'OPERATIONAL';
      gw.grafana = 'OPERATIONAL';
      gw.localDb = 'HEALTHY';
      gw.cpuPct = Math.round(Math.max(8, Math.min(92, 18 + zr.stress * 25 + noise(4))));
      gw.memoryPct = Math.round(Math.max(20, Math.min(90, 41 + zr.stress * 8 + noise(2))));
      gw.storagePct = Math.min(95, r1(22 + backlog * 0.002, 1));
      gw.temperatureC = r1(46 + gw.cpuPct / 8 + noise(0.6), 1);
      gw.uptimeSec += TICK_MS / 1000;
      gw.localAlarm = zr.localStatus === 'CRITICAL' ? 'RED' : zr.localStatus === 'WARNING' ? 'YELLOW' : 'GREEN';
      gw.buzzerActive = zr.localStatus === 'CRITICAL' && !zr.silenced;
    }
  }

  private recommendationFor(sev: 'WARNING' | 'CRITICAL') {
    return sev === 'CRITICAL'
      ? 'Avoid entering the marked area and follow instructions from local authorities.'
      : 'Stay alert, avoid unnecessary movement near the marked area and follow updates from local authorities.';
  }

  private channels(online: boolean, at: number, simulatedLocal: boolean): AlertChannelState[] {
    return [
      { channel: 'LOCAL_ALARM', state: 'SENT', at, simulated: simulatedLocal },
      { channel: 'DASHBOARD', state: 'SENT', at, simulated: false },
      { channel: 'SMS', state: online ? 'SENT' : 'QUEUED', at: online ? at : null, simulated: true },
      { channel: 'EMAIL', state: online ? 'SENT' : 'QUEUED', at: online ? at : null, simulated: true },
    ];
  }

  private nextIncidentId(at: number) {
    return `INC-${new Date(at).getFullYear()}-${String(this.incidentSeq++).padStart(3, '0')}`;
  }

  private evaluateAlerts(now: number) {
    for (const zr of this.zones.values()) {
      const zone = zr.seed;
      if (zone.dataSource === 'LIVE' && telemetryStore.getDataSourceMode() !== 'LIVE') continue;
      const view = this.zoneCloudStatus(zone.id);
      const status = view.status;
      const open = this.alerts.find((a) => a.zoneId === zone.id && a.status !== 'RESOLVED');
      const elevated = (status === 'WARNING' || status === 'CRITICAL') && zone.monitoringEnabled;

      if (elevated) {
        if (zr.firstElevatedAt === null) zr.firstElevatedAt = view.lastUpdate || now;
        const worstNode = this.nodesOfZone(zone.id)
          .filter((n) => n.status !== 'OFFLINE')
          .sort((a, b) => (b.fusion?.score || 0) - (a.fusion?.score || 0))[0];
        const signals = worstNode?.fusion?.elevatedSignals?.join(', ').toLowerCase() || 'multiple signals';
        if (!open) {
          const sev = status as 'WARNING' | 'CRITICAL';
          const id = `BD-${this.alertSeq++}`;
          const incidentId = this.nextIncidentId(now);
          const detectedAt = zr.firstElevatedAt;
          this.alerts.unshift({
            id,
            zoneId: zone.id,
            severity: sev,
            title: `${sev === 'CRITICAL' ? 'Ground movement alert' : 'Ground movement warning'} — ${zone.siteName}, ${zone.name}`,
            description: `Correlated change in ${signals} detected across monitoring nodes.`,
            recommendation: this.recommendationFor(sev),
            detectedAt,
            updatedAt: now,
            status: 'ACTIVE',
            acknowledgedBy: null,
            acknowledgedAt: null,
            resolvedBy: null,
            resolvedAt: null,
            conditionCleared: false,
            peakRiskScore: view.riskScore,
            channels: this.channels(this.demo.internetOnline, now, zone.dataSource === 'DEMO'),
            incidentId,
            isDemo: zone.dataSource === 'DEMO',
          });
          this.incidents.unshift({
            id: incidentId,
            zoneId: zone.id,
            severity: sev,
            trigger: `Correlated change in ${signals}`,
            startedAt: detectedAt,
            endedAt: null,
            status: 'OPEN',
            events: [
              { type: 'DETECTION', at: detectedAt, note: `Fusion engine: ${worstNode?.fusion?.note || 'correlated movement'}` },
              { type: 'ALERT', at: now, note: `Alert ${id} issued at ${sev} level` },
            ],
            isDemo: zone.dataSource === 'DEMO',
          });
        } else {
          open.updatedAt = now;
          open.conditionCleared = false;
          open.peakRiskScore = Math.max(open.peakRiskScore, view.riskScore);
          if (open.severity === 'WARNING' && status === 'CRITICAL') {
            open.severity = 'CRITICAL';
            open.title = `Ground movement alert — ${zone.siteName}, ${zone.name}`;
            open.recommendation = this.recommendationFor('CRITICAL');
            open.description = `Correlated change in ${signals} detected across monitoring nodes. Escalated to CRITICAL.`;
            open.channels = this.channels(this.demo.internetOnline, now, zone.dataSource === 'DEMO');
            if (open.status === 'ACKNOWLEDGED') open.status = 'ACTIVE';
            const inc = this.incidents.find((i) => i.id === open.incidentId);
            if (inc) {
              inc.severity = 'CRITICAL';
              inc.events.push({ type: 'ESCALATION', at: now, note: 'Risk escalated WARNING → CRITICAL' });
            }
          }
        }
      } else {
        zr.firstElevatedAt = null;
        if (open && !open.conditionCleared && status === 'NORMAL') open.conditionCleared = true;
      }

      // Flush queued SMS/e-mail once the internet link is back
      if (this.demo.internetOnline) {
        for (const a of this.alerts) {
          if (a.zoneId !== zone.id || a.status === 'RESOLVED') continue;
          for (const c of a.channels) if (c.state === 'QUEUED') Object.assign(c, { state: 'SENT', at: now });
        }
      }
    }
  }

  private updateTodayAggregates() {
    // Today's aggregates are computed on demand in reports() from scoreHistory
  }

  // ------------------------------------------------------------------ queries (cloud view)
  nodesOfZone(zoneId: string) {
    return Array.from(this.nodes.values()).filter((n) => n.zoneId === zoneId);
  }

  /** What the cloud platform can see: data up to the last successful gateway sync. */
  nodeCloudView(n: NodeInternal) {
    const zr = this.zones.get(n.zoneId)!;
    const cutoff = zr.seed.dataSource === 'LIVE' ? Infinity : this.demo.syncedUntil;
    let latest: SensorReading | null = null;
    for (let i = n.history.length - 1; i >= 0; i--) {
      if (n.history[i].t <= cutoff) {
        latest = n.history[i];
        break;
      }
    }
    const reference = zr.seed.dataSource === 'LIVE' ? Date.now() : this.demo.syncedUntil;
    const online = !!latest && reference - latest.t < OFFLINE_AFTER_MS;
    const fusion = latest ? fuse(latest, zr.seed.thresholds) : null;
    return {
      id: n.id,
      zoneId: n.zoneId,
      name: n.name,
      lat: n.lat,
      lng: n.lng,
      status: (online ? latest!.status : 'OFFLINE') as RiskLevel,
      batteryPct: n.batteryPct,
      rssi: n.rssi,
      lastSeen: latest?.t || null,
      latest,
      health: n.health,
      fusion: online ? fusion : null,
      dataSource: n.dataSource,
      edgeClassifier: n.edgeClassifier || null,
    };
  }

  nodeHistory(nodeId: string, rangeMin: number) {
    const n = this.nodes.get(nodeId);
    if (!n) return [];
    const zr = this.zones.get(n.zoneId)!;
    const cutoff = zr.seed.dataSource === 'LIVE' ? Infinity : this.demo.syncedUntil;
    const from = Date.now() - rangeMin * 60000;
    const pts = n.history.filter((h) => h.t >= from && h.t <= cutoff);
    return downsample(pts, 240);
  }

  zoneCloudStatus(zoneId: string) {
    const zr = this.zones.get(zoneId)!;
    const nodes = this.nodesOfZone(zoneId).map((n) => this.nodeCloudView(n));
    const online = nodes.filter((n) => n.status !== 'OFFLINE');
    let status: RiskLevel = online.length ? 'NORMAL' : 'OFFLINE';
    let riskScore = 0;
    for (const n of online) {
      if (LEVEL_RANK[n.status] > LEVEL_RANK[status]) status = n.status;
      riskScore = Math.max(riskScore, n.latest?.riskScore || 0);
    }
    const lastUpdate = nodes.reduce((m, n) => Math.max(m, n.lastSeen || 0), 0) || null;
    const stale = zr.seed.dataSource === 'DEMO' && !this.demo.internetOnline;
    return { status, riskScore: r1(riskScore, 1), activeNodes: online.length, totalNodes: nodes.length, offlineNodes: nodes.length - online.length, lastUpdate, stale, nodes };
  }

  zoneScoreCloudHistory(zoneId: string) {
    const zr = this.zones.get(zoneId)!;
    const cutoff = zr.seed.dataSource === 'LIVE' ? Infinity : this.demo.syncedUntil;
    return zr.scoreHistory.filter((p) => p.t <= cutoff);
  }

  async prediction(zoneId: string): Promise<Prediction | null> {
    const zr = this.zones.get(zoneId);
    if (!zr) return null;
    const cached = this.predictionCache.get(zoneId);
    if (cached && Date.now() - cached.at < TICK_MS) return cached.value;
    const view = this.zoneCloudStatus(zoneId);
    const value = await predict({
      zoneId,
      history: this.zoneScoreCloudHistory(zoneId),
      currentLevel: view.status,
      thresholds: zr.seed.thresholds,
    });
    this.predictionCache.set(zoneId, { at: Date.now(), value });
    return value;
  }

  // ------------------------------------------------------------------ actions
  setScenario(s: Scenario) {
    this.demo.scenario = s;
  }

  setInternet(online: boolean) {
    this.demo.internetOnline = online;
  }

  resetDemo() {
    this.demo.scenario = 'NORMAL';
    this.demo.internetOnline = true;
    this.demo.syncedUntil = Date.now();
    for (const zr of this.zones.values()) {
      if (zr.seed.dataSource === 'DEMO') zr.stress = 0.04;
      zr.firstElevatedAt = null;
    }
    for (const a of this.alerts) {
      if (a.status !== 'RESOLVED') this.resolveAlert(a.id, 'Demo reset');
    }
  }

  acknowledgeAlert(id: string, by: string) {
    const a = this.alerts.find((x) => x.id === id);
    if (!a) return null;
    if (a.status === 'ACTIVE') {
      a.status = 'ACKNOWLEDGED';
      a.acknowledgedBy = by;
      a.acknowledgedAt = Date.now();
      a.updatedAt = Date.now();
      this.incidents.find((i) => i.id === a.incidentId)?.events.push({ type: 'ACKNOWLEDGEMENT', at: Date.now(), note: `Acknowledged by ${by}` });
      const zr = this.zones.get(a.zoneId);
      if (zr) zr.silenced = true; // acknowledging silences the gateway buzzer
    }
    return a;
  }

  resolveAlert(id: string, by: string) {
    const a = this.alerts.find((x) => x.id === id);
    if (!a) return null;
    if (a.status !== 'RESOLVED') {
      const now = Date.now();
      if (!a.acknowledgedAt) {
        a.acknowledgedAt = now;
        a.acknowledgedBy = by;
      }
      a.status = 'RESOLVED';
      a.resolvedBy = by;
      a.resolvedAt = now;
      a.updatedAt = now;
      const inc = this.incidents.find((i) => i.id === a.incidentId);
      if (inc) {
        inc.status = 'CLOSED';
        inc.endedAt = now;
        inc.events.push({ type: 'RESOLUTION', at: now, note: `Resolved by ${by}${a.conditionCleared ? '' : ' (readings still elevated at time of resolution)'}` });
      }
    }
    return a;
  }

  updateZone(id: string, patch: { monitoringEnabled?: boolean; warningScore?: number; criticalScore?: number }) {
    const zr = this.zones.get(id);
    if (!zr) return null;
    if (typeof patch.monitoringEnabled === 'boolean') zr.seed.monitoringEnabled = patch.monitoringEnabled;
    const w = patch.warningScore ?? zr.seed.thresholds.warningScore;
    const c = patch.criticalScore ?? zr.seed.thresholds.criticalScore;
    if (!(w >= 10 && w <= 60 && c >= 40 && c <= 95 && c > w + 5)) {
      throw new Error('Invalid thresholds: warning must be 10-60, critical 40-95 and at least 5 points above warning');
    }
    zr.seed.thresholds = { warningScore: w, criticalScore: c };
    return zr.seed;
  }

  regions() {
    return REGIONS;
  }
}

export function downsample<T>(pts: T[], max: number): T[] {
  if (pts.length <= max) return pts;
  const step = pts.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(pts[Math.floor(i * step)]);
  out.push(pts[pts.length - 1]);
  return out;
}

export const engine = new PlatformEngine();
