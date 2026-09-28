import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertOctagon, Bell, Brain, MapPinned, Radio, WifiOff } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { useAlertActions } from '../../hooks/useStaff';
import { useLive } from '../../context/LiveContext';
import { api } from '../../services/api';
import { MonitoringMap, MapLegend } from '../../components/MonitoringMap';
import { LastUpdated, MetricCard } from '../../components/cards';
import { OfflineFirstPanel } from '../../components/domain';
import { AlertsTable, PredictionPanel, RiskDistribution } from '../../components/staff';
import { RiskBadge } from '../../components/RiskBadge';
import { Card, DemoTag, Empty, ErrorBanner, Loading, SectionTitle } from '../../components/ui';
import type { RiskLevel } from '../../services/types';

export default function AuthorityOverview() {
  const navigate = useNavigate();
  const { summary } = useLive();
  const zonesQ = usePolling((s) => api.getMonitoringZones(s), [], 3000);
  const alertsQ = usePolling((s) => api.getAlerts(s), [], 3000);
  const predQ = usePolling((s) => api.getRiskPredictions(s), [], 5000);
  const actions = useAlertActions(alertsQ.refresh);

  const zones = zonesQ.data || [];
  const publicZones = zones.filter((z) => z.publicVisible);
  const active = (alertsQ.data || []).filter((a) => a.status !== 'RESOLVED');
  const counts = useMemo(() => {
    const c = { NORMAL: 0, WARNING: 0, CRITICAL: 0, OFFLINE: 0 } as Record<RiskLevel, number>;
    publicZones.forEach((z) => c[z.status]++);
    return c;
  }, [publicZones]);
  const nodesActive = publicZones.reduce((a, z) => a + z.activeNodes, 0);
  const nodesOffline = publicZones.reduce((a, z) => a + z.offlineNodes, 0);
  const preds = (predQ.data || []).filter((p) => publicZones.some((z) => z.id === p.zoneId));
  const highRisk = preds.filter((p) => p.predictedLevel === 'CRITICAL');
  const focus = preds.slice().sort((a, b) => b.predictedScore - a.predictedScore)[0];
  const focusZone = zones.find((z) => z.id === focus?.zoneId);

  const markers = useMemo(
    () =>
      publicZones.map((z) => ({
        id: z.id,
        lat: z.lat,
        lng: z.lng,
        status: z.status,
        title: z.label,
        popup: (
          <div className="text-sm">
            <div className="font-semibold">{z.label}</div>
            <div className="text-xs opacity-70">{z.regionName}</div>
            <div className="mt-1 text-xs">Risk score <b>{z.riskScore}</b> · {z.activeNodes}/{z.totalNodes} nodes</div>
            <Link className="text-xs text-signal" to={`/authority/zone/${z.id}`}>Investigate zone →</Link>
          </div>
        ),
      })),
    [publicZones],
  );

  if (zonesQ.loading && !zonesQ.data) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Authority · Disaster management</div>
          <h1 className="text-2xl font-bold">Monitoring overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={zonesQ.updatedAt} stale={summary?.stale} />
          <DemoTag />
        </div>
      </div>
      <ErrorBanner message={zonesQ.error || alertsQ.error} onRetry={zonesQ.refresh} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard label="Total monitoring zones" value={publicZones.length} icon={MapPinned} onClick={() => navigate('/authority/map')} />
        <MetricCard label="Active nodes" value={nodesActive} icon={Radio} sub={`of ${nodesActive + nodesOffline} installed`} />
        <MetricCard label="Critical zones" value={counts.CRITICAL} tone={counts.CRITICAL ? 'CRITICAL' : 'neutral'} icon={AlertOctagon} />
        <MetricCard label="Active alerts" value={active.length} tone={active.length ? 'WARNING' : 'neutral'} icon={Bell} onClick={() => navigate('/authority/alerts')} />
        <MetricCard label="Offline nodes" value={nodesOffline} tone={nodesOffline ? 'OFFLINE' : 'neutral'} icon={WifiOff} />
        <MetricCard label="Predicted high-risk zones" value={highRisk.length} tone={highRisk.length ? 'CRITICAL' : 'neutral'} icon={Brain} sub="next 60 min · simulated" onClick={() => navigate('/authority/risk')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card pad={false} className="overflow-hidden">
          <div className="px-4 pt-4 flex flex-wrap items-center justify-between gap-2">
            <SectionTitle title="Live GIS map" className="mb-0" />
            <MapLegend />
          </div>
          <MonitoringMap markers={markers} height={420} className="mt-3" onSelect={() => undefined} />
        </Card>
        <div className="space-y-4">
          <Card>
            <SectionTitle title="Risk distribution" action={<span className="text-xs text-fg-3">{publicZones.length} zones</span>} />
            <RiskDistribution counts={counts} />
          </Card>
          <Card>
            <SectionTitle title="Connectivity & local resilience" />
            <OfflineFirstPanel internetOnline={summary?.demo.internetOnline ?? true} synchronizing={summary?.demo.synchronizing ?? false} compact />
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title="Active alerts" action={<Link to="/authority/alerts" className="text-sm text-signal hover:underline">Manage alerts →</Link>} />
        <ErrorBanner message={actions.error} />
        {active.length === 0 ? (
          <Empty title="No active alerts" hint="All zones are within normal limits." />
        ) : (
          <AlertsTable alerts={active} onAck={actions.ack} busy={actions.busy} viewBase="/authority/zone" zoneIdOf={(id) => active.find((a) => a.id === id)!.zoneId} />
        )}
      </Card>

      <Card>
        <SectionTitle
          eyebrow="AI prediction"
          title={focusZone ? <>Highest projected risk: {focusZone.label}</> : 'AI prediction'}
          action={focusZone && <Link to={`/authority/zone/${focusZone.id}`} className="text-sm text-signal hover:underline">Investigate →</Link>}
        />
        {focus ? <PredictionPanel prediction={focus} thresholds={focusZone?.thresholds} /> : <Loading label="Computing predictions…" />}
        {preds.length > 1 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {preds
              .slice()
              .sort((a, b) => b.predictedScore - a.predictedScore)
              .slice(1, 7)
              .map((p) => (
                <Link key={p.zoneId} to={`/authority/zone/${p.zoneId}`} className="bd-card-2 px-3 py-2 flex items-center gap-2 hover:border-white/20">
                  <span className="text-sm truncate flex-1">{p.zoneLabel}</span>
                  <span className="text-[11px] text-fg-3">now</span>
                  <RiskBadge level={p.currentLevel} size="xs" />
                  <span className="text-[11px] text-fg-3">→</span>
                  <RiskBadge level={p.predictedLevel} size="xs" />
                </Link>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
