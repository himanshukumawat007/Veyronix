import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Battery, Clock, MapPin, Radio, Server } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { useNow } from '../../hooks/useNow';
import { api } from '../../services/api';
import { MetricCard } from '../../components/cards';
import { RiskScoreChart, TelemetryChart } from '../../components/charts';
import { SensorHealthCard } from '../../components/domain';
import { FusionDiagram } from '../../components/diagrams';
import { RANGES } from '../../components/staff';
import { RiskBadge } from '../../components/RiskBadge';
import { Card, DemoTag, ErrorBanner, KeyValue, Loading, SectionTitle, Segmented } from '../../components/ui';
import { timeAgo, vibrationLabel } from '../../services/format';

export default function NodeDetailPage() {
  const { nodeId = '' } = useParams();
  const now = useNow(1000);
  const [range, setRange] = useState<'15' | '60' | '120'>('60');
  const nodeQ = usePolling((s) => api.getNode(nodeId, s), [nodeId], 3000);
  const telQ = usePolling((s) => api.getTelemetry(nodeId, Number(range), s), [nodeId, range], 4000);
  const n = nodeQ.data;
  const rows = useMemo(() => (telQ.data?.points || []).map((p) => ({ t: p.t, tilt: p.tiltDeg, vib: p.vibration, disp: p.displacementMm, crack: p.crackMm, risk: p.riskScore })), [telQ.data]);
  if (nodeQ.loading && !n) return <Loading />;
  if (!n) return <ErrorBanner message={nodeQ.error || 'Node not found'} />;
  const l = n.latest;
  const off = n.status === 'OFFLINE';
  const lim = n.limits;

  return (
    <div className="space-y-5">
      <Link to={`/operator/nodes?zone=${n.zoneId}`} className="inline-flex items-center gap-1 text-sm text-fg-3 hover:text-fg">
        <ArrowLeft className="w-4 h-4" aria-hidden /> All nodes
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Sensor node</div>
          <h1 className="text-2xl font-bold flex flex-wrap items-center gap-3 bd-num">
            {n.id} <RiskBadge level={n.status} size="lg" pulse />
          </h1>
          <p className="text-sm text-fg-2">{n.name}</p>
        </div>
        {n.dataSource === 'DEMO' ? <DemoTag /> : <DemoTag label="LIVE HARDWARE" />}
      </div>
      <ErrorBanner message={nodeQ.error} />
      {n.fusion?.suppressedSingleSensor && (
        <div className="rounded-lg border border-risk-warning/40 bg-risk-warning/10 px-4 py-3 text-sm">
          <strong>Maintenance flag:</strong> {n.fusion.note}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card>
          <SectionTitle title="Node information" />
          <KeyValue label="Status" value={<RiskBadge level={n.status} size="xs" />} />
          <KeyValue label="Battery" value={<span className="inline-flex items-center gap-1"><Battery className="w-3.5 h-3.5" aria-hidden />{n.batteryPct}%</span>} />
          <KeyValue label="Last seen" value={<span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden />{timeAgo(n.lastSeen, now)}</span>} />
          <KeyValue label="Gateway" value={<Link to={`/operator/gateway?gw=${n.gatewayId}`} className="text-signal hover:underline inline-flex items-center gap-1"><Server className="w-3.5 h-3.5" aria-hidden />{n.gatewayId}</Link>} />
          <KeyValue label="Zone" value={<Link to={`/operator/dashboard?zone=${n.zoneId}`} className="text-signal hover:underline">{n.zoneLabel}</Link>} />
          <KeyValue label="Location" value={n.lat ? <span className="inline-flex items-center gap-1 bd-num"><MapPin className="w-3.5 h-3.5" aria-hidden />{n.lat.toFixed(4)}, {n.lng.toFixed(4)}</span> : 'Lab test rig'} />
          <KeyValue label="LoRa RSSI" value={<span className="inline-flex items-center gap-1 bd-num"><Radio className="w-3.5 h-3.5" aria-hidden />{n.rssi} dBm</span>} />
          {n.edgeClassifier && <KeyValue label="Edge classifier" value={`${n.edgeClassifier.status} · ${n.edgeClassifier.riskScore}`} />}
          <div className="mt-4">
            <SectionTitle title="Sensor health" />
            <SensorHealthCard node={n} />
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="Tilt" value={off || !l ? '--' : `${l.tiltDeg.toFixed(2)}°`} />
            <MetricCard label="Vibration" value={off || !l ? '--' : vibrationLabel(l.vibration)} sub={l && !off ? `${l.vibration.toFixed(3)} m/s²` : undefined} />
            <MetricCard label="Displacement" value={off || !l ? '--' : `${l.displacementMm.toFixed(2)} mm`} />
            <MetricCard label="Crack width" value={off || !l || l.crackMm === null ? '--' : `${l.crackMm.toFixed(2)} mm`} sub={l && l.crackMm === null ? 'sensor not fitted' : undefined} />
            <MetricCard label="Risk score" value={off || !l ? '--' : l.riskScore.toFixed(1)} tone={n.status} className="col-span-2 md:col-span-1" />
          </div>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <SectionTitle title="History" className="mb-0" />
              <Segmented ariaLabel="Time range" value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r.value, label: r.label }))} />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {[
                { t: 'Tilt history', k: 'tilt', u: '°', w: lim?.tiltDeg.warn, c: lim?.tiltDeg.crit, d: 2 },
                { t: 'Vibration history', k: 'vib', u: 'm/s²', w: lim?.vibration.warn, c: lim?.vibration.crit, d: 3 },
                { t: 'Displacement history', k: 'disp', u: 'mm', w: lim?.displacementMm.warn, c: lim?.displacementMm.crit, d: 2 },
                ...(l?.crackMm !== null ? [{ t: 'Crack width history', k: 'crack', u: 'mm', w: lim?.crackMm.warn, c: lim?.crackMm.crit, d: 2 }] : []),
              ].map((c) => (
                <div key={c.k} className="bd-card-2 p-3">
                  <h3 className="text-sm font-semibold mb-1">{c.t} <span className="text-[11px] text-fg-3 font-normal">{c.u}</span></h3>
                  <TelemetryChart data={rows} series={[{ key: c.k, name: n.id }]} unit={c.u} warn={c.w} crit={c.c} digits={c.d} height={190} ariaLabel={c.t} />
                </div>
              ))}
            </div>
            <div className="bd-card-2 p-3 mt-3">
              <h3 className="text-sm font-semibold mb-1">Risk history</h3>
              <RiskScoreChart data={rows.map((r) => ({ t: r.t as number, score: r.risk as number }))} warn={n.thresholds?.warningScore} crit={n.thresholds?.criticalScore} />
            </div>
          </Card>
          <Card>
            <SectionTitle title="Sensor fusion for this node" />
            <FusionDiagram live={n.fusion ? { elevated: n.fusion.elevatedSignals, corroborated: n.fusion.corroborated, suppressed: n.fusion.suppressedSingleSensor, note: n.fusion.note } : null} />
          </Card>
        </div>
      </div>
    </div>
  );
}
