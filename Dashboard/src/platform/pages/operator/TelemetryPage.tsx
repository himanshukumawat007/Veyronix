import React from 'react';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../services/api';
import { ZoneSelector, ZoneTelemetryCharts } from '../../components/staff';
import { RiskBadge } from '../../components/RiskBadge';
import { Card, DemoTag, Loading } from '../../components/ui';
import { useOperatorZone } from './useOperatorZone';

export default function TelemetryPage() {
  const { zones, zone, zoneId, setZone, loading } = useOperatorZone();
  const nodesQ = usePolling((s) => (zoneId ? api.getNodes(zoneId, s) : Promise.resolve([])), [zoneId], 10000, !!zoneId);
  if (loading || !zone) return <Loading />;
  const ids = (nodesQ.data || []).map((n) => n.id);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Mine operator</div>
          <h1 className="text-2xl font-bold flex items-center gap-3">Telemetry <RiskBadge level={zone.status} size="md" /></h1>
          <p className="text-sm text-fg-2 mt-1">Tilt, vibration, displacement, crack width and fused risk score for every node in the zone.</p>
        </div>
        {zone.dataSource === 'DEMO' ? <DemoTag /> : <DemoTag label="LIVE HARDWARE" />}
      </div>
      <Card className="py-3"><ZoneSelector zones={zones} value={zoneId} onChange={setZone} /></Card>
      <Card>{ids.length ? <ZoneTelemetryCharts nodeIds={ids} showCrack={zone.dataSource === 'DEMO'} height={230} /> : <Loading />}</Card>
    </div>
  );
}
