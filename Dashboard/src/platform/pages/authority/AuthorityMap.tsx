import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling';
import { useRoleBase } from '../../hooks/useStaff';
import { api } from '../../services/api';
import { MonitoringMap, MapLegend } from '../../components/MonitoringMap';
import { LastUpdated } from '../../components/cards';
import { RiskBadge, StatusDot } from '../../components/RiskBadge';
import { Button, Card, DemoTag, KeyValue, Loading, SectionTitle, cx } from '../../components/ui';
import { RISK_META } from '../../services/format';
import type { RiskLevel } from '../../services/types';

export default function AuthorityMap() {
  const { zoneBase } = useRoleBase();
  const [params, setParams] = useSearchParams();
  const selected = params.get('zone');
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');
  const zonesQ = usePolling((s) => api.getMonitoringZones(s), [], 3000);
  const zones = (zonesQ.data || []).filter((z) => z.publicVisible);
  const shown = zones.filter((z) => filter === 'all' || z.status === filter);
  const markers = useMemo(() => shown.map((z) => ({ id: z.id, lat: z.lat, lng: z.lng, status: z.status, title: z.label })), [shown]);
  const sel = zones.find((z) => z.id === selected);
  const detailQ = usePolling((s) => (selected ? api.getZone(selected, s) : Promise.resolve(null)), [selected], 4000, !!selected);
  const detail = selected ? detailQ.data : null;

  if (zonesQ.loading && !zonesQ.data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">GIS</div>
          <h1 className="text-2xl font-bold">Live map</h1>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={zonesQ.updatedAt} />
          <DemoTag />
        </div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Status filter">
        {(['all', 'CRITICAL', 'WARNING', 'NORMAL', 'OFFLINE'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            aria-pressed={filter === s}
            className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border', filter === s ? 'bg-ink-600 border-white/25' : 'bg-ink-800 border-white/10 text-fg-2')}
          >
            {s !== 'all' && <StatusDot level={s} />}
            {s === 'all' ? `All (${zones.length})` : `${RISK_META[s].label} (${zones.filter((z) => z.status === s).length})`}
          </button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card pad={false} className="overflow-hidden">
          <MonitoringMap markers={markers} selectedId={selected} onSelect={(id) => setParams({ zone: id })} height="min(72vh, 680px)" focusZoom={12} />
          <div className="px-4 py-2 border-t bd-hairline"><MapLegend /></div>
        </Card>
        <div className="space-y-4">
          {sel ? (
            <Card>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{sel.label}</h2>
                  <div className="text-xs text-fg-3">{sel.regionName} · {sel.description}</div>
                </div>
                <RiskBadge level={sel.status} size="md" pulse />
              </div>
              <div className="mt-3">
                <KeyValue label="Risk score (fused)" value={sel.riskScore} mono />
                <KeyValue label="Nodes reporting" value={`${sel.activeNodes}/${sel.totalNodes}`} mono />
                <KeyValue label="Predicted (60 min)" value={detail?.prediction ? <RiskBadge level={detail.prediction.predictedLevel} size="xs" /> : '…'} />
                <KeyValue label="Trend" value={detail?.prediction?.trend.toLowerCase() || '…'} />
                <KeyValue label="Active alert" value={sel.activeAlert ? `#${sel.activeAlert.id} · ${sel.activeAlert.status}` : 'None'} />
                <KeyValue label="Gateway" value={sel.gatewayId} mono />
                <KeyValue label="Last update" value={<LastUpdated at={sel.lastUpdate} stale={sel.stale} label="" />} />
              </div>
              <Link to={`${zoneBase}/${sel.id}`}>
                <Button variant="primary" className="w-full mt-4">Investigate zone</Button>
              </Link>
            </Card>
          ) : (
            <Card className="text-sm text-fg-2">Select a zone on the map to investigate.</Card>
          )}
          <Card pad={false}>
            <div className="px-4 pt-4"><SectionTitle title="Zones by risk" /></div>
            <ul className="px-2 pb-2 max-h-[380px] overflow-y-auto">
              {shown
                .slice()
                .sort((a, b) => b.riskScore - a.riskScore)
                .map((z) => (
                  <li key={z.id}>
                    <button onClick={() => setParams({ zone: z.id })} className={cx('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left', z.id === selected ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]')}>
                      <StatusDot level={z.status} ping />
                      <span className="flex-1 min-w-0 text-sm truncate">{z.label}</span>
                      <span className="bd-num text-xs text-fg-3">{z.riskScore}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
