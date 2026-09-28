import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { useAlertActions, useRoleBase } from '../../hooks/useStaff';
import { api } from '../../services/api';
import { MonitoringMap } from '../../components/MonitoringMap';
import { LastUpdated, MetricCard } from '../../components/cards';
import { GatewayStatusPanel, NodeTable, StaffAlertCard } from '../../components/domain';
import { FusionDiagram } from '../../components/diagrams';
import { PredictionPanel, ZoneTelemetryCharts } from '../../components/staff';
import { RiskBadge } from '../../components/RiskBadge';
import { Card, DemoTag, ErrorBanner, Loading, SectionTitle } from '../../components/ui';

export default function ZoneDetailPage() {
  const { zoneId = '' } = useParams();
  const { base, nodeBase } = useRoleBase();
  const q = usePolling((s) => api.getZone(zoneId, s), [zoneId], 3000);
  const alertsQ = usePolling((s) => api.getAlerts(s), [], 4000);
  const actions = useAlertActions(() => {
    alertsQ.refresh();
    q.refresh();
  });
  const z = q.data;
  if (q.loading && !z) return <Loading />;
  if (!z) return <ErrorBanner message={q.error || 'Zone not found'} />;
  const zoneAlerts = (alertsQ.data || []).filter((a) => a.zoneId === z.id).slice(0, 4);
  const fusionNode = z.nodes.filter((n) => n.fusion).sort((a, b) => (b.fusion!.score || 0) - (a.fusion!.score || 0));
  const fusionLive = fusionNode.find((n) => n.fusion?.suppressedSingleSensor) || fusionNode[0];
  const nodeMarkers = z.nodes.filter((n) => n.lat).map((n) => ({ id: n.id, lat: n.lat, lng: n.lng, status: n.status, title: n.id, size: 'sm' as const }));

  return (
    <div className="space-y-5">
      <Link to={`${base}/dashboard`} className="inline-flex items-center gap-1 text-sm text-fg-3 hover:text-fg">
        <ArrowLeft className="w-4 h-4" aria-hidden /> Back to overview
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">{z.regionName} · Monitoring zone</div>
          <h1 className="text-2xl font-bold flex flex-wrap items-center gap-3">
            {z.label} <RiskBadge level={z.status} size="lg" pulse />
          </h1>
          <p className="text-sm text-fg-2 mt-1">{z.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={z.lastUpdate} stale={z.stale} />
          {z.dataSource === 'DEMO' ? <DemoTag /> : <DemoTag label="LIVE HARDWARE" />}
        </div>
      </div>
      <ErrorBanner message={q.error || actions.error} onRetry={q.refresh} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard label="Fused risk score" value={z.riskScore} tone={z.status} />
        <MetricCard label="Nodes reporting" value={`${z.activeNodes}/${z.totalNodes}`} tone={z.offlineNodes ? 'WARNING' : 'neutral'} />
        <MetricCard label="Predicted (60 min)" value={z.prediction?.predictedLevel || '—'} tone={z.prediction?.predictedLevel || 'neutral'} sub={z.prediction?.simulated ? 'simulated' : undefined} />
        <MetricCard label="Active alert" value={z.activeAlert ? `#${z.activeAlert.id}` : 'None'} tone={z.activeAlert ? z.activeAlert.severity : 'neutral'} />
        <MetricCard label="Thresholds" value={`${z.thresholds.warningScore} / ${z.thresholds.criticalScore}`} sub="warning / critical score" className="col-span-2 lg:col-span-1" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <SectionTitle eyebrow="AI" title="Risk prediction" />
          {z.prediction ? <PredictionPanel prediction={z.prediction} thresholds={z.thresholds} /> : <Loading />}
        </Card>
        <div className="space-y-4">
          {nodeMarkers.length > 0 && (
            <Card pad={false} className="overflow-hidden">
              <MonitoringMap markers={nodeMarkers} height={260} focusZoom={14} ariaLabel="Sensor node locations" />
            </Card>
          )}
          <Card>
            <SectionTitle title="Sensor fusion (live)" />
            <FusionDiagram live={fusionLive?.fusion ? { elevated: fusionLive.fusion.elevatedSignals, corroborated: fusionLive.fusion.corroborated, suppressed: fusionLive.fusion.suppressedSingleSensor, note: `${fusionLive.id}: ${fusionLive.fusion.note}` } : null} />
          </Card>
        </div>
      </div>

      {zoneAlerts.length > 0 && (
        <div>
          <SectionTitle title="Alerts for this zone" />
          <div className="grid gap-3 lg:grid-cols-2">
            {zoneAlerts.map((a) => (
              <StaffAlertCard key={a.id} alert={a} onAck={() => actions.ack(a.id)} onResolve={() => actions.resolve(a.id)} busy={actions.busy} />
            ))}
          </div>
        </div>
      )}

      <Card>
        <SectionTitle title="Sensor nodes" />
        <NodeTable nodes={z.nodes} linkBase={nodeBase} />
      </Card>

      <Card>
        <SectionTitle title="Telemetry trends" />
        <ZoneTelemetryCharts nodeIds={z.nodes.map((n) => n.id)} showCrack={z.dataSource === 'DEMO'} />
      </Card>

      {z.gateway && (
        <Card>
          <SectionTitle title="Gateway status" />
          <GatewayStatusPanel gw={{ ...z.gateway, zoneLabel: z.label }} />
        </Card>
      )}
    </div>
  );
}
