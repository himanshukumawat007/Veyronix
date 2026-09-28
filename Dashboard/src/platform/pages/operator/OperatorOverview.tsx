import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, BatteryWarning, Bell, Radio, Server } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { useAlertActions } from '../../hooks/useStaff';
import { api } from '../../services/api';
import { LastUpdated, MetricCard } from '../../components/cards';
import { GatewayStatusPanel, NodeTable, StaffAlertCard } from '../../components/domain';
import { PredictionPanel, ZoneSelector, ZoneTelemetryCharts } from '../../components/staff';
import { RiskBadge } from '../../components/RiskBadge';
import { Card, DemoTag, ErrorBanner, Loading, SectionTitle } from '../../components/ui';
import { useOperatorZone } from './useOperatorZone';

export default function OperatorOverview() {
  const { zones, zone, zoneId, setZone, loading, error, updatedAt } = useOperatorZone();
  const detailQ = usePolling((s) => (zoneId ? api.getZone(zoneId, s) : Promise.resolve(null)), [zoneId], 3000, !!zoneId);
  const alertsQ = usePolling((s) => api.getAlerts(s), [], 3000);
  const actions = useAlertActions(alertsQ.refresh);
  const d = detailQ.data;
  if (loading || !zone) return <Loading />;
  const zoneAlerts = (alertsQ.data || []).filter((a) => a.zoneId === zone.id && a.status !== 'RESOLVED');
  const lowBattery = d?.nodes.filter((n) => n.batteryPct < 30).length || 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Mine operator</div>
          <h1 className="text-2xl font-bold flex flex-wrap items-center gap-3">
            {zone.label} <RiskBadge level={zone.status} size="lg" pulse />
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={updatedAt} stale={zone.stale} />
          {zone.dataSource === 'DEMO' ? <DemoTag /> : <DemoTag label="LIVE HARDWARE" />}
        </div>
      </div>
      <Card className="py-3">
        <ZoneSelector zones={zones} value={zoneId} onChange={setZone} />
      </Card>
      <ErrorBanner message={error || detailQ.error || actions.error} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard label="Current risk score" value={zone.riskScore} tone={zone.status} icon={Activity} />
        <MetricCard label="AI predicted (60 min)" value={d?.prediction?.predictedLevel || '…'} tone={d?.prediction?.predictedLevel || 'neutral'} sub={d?.prediction?.simulated ? 'simulated forecast' : undefined} />
        <MetricCard label="Nodes online" value={`${zone.activeNodes}/${zone.totalNodes}`} tone={zone.offlineNodes ? 'WARNING' : 'neutral'} icon={Radio} />
        <MetricCard label="Open alerts" value={zoneAlerts.length} tone={zoneAlerts.length ? 'WARNING' : 'neutral'} icon={Bell} />
        <MetricCard label="Low battery nodes" value={lowBattery} tone={lowBattery ? 'WARNING' : 'neutral'} icon={BatteryWarning} />
        <MetricCard label="Gateway" value={d?.gateway?.loraStatus || '…'} icon={Server} sub={d?.gateway ? `${d.gateway.id} · internet ${d.gateway.internet.toLowerCase()}` : undefined} />
      </div>

      {zoneAlerts.length > 0 && (
        <div className="grid gap-3 xl:grid-cols-2">
          {zoneAlerts.map((a) => (
            <StaffAlertCard key={a.id} alert={a} onAck={() => actions.ack(a.id)} onResolve={() => actions.resolve(a.id)} busy={actions.busy} compact />
          ))}
        </div>
      )}

      <Card>
        <SectionTitle title="Sensor nodes" action={<Link to={`/operator/nodes?zone=${zone.id}`} className="text-sm text-signal hover:underline">All nodes →</Link>} />
        {d ? <NodeTable nodes={d.nodes} /> : <Loading />}
      </Card>

      <Card>
        <SectionTitle title="Telemetry" action={<Link to={`/operator/telemetry?zone=${zone.id}`} className="text-sm text-signal hover:underline">Full telemetry →</Link>} />
        {d && <ZoneTelemetryCharts nodeIds={d.nodes.map((n) => n.id)} showCrack={zone.dataSource === 'DEMO'} height={180} />}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionTitle eyebrow="AI" title="Risk prediction" />
          {d?.prediction ? <PredictionPanel prediction={d.prediction} thresholds={zone.thresholds} /> : <Loading />}
        </Card>
        <Card>
          <SectionTitle title="Gateway status" action={<Link to={`/operator/gateway?gw=${zone.gatewayId}`} className="text-sm text-signal hover:underline">Details →</Link>} />
          {d?.gateway ? <GatewayStatusPanel gw={{ ...d.gateway, zoneLabel: zone.label }} /> : <Loading />}
        </Card>
      </div>
    </div>
  );
}
