/**
 * BHU-DRISHTI Platform REST API — mounted at /api/v1
 *
 * Public endpoints (/public/*) return simplified, non-technical data only: no sensor values,
 * node identifiers, gateway details or infrastructure information.
 * Authority / operator endpoints require a bearer token from POST /auth/login.
 */
import express from 'express';
import { telemetryStore } from '../telemetryStore';
import { summarize } from './aiSummary';
import { login, requireRole, verify, type AuthedRequest } from './auth';
import { engine } from './engine';
import { SIGNAL_LIMITS } from './fusion';
import { REGIONS } from './seed';
import type { RiskLevel, Scenario } from './types';

const RANK: Record<RiskLevel, number> = { OFFLINE: -1, NORMAL: 0, WARNING: 1, CRITICAL: 2 };
const SCENARIOS: Scenario[] = ['NORMAL', 'WARNING', 'CRITICAL', 'SENSOR_FAULT'];

const PUBLIC_MESSAGE: Record<RiskLevel, string> = {
  NORMAL: 'No unusual ground movement detected.',
  WARNING: 'Ground movement above normal levels detected. Stay alert and follow updates from local authorities.',
  CRITICAL: 'Significant ground movement detected. Avoid the marked area and follow instructions from local authorities.',
  OFFLINE: 'Monitoring data is temporarily unavailable for this area.',
};

function regionName(id: string) {
  return REGIONS.find((r) => r.id === id)?.name || id;
}

function openAlertFor(zoneId: string) {
  return engine.alerts.find((a) => a.zoneId === zoneId && a.status !== 'RESOLVED') || null;
}

function zoneView(zoneId: string) {
  const zr = engine.zones.get(zoneId)!;
  const z = zr.seed;
  const v = engine.zoneCloudStatus(zoneId);
  const alert = openAlertFor(zoneId);
  const status: RiskLevel = z.monitoringEnabled ? v.status : 'OFFLINE';
  return {
    id: z.id,
    name: z.name,
    siteName: z.siteName,
    label: `${z.siteName} — ${z.name}`,
    regionId: z.regionId,
    regionName: regionName(z.regionId),
    lat: z.lat,
    lng: z.lng,
    description: z.description,
    dataSource: z.dataSource,
    publicVisible: z.publicVisible,
    monitoringEnabled: z.monitoringEnabled,
    thresholds: z.thresholds,
    gatewayId: z.gatewayId,
    status,
    riskScore: v.riskScore,
    activeNodes: v.activeNodes,
    totalNodes: v.totalNodes,
    offlineNodes: v.offlineNodes,
    lastUpdate: v.lastUpdate,
    stale: v.stale,
    activeAlert: alert ? { id: alert.id, severity: alert.severity, status: alert.status } : null,
  };
}

function publicZone(zoneId: string) {
  const v = zoneView(zoneId);
  const alert = openAlertFor(zoneId);
  return {
    id: v.id,
    label: v.label,
    siteName: v.siteName,
    name: v.name,
    regionId: v.regionId,
    regionName: v.regionName,
    lat: v.lat,
    lng: v.lng,
    description: v.description,
    status: v.status,
    message: v.monitoringEnabled ? PUBLIC_MESSAGE[v.status] : 'Monitoring is paused for maintenance.',
    activeNodes: v.activeNodes,
    lastUpdate: v.lastUpdate,
    stale: v.stale,
    currentWarning: alert
      ? { alertId: alert.id, severity: alert.severity, title: alert.title, recommendation: alert.recommendation, since: alert.detectedAt }
      : null,
    isDemo: v.dataSource === 'DEMO',
  };
}

function publicZoneIds() {
  return Array.from(engine.zones.values()).filter((z) => z.seed.publicVisible).map((z) => z.seed.id);
}

function publicAlert(a: (typeof engine.alerts)[number]) {
  const z = engine.zones.get(a.zoneId)!.seed;
  return {
    id: a.id,
    zoneId: a.zoneId,
    severity: a.severity,
    location: `${z.siteName} — ${z.name}`,
    regionName: regionName(z.regionId),
    lat: z.lat,
    lng: z.lng,
    title: a.title,
    description: a.status === 'RESOLVED' ? 'Readings have returned to normal. This alert is closed.' : 'Unusual ground movement has been detected by the monitoring network in this area.',
    recommendation: a.recommendation,
    detectedAt: a.detectedAt,
    updatedAt: a.updatedAt,
    status: a.status,
    conditionCleared: a.conditionCleared,
    isDemo: a.isDemo,
  };
}

function demoState() {
  const d = engine.demo;
  return {
    dataMode: 'DEMO' as const,
    scenario: d.scenario,
    internetOnline: d.internetOnline,
    synchronizing: d.synchronizing,
    syncedUntil: d.syncedUntil,
    prototypeMode: telemetryStore.getDataSourceMode(),
    serverTime: Date.now(),
    lastTick: engine.lastTick,
  };
}

// ---- Grafana health probe (cached)
let grafanaProbe = { at: 0, ok: false as boolean, configured: false };
function grafanaUrls() {
  const raw = process.env.GRAFANA_URL || '';
  const configured = !!raw && !raw.includes('your-instance');
  const internal = configured ? raw.replace(/\/$/, '') : 'http://localhost:3001';
  const pub = (process.env.GRAFANA_PUBLIC_URL || (configured ? raw : 'http://localhost:3001')).replace(/\/$/, '');
  return { configured, internal, public: pub, dashboardUid: 'bhu-drishti-telemetry' };
}
async function probeGrafana() {
  if (Date.now() - grafanaProbe.at < 30000) return grafanaProbe;
  const g = grafanaUrls();
  let ok = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch(`${g.internal}/api/health`, { signal: ctrl.signal });
    clearTimeout(t);
    ok = r.ok;
  } catch {
    ok = false;
  }
  grafanaProbe = { at: Date.now(), ok, configured: g.configured };
  return grafanaProbe;
}

function demoControlAllowed(req: AuthedRequest) {
  if ((process.env.DEMO_CONTROLS || 'public') === 'public') return true;
  const h = req.headers.authorization || '';
  return !!verify(h.startsWith('Bearer ') ? h.slice(7) : undefined);
}

export function platformRouter() {
  const r = express.Router();
  const staff = requireRole('AUTHORITY', 'MINE_OPERATOR');
  const operatorOnly = requireRole('MINE_OPERATOR');

  // ------------------------------------------------------------------ meta & demo
  r.get('/meta', async (_req, res) => {
    const g = grafanaUrls();
    res.json({
      name: 'BHU-DRISHTI Public Safety & Mine Monitoring Platform',
      version: '2.0.0-prototype',
      demo: demoState(),
      grafana: { publicUrl: g.public, dashboardUid: g.dashboardUid, dashboardUrl: `${g.public}/d/${g.dashboardUid}`, configured: g.configured },
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      predictionModel: process.env.AI_PREDICT_URL ? 'External model via AI_PREDICT_URL' : 'Trend-extrapolation baseline (simulated — LSTM not connected)',
      demoControlsPublic: (process.env.DEMO_CONTROLS || 'public') === 'public',
    });
  });

  r.get('/demo', (_req, res) => res.json(demoState()));

  r.post('/demo', (req: AuthedRequest, res) => {
    if (!demoControlAllowed(req)) return res.status(401).json({ error: 'Login required to control demo mode' });
    const { scenario, internetOnline } = req.body || {};
    if (scenario !== undefined) {
      if (!SCENARIOS.includes(scenario)) return res.status(400).json({ error: `scenario must be one of ${SCENARIOS.join(', ')}` });
      engine.setScenario(scenario);
    }
    if (internetOnline !== undefined) {
      if (typeof internetOnline !== 'boolean') return res.status(400).json({ error: 'internetOnline must be boolean' });
      engine.setInternet(internetOnline);
    }
    engine.tick();
    res.json(demoState());
  });

  r.post('/demo/reset', (req: AuthedRequest, res) => {
    if (!demoControlAllowed(req)) return res.status(401).json({ error: 'Login required to control demo mode' });
    engine.resetDemo();
    engine.tick();
    res.json(demoState());
  });

  // ------------------------------------------------------------------ public
  r.get('/public/summary', (_req, res) => {
    const zones = publicZoneIds().map(publicZone);
    const monitored = zones.filter((z) => z.status !== 'OFFLINE');
    let overall: RiskLevel = monitored.length ? 'NORMAL' : 'OFFLINE';
    for (const z of monitored) if (RANK[z.status] > RANK[overall]) overall = z.status;
    const alerts = engine.alerts.filter((a) => a.status !== 'RESOLVED' && engine.zones.get(a.zoneId)?.seed.publicVisible);
    const nodes = publicZoneIds().flatMap((id) => engine.nodesOfZone(id).map((n) => engine.nodeCloudView(n)));
    const headline =
      overall === 'CRITICAL'
        ? `CRITICAL: ${zones.filter((z) => z.status === 'CRITICAL').length} zone(s) at critical risk`
        : overall === 'WARNING'
        ? `WARNING: ${zones.filter((z) => z.status === 'WARNING').length} zone(s) under watch`
        : overall === 'OFFLINE'
        ? 'Monitoring data temporarily unavailable'
        : 'All monitored zones currently normal';
    res.json({
      overall,
      headline,
      totalZones: zones.length,
      activeZones: monitored.length,
      normalZones: zones.filter((z) => z.status === 'NORMAL').length,
      warningZones: zones.filter((z) => z.status === 'WARNING').length,
      criticalZones: zones.filter((z) => z.status === 'CRITICAL').length,
      activeAlerts: alerts.length,
      onlineNodes: nodes.filter((n) => n.status !== 'OFFLINE').length,
      totalNodes: nodes.length,
      lastUpdate: zones.reduce((m, z) => Math.max(m, z.lastUpdate || 0), 0) || null,
      stale: zones.some((z) => z.stale),
      demo: demoState(),
    });
  });

  r.get('/public/zones', (_req, res) => res.json(publicZoneIds().map(publicZone)));

  r.get('/public/regions', (_req, res) => {
    const zones = publicZoneIds().map(publicZone);
    const out = REGIONS.filter((rg) => zones.some((z) => z.regionId === rg.id)).map((rg) => {
      const rz = zones.filter((z) => z.regionId === rg.id);
      let status: RiskLevel = 'NORMAL';
      for (const z of rz) if (RANK[z.status] > RANK[status]) status = z.status;
      return {
        id: rg.id,
        name: rg.name,
        status,
        zoneCount: rz.length,
        warningZones: rz.filter((z) => z.status === 'WARNING').length,
        criticalZones: rz.filter((z) => z.status === 'CRITICAL').length,
        activeAlerts: rz.filter((z) => z.currentWarning).length,
        zones: rz.map((z) => ({ id: z.id, label: z.label, status: z.status })),
      };
    });
    res.json(out);
  });

  r.get('/public/alerts', (_req, res) => {
    const dayAgo = Date.now() - 86400000;
    const list = engine.alerts
      .filter((a) => engine.zones.get(a.zoneId)?.seed.publicVisible)
      .filter((a) => a.status !== 'RESOLVED' || (a.resolvedAt || 0) > dayAgo)
      .sort((a, b) => b.detectedAt - a.detectedAt)
      .map(publicAlert);
    res.json(list);
  });

  // ------------------------------------------------------------------ auth
  r.post('/auth/login', (req, res) => {
    const { username, password, role } = req.body || {};
    if (role !== undefined && role !== 'AUTHORITY' && role !== 'MINE_OPERATOR') return res.status(400).json({ error: 'Invalid role' });
    const result = login(String(username || ''), String(password || ''), role);
    if (!result) return res.status(401).json({ error: 'Invalid username or password for this role' });
    res.json({ token: result.token, user: { username: result.session.sub, role: result.session.role, name: result.session.name, organisation: result.session.org, expiresAt: result.session.exp } });
  });

  r.get('/auth/me', staff, (req: AuthedRequest, res) => {
    const s = req.session!;
    res.json({ username: s.sub, role: s.role, name: s.name, organisation: s.org, expiresAt: s.exp });
  });

  // ------------------------------------------------------------------ zones / regions
  r.get('/zones', staff, (_req, res) => res.json(Array.from(engine.zones.keys()).map(zoneView)));

  r.get('/zones/:id', staff, async (req, res) => {
    if (!engine.zones.has(req.params.id)) return res.status(404).json({ error: 'Zone not found' });
    const v = zoneView(req.params.id);
    const nodes = engine.nodesOfZone(req.params.id).map((n) => engine.nodeCloudView(n));
    const gateway = engine.gateways.get(v.gatewayId) || null;
    const prediction = await engine.prediction(req.params.id);
    res.json({ ...v, nodes, gateway, prediction });
  });

  r.patch('/zones/:id', operatorOnly, (req, res) => {
    try {
      const { monitoringEnabled, warningScore, criticalScore } = req.body || {};
      const z = engine.updateZone(req.params.id, {
        monitoringEnabled: typeof monitoringEnabled === 'boolean' ? monitoringEnabled : undefined,
        warningScore: warningScore !== undefined ? Number(warningScore) : undefined,
        criticalScore: criticalScore !== undefined ? Number(criticalScore) : undefined,
      });
      if (!z) return res.status(404).json({ error: 'Zone not found' });
      engine.tick();
      res.json(zoneView(z.id));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  r.get('/regions', staff, (_req, res) => {
    const zones = Array.from(engine.zones.keys()).map(zoneView);
    res.json(
      REGIONS.map((rg) => {
        const rz = zones.filter((z) => z.regionId === rg.id);
        let status: RiskLevel = rz.length ? 'NORMAL' : 'OFFLINE';
        for (const z of rz) if (RANK[z.status] > RANK[status]) status = z.status;
        return {
          ...rg,
          status,
          zoneCount: rz.length,
          nodes: rz.reduce((a, z) => a + z.totalNodes, 0),
          activeNodes: rz.reduce((a, z) => a + z.activeNodes, 0),
          warningZones: rz.filter((z) => z.status === 'WARNING').length,
          criticalZones: rz.filter((z) => z.status === 'CRITICAL').length,
          activeAlerts: rz.filter((z) => z.activeAlert).length,
          maxRiskScore: rz.reduce((a, z) => Math.max(a, z.riskScore), 0),
          zones: rz,
        };
      }),
    );
  });

  // ------------------------------------------------------------------ nodes & telemetry
  r.get('/nodes', staff, (req, res) => {
    const zoneId = req.query.zoneId ? String(req.query.zoneId) : undefined;
    const list = Array.from(engine.nodes.values())
      .filter((n) => !zoneId || n.zoneId === zoneId)
      .map((n) => ({ ...engine.nodeCloudView(n), gatewayId: engine.zones.get(n.zoneId)!.seed.gatewayId, zoneLabel: zoneView(n.zoneId).label }));
    res.json(list);
  });

  r.get('/nodes/:id', staff, (req, res) => {
    const n = engine.nodes.get(req.params.id);
    if (!n) return res.status(404).json({ error: 'Node not found' });
    const zone = zoneView(n.zoneId);
    res.json({ ...engine.nodeCloudView(n), gatewayId: zone.gatewayId, zoneLabel: zone.label, thresholds: zone.thresholds, limits: SIGNAL_LIMITS });
  });

  r.get('/telemetry', staff, (req, res) => {
    const range = Math.min(360, Math.max(5, Number(req.query.range) || 60));
    if (req.query.nodeId) {
      const id = String(req.query.nodeId);
      if (!engine.nodes.has(id)) return res.status(404).json({ error: 'Node not found' });
      return res.json({ nodeId: id, rangeMinutes: range, points: engine.nodeHistory(id, range) });
    }
    if (req.query.zoneId) {
      const id = String(req.query.zoneId);
      if (!engine.zones.has(id)) return res.status(404).json({ error: 'Zone not found' });
      const from = Date.now() - range * 60000;
      const pts = engine.zoneScoreCloudHistory(id).filter((p) => p.t >= from);
      const step = Math.max(1, Math.floor(pts.length / 240));
      return res.json({ zoneId: id, rangeMinutes: range, points: pts.filter((_, i) => i % step === 0) });
    }
    res.status(400).json({ error: 'nodeId or zoneId is required' });
  });

  // ------------------------------------------------------------------ alerts
  r.get('/alerts', staff, (req, res) => {
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    res.json(
      engine.alerts
        .filter((a) => !status || a.status === status)
        .sort((a, b) => b.detectedAt - a.detectedAt)
        .map((a) => ({ ...a, zoneLabel: zoneView(a.zoneId).label, regionName: regionName(engine.zones.get(a.zoneId)!.seed.regionId) })),
    );
  });

  r.post('/alerts/:id/acknowledge', staff, (req: AuthedRequest, res) => {
    const a = engine.acknowledgeAlert(req.params.id, `${req.session!.name} (${req.session!.sub})`);
    if (!a) return res.status(404).json({ error: 'Alert not found' });
    res.json(a);
  });

  r.post('/alerts/:id/resolve', staff, (req: AuthedRequest, res) => {
    const a = engine.resolveAlert(req.params.id, `${req.session!.name} (${req.session!.sub})`);
    if (!a) return res.status(404).json({ error: 'Alert not found' });
    res.json(a);
  });

  // ------------------------------------------------------------------ predictions
  r.get('/predictions', staff, async (_req, res) => {
    const out = [];
    for (const id of engine.zones.keys()) {
      const p = await engine.prediction(id);
      if (p) out.push({ ...p, zoneLabel: zoneView(id).label, regionName: zoneView(id).regionName });
    }
    res.json(out);
  });

  r.get('/predictions/:zoneId', staff, async (req, res) => {
    const p = await engine.prediction(req.params.zoneId);
    if (!p) return res.status(404).json({ error: 'Zone not found' });
    res.json({ ...p, zoneLabel: zoneView(req.params.zoneId).label });
  });

  // ------------------------------------------------------------------ gateways
  r.get('/gateways', staff, (_req, res) =>
    res.json(Array.from(engine.gateways.values()).map((g) => ({ ...g, zoneLabel: zoneView(g.zoneId).label }))),
  );

  r.get('/gateways/:id', staff, (req, res) => {
    const g = engine.gateways.get(req.params.id);
    if (!g) return res.status(404).json({ error: 'Gateway not found' });
    res.json({ ...g, zoneLabel: zoneView(g.zoneId).label, nodes: engine.nodesOfZone(g.zoneId).map((n) => engine.nodeCloudView(n)) });
  });

  r.post('/gateways/:id/silence', staff, (req, res) => {
    const g = engine.gateways.get(req.params.id);
    if (!g) return res.status(404).json({ error: 'Gateway not found' });
    const zr = engine.zones.get(g.zoneId)!;
    zr.silenced = true;
    if (zr.seed.dataSource === 'LIVE') telemetryStore.silenceBuzzer();
    engine.tick();
    res.json(engine.gateways.get(req.params.id));
  });

  // ------------------------------------------------------------------ system health
  r.get('/system-health', staff, async (_req, res) => {
    const nodes = Array.from(engine.nodes.values()).filter((n) => n.dataSource === 'DEMO').map((n) => engine.nodeCloudView(n));
    const online = nodes.filter((n) => n.status !== 'OFFLINE').length;
    const gws = Array.from(engine.gateways.values());
    const internet = engine.demo.internetOnline;
    const g = await probeGrafana();
    const sqlConfigured = Boolean(process.env.SQL_HOST);
    const proto = engine.zoneCloudStatus('proto-rig');
    const services = [
      {
        id: 'nodes', name: 'Sensor Nodes', state: online / nodes.length >= 0.9 ? 'OPERATIONAL' : online / nodes.length >= 0.5 ? 'DEGRADED' : 'OFFLINE',
        detail: `${online}/${nodes.length} demo nodes reporting · prototype rig: ${proto.activeNodes}/${proto.totalNodes} hardware nodes reporting`,
      },
      {
        id: 'gateways', name: 'Gateways', state: internet ? 'OPERATIONAL' : 'DEGRADED',
        detail: internet ? `${gws.length} gateways online` : 'Internet link down — gateways running in local-only mode (logging + local alarms active)',
      },
      {
        id: 'database', name: 'Database', state: 'OPERATIONAL',
        detail: sqlConfigured ? 'PostgreSQL (Cloud SQL) configured + in-memory buffer' : 'In-memory time-series buffer (prototype). Set SQL_HOST to enable PostgreSQL.',
      },
      { id: 'api', name: 'Platform API', state: 'OPERATIONAL', detail: `Last engine tick ${Math.round((Date.now() - engine.lastTick) / 1000)}s ago` },
      {
        id: 'ai', name: 'AI Prediction Service', state: process.env.AI_PREDICT_URL ? 'OPERATIONAL' : 'DEGRADED',
        detail: process.env.AI_PREDICT_URL ? 'External model configured via AI_PREDICT_URL' : 'Trend-extrapolation baseline active (simulated). LSTM model not connected.',
      },
      {
        id: 'alerts', name: 'Alert Service', state: internet ? 'OPERATIONAL' : 'DEGRADED',
        detail: internet ? 'Dashboard alerts live; SMS/e-mail delivery simulated (no provider configured)' : 'Remote SMS/e-mail queued until connectivity returns; local alarms unaffected',
      },
      {
        id: 'grafana', name: 'Grafana (control room)', state: g.ok ? 'OPERATIONAL' : g.configured ? 'OFFLINE' : 'DEGRADED',
        detail: g.ok ? 'Grafana reachable' : g.configured ? 'Grafana configured but not reachable' : 'Grafana not reachable from API. Start it with `docker compose up grafana` or set GRAFANA_URL.',
      },
    ];
    res.json({ services, checkedAt: Date.now(), demo: demoState() });
  });

  // ------------------------------------------------------------------ incidents
  r.get('/incidents', staff, (_req, res) =>
    res.json(
      engine.incidents
        .slice()
        .sort((a, b) => b.startedAt - a.startedAt)
        .map((i) => ({ ...i, zoneLabel: zoneView(i.zoneId).label, regionName: zoneView(i.zoneId).regionName, durationMin: Math.round(((i.endedAt || Date.now()) - i.startedAt) / 60000) })),
    ),
  );

  r.get('/incidents/:id', staff, (req, res) => {
    const i = engine.incidents.find((x) => x.id === req.params.id);
    if (!i) return res.status(404).json({ error: 'Incident not found' });
    res.json({ ...i, zoneLabel: zoneView(i.zoneId).label, regionName: zoneView(i.zoneId).regionName, durationMin: Math.round(((i.endedAt || Date.now()) - i.startedAt) / 60000) });
  });

  // ------------------------------------------------------------------ reports
  r.get('/reports', staff, (req, res) => {
    const period = req.query.period === 'weekly' ? 'weekly' : 'daily';
    const days = period === 'weekly' ? 7 : 1;
    const since = Date.now() - days * 86400000;
    const zones = Array.from(engine.zones.values()).filter((z) => z.seed.dataSource === 'DEMO');
    const zoneRows = zones.map((zr) => {
      const v = zoneView(zr.seed.id);
      const hist = zr.scoreHistory.filter((p) => p.t >= since);
      const live = hist.length ? { avg: hist.reduce((a, p) => a + p.score, 0) / hist.length, max: Math.max(...hist.map((p) => p.score)) } : { avg: 0, max: 0 };
      const agg = (engine.dailyAggregates.get(zr.seed.id) || []).slice(-(days - 1 > 0 ? days - 1 : 0));
      const avg = agg.length ? (agg.reduce((a, d) => a + d.avgScore, 0) + live.avg) / (agg.length + 1) : live.avg;
      const max = Math.max(live.max, ...agg.map((d) => d.maxScore), 0);
      const alerts = engine.alerts.filter((a) => a.zoneId === zr.seed.id && a.detectedAt >= since).length;
      return { zoneId: v.id, zone: v.label, region: v.regionName, currentStatus: v.status, avgRiskScore: Number(avg.toFixed(1)), maxRiskScore: Number(max.toFixed(1)), alerts, activeNodes: v.activeNodes, totalNodes: v.totalNodes };
    });
    const alertsInPeriod = engine.alerts.filter((a) => a.detectedAt >= since);
    const incidents = engine.incidents.filter((i) => i.startedAt >= since);
    const nodes = Array.from(engine.nodes.values()).filter((n) => n.dataSource === 'DEMO').map((n) => engine.nodeCloudView(n));
    const health = (k: keyof (typeof nodes)[number]['health']) => nodes.filter((n) => n.health[k] !== 'HEALTHY' && n.health[k] !== 'NOT_FITTED').length;
    res.json({
      period,
      generatedAt: Date.now(),
      from: since,
      isDemo: true,
      totals: {
        zones: zoneRows.length,
        alerts: alertsInPeriod.length,
        criticalAlerts: alertsInPeriod.filter((a) => a.severity === 'CRITICAL').length,
        warningAlerts: alertsInPeriod.filter((a) => a.severity === 'WARNING').length,
        incidents: incidents.length,
        openIncidents: incidents.filter((i) => i.status === 'OPEN').length,
        nodesOnline: nodes.filter((n) => n.status !== 'OFFLINE').length,
        nodesTotal: nodes.length,
      },
      zones: zoneRows,
      riskEvents: incidents.map((i) => ({ id: i.id, zone: zoneView(i.zoneId).label, severity: i.severity, trigger: i.trigger, startedAt: i.startedAt, status: i.status })),
      alertHistory: alertsInPeriod.map((a) => ({ id: a.id, zone: zoneView(a.zoneId).label, severity: a.severity, detectedAt: a.detectedAt, status: a.status, acknowledgedBy: a.acknowledgedBy, resolvedAt: a.resolvedAt })),
      nodeHealth: { offline: nodes.filter((n) => n.status === 'OFFLINE').length, batteryIssues: health('battery'), loraIssues: health('lora'), sensorWarnings: health('mpu6050') + health('piezo') + health('potentiometer') },
      dailyTrend: (() => {
        const map = new Map<string, { date: string; avgScore: number; maxScore: number; alerts: number; n: number }>();
        for (const zr of zones) {
          for (const d of (engine.dailyAggregates.get(zr.seed.id) || []).slice(-7)) {
            const e = map.get(d.date) || { date: d.date, avgScore: 0, maxScore: 0, alerts: 0, n: 0 };
            e.avgScore += d.avgScore;
            e.maxScore = Math.max(e.maxScore, d.maxScore);
            e.alerts += d.alerts;
            e.n++;
            map.set(d.date, e);
          }
        }
        return Array.from(map.values()).map((e) => ({ date: e.date, avgScore: Number((e.avgScore / e.n).toFixed(1)), maxScore: Number(e.maxScore.toFixed(1)), alerts: e.alerts }));
      })(),
    });
  });

  // ------------------------------------------------------------------ AI narrative
  r.post('/ai/summary', staff, async (req, res) => {
    const zoneId = String(req.body?.zoneId || '');
    if (!engine.zones.has(zoneId)) return res.status(400).json({ error: 'Valid zoneId required' });
    const v = zoneView(zoneId);
    const p = await engine.prediction(zoneId);
    const nodes = engine.nodesOfZone(zoneId).map((n) => engine.nodeCloudView(n));
    const elevated = Array.from(new Set(nodes.flatMap((n) => n.fusion?.elevatedSignals || [])));
    const alert = openAlertFor(zoneId);
    const result = await summarize({
      zoneLabel: v.label,
      status: v.status,
      riskScore: v.riskScore,
      predictedLevel: p?.predictedLevel || 'NORMAL',
      predictedScore: p?.predictedScore || 0,
      trend: p?.trend || 'STABLE',
      confidence: p?.confidence || 0,
      activeNodes: v.activeNodes,
      totalNodes: v.totalNodes,
      elevatedSignals: elevated,
      activeAlert: alert ? `${alert.id} (${alert.severity}, ${alert.status})` : null,
      simulated: v.dataSource === 'DEMO' || !!p?.simulated,
    });
    res.json({ zoneId, ...result, generatedAt: Date.now() });
  });

  return r;
}
