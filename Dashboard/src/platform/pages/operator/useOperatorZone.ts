import { useSearchParams } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../services/api';

const RANK = { OFFLINE: -1, NORMAL: 0, WARNING: 1, CRITICAL: 2 } as const;

/** Zone list + URL-synced selected zone (defaults to the highest-risk zone). */
export function useOperatorZone() {
  const zonesQ = usePolling((s) => api.getMonitoringZones(s), [], 3000);
  const [params, setParams] = useSearchParams();
  const zones = zonesQ.data || [];
  const fromUrl = params.get('zone');
  const fallback = zones
    .slice()
    .sort((a, b) => RANK[b.status] - RANK[a.status] || b.riskScore - a.riskScore)[0];
  const zoneId = zones.some((z) => z.id === fromUrl) ? fromUrl! : fallback?.id || null;
  const zone = zones.find((z) => z.id === zoneId) || null;
  const setZone = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('zone', id);
    setParams(next, { replace: true });
  };
  return { zones, zone, zoneId, setZone, loading: zonesQ.loading && !zonesQ.data, error: zonesQ.error, refresh: zonesQ.refresh, updatedAt: zonesQ.updatedAt };
}
