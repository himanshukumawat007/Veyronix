/**
 * BHU-DRISHTI platform API client.
 *
 * All network access goes through this module so UI components never build URLs themselves.
 * The base URL comes from VITE_API_BASE_URL (defaults to same-origin `/api/v1`).
 * Responses are shape-checked before use; a failed check throws ApiError so the UI can show
 * a clean error state instead of rendering broken data.
 */
import type {
  AiSummary,
  AlertRecord,
  DemoState,
  GatewayView,
  Incident,
  Meta,
  NodeView,
  Prediction,
  PublicAlert,
  PublicRegion,
  PublicSummary,
  PublicZone,
  RegionView,
  Report,
  Scenario,
  SensorReading,
  SessionUser,
  SystemHealth,
  ZoneDetail,
  ZoneView,
} from './types';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1';

export class ApiError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

type Check = (v: unknown) => boolean;
const isObj: Check = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isArr: Check = (v) => Array.isArray(v);
const has = (...keys: string[]): Check => (v) => isObj(v) && keys.every((k) => k in (v as object));

async function request<T>(path: string, opts: { method?: string; body?: unknown; check?: Check; signal?: AbortSignal } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method || 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    throw new ApiError('Cannot reach the BHU-DRISHTI server. Check your connection.', 0);
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(`Unexpected response from server (${res.status})`, res.status);
  }
  if (!res.ok) {
    if (res.status === 401 && authToken && onUnauthorized) onUnauthorized();
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  if (opts.check && !opts.check(data)) throw new ApiError('Malformed response from server', res.status);
  return data as T;
}

export const api = {
  // meta & demo
  getMeta: (signal?: AbortSignal) => request<Meta>('/meta', { check: has('demo', 'grafana'), signal }),
  getDemo: (signal?: AbortSignal) => request<DemoState>('/demo', { check: has('scenario'), signal }),
  setDemo: (patch: { scenario?: Scenario; internetOnline?: boolean }) => request<DemoState>('/demo', { method: 'POST', body: patch, check: has('scenario') }),
  resetDemo: () => request<DemoState>('/demo/reset', { method: 'POST', body: {}, check: has('scenario') }),

  // public
  getPublicSummary: (signal?: AbortSignal) => request<PublicSummary>('/public/summary', { check: has('overall', 'headline'), signal }),
  getPublicZones: (signal?: AbortSignal) => request<PublicZone[]>('/public/zones', { check: isArr, signal }),
  getPublicRegions: (signal?: AbortSignal) => request<PublicRegion[]>('/public/regions', { check: isArr, signal }),
  getPublicAlerts: (signal?: AbortSignal) => request<PublicAlert[]>('/public/alerts', { check: isArr, signal }),

  // auth
  login: (username: string, password: string, role: SessionUser['role']) =>
    request<{ token: string; user: SessionUser }>('/auth/login', { method: 'POST', body: { username, password, role }, check: has('token', 'user') }),
  me: () => request<SessionUser>('/auth/me', { check: has('role') }),

  // monitoring
  getMonitoringZones: (signal?: AbortSignal) => request<ZoneView[]>('/zones', { check: isArr, signal }),
  getZone: (id: string, signal?: AbortSignal) => request<ZoneDetail>(`/zones/${encodeURIComponent(id)}`, { check: has('id', 'nodes'), signal }),
  updateZone: (id: string, patch: { monitoringEnabled?: boolean; warningScore?: number; criticalScore?: number }) =>
    request<ZoneView>(`/zones/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch, check: has('id') }),
  getRegions: (signal?: AbortSignal) => request<RegionView[]>('/regions', { check: isArr, signal }),
  getNodes: (zoneId?: string, signal?: AbortSignal) => request<NodeView[]>(`/nodes${zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : ''}`, { check: isArr, signal }),
  getNode: (id: string, signal?: AbortSignal) => request<NodeView>(`/nodes/${encodeURIComponent(id)}`, { check: has('id', 'health'), signal }),
  getTelemetry: (nodeId: string, rangeMinutes: number, signal?: AbortSignal) =>
    request<{ nodeId: string; rangeMinutes: number; points: SensorReading[] }>(`/telemetry?nodeId=${encodeURIComponent(nodeId)}&range=${rangeMinutes}`, { check: has('points'), signal }),
  getZoneRiskHistory: (zoneId: string, rangeMinutes: number, signal?: AbortSignal) =>
    request<{ zoneId: string; points: Array<{ t: number; score: number }> }>(`/telemetry?zoneId=${encodeURIComponent(zoneId)}&range=${rangeMinutes}`, { check: has('points'), signal }),

  // alerts & incidents
  getAlerts: (signal?: AbortSignal) => request<AlertRecord[]>('/alerts', { check: isArr, signal }),
  acknowledgeAlert: (id: string) => request<AlertRecord>(`/alerts/${encodeURIComponent(id)}/acknowledge`, { method: 'POST', body: {} }),
  resolveAlert: (id: string) => request<AlertRecord>(`/alerts/${encodeURIComponent(id)}/resolve`, { method: 'POST', body: {} }),
  getIncidents: (signal?: AbortSignal) => request<Incident[]>('/incidents', { check: isArr, signal }),
  getIncident: (id: string, signal?: AbortSignal) => request<Incident>(`/incidents/${encodeURIComponent(id)}`, { check: has('events'), signal }),

  // AI
  getRiskPredictions: (signal?: AbortSignal) => request<Prediction[]>('/predictions', { check: isArr, signal }),
  getRiskPrediction: (zoneId: string, signal?: AbortSignal) => request<Prediction>(`/predictions/${encodeURIComponent(zoneId)}`, { check: has('timeline'), signal }),
  getAiSummary: (zoneId: string) => request<AiSummary>('/ai/summary', { method: 'POST', body: { zoneId }, check: has('text') }),

  // infrastructure
  getGateways: (signal?: AbortSignal) => request<GatewayView[]>('/gateways', { check: isArr, signal }),
  getGatewayStatus: (id: string, signal?: AbortSignal) => request<GatewayView>(`/gateways/${encodeURIComponent(id)}`, { check: has('id', 'internet'), signal }),
  silenceGateway: (id: string) => request<GatewayView>(`/gateways/${encodeURIComponent(id)}/silence`, { method: 'POST', body: {} }),
  getSystemHealth: (signal?: AbortSignal) => request<SystemHealth>('/system-health', { check: has('services'), signal }),
  getReport: (period: 'daily' | 'weekly', signal?: AbortSignal) => request<Report>(`/reports?period=${period}`, { check: has('totals', 'zones'), signal }),
};
