import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BellRing, Layers, MapPinned, Radio, ShieldAlert, Signal, Wallet } from 'lucide-react';
import { useLive } from '../../context/LiveContext';
import { MonitoringMap, MapLegend } from '../../components/MonitoringMap';
import { MetricCard, StatusCard } from '../../components/cards';
import { FlowStrip, FusionDiagram } from '../../components/diagrams';
import { PublicAlertCard, ZoneStatusRow } from '../../components/domain';
import { Button, Card, DemoTag, SectionTitle } from '../../components/ui';
import { RISK_META } from '../../services/format';
import type { RiskLevel } from '../../services/types';

const DETAIL: Record<RiskLevel, string> = {
  NORMAL: 'No unusual ground movement has been detected in any monitored zone. Continue normal activities.',
  WARNING: 'Ground movement above normal levels has been detected in at least one zone. Stay alert and follow updates from local authorities.',
  CRITICAL: 'Significant ground movement detected. If you are near an affected zone, move away from the marked area and follow official instructions.',
  OFFLINE: 'Monitoring data is temporarily unavailable. Local alarms at the sites continue to operate.',
};

export default function HomePage() {
  const { summary, zones, alerts } = useLive();
  const navigate = useNavigate();
  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED');
  const markers = useMemo(
    () =>
      zones.map((z) => ({
        id: z.id,
        lat: z.lat,
        lng: z.lng,
        status: z.status,
        title: z.label,
        popup: (
          <div>
            <div className="font-semibold text-sm">{z.label}</div>
            <div className="text-xs opacity-70 mb-1">{z.regionName}</div>
            <div className="text-xs">{z.message}</div>
            <Link to={`/live?zone=${z.id}`} className="text-xs text-signal">
              Open in live monitoring →
            </Link>
          </div>
        ),
      })),
    [zones],
  );
  const regions = useMemo(() => {
    const map = new Map<string, { name: string; status: RiskLevel; count: number }>();
    const rank = { OFFLINE: -1, NORMAL: 0, WARNING: 1, CRITICAL: 2 } as const;
    for (const z of zones) {
      const r = map.get(z.regionId) || { name: z.regionName, status: 'NORMAL' as RiskLevel, count: 0 };
      r.count++;
      if (rank[z.status] > rank[r.status]) r.status = z.status;
      map.set(z.regionId, r);
    }
    return Array.from(map.entries());
  }, [zones]);

  return (
    <div>
      {/* HERO */}
      <section className="bd-topo bd-grid-bg border-b bd-hairline">
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-10 sm:pt-20 sm:pb-16 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-fg-3 mb-5">
              <span className="px-2 py-0.5 rounded bg-white/5 ring-1 ring-white/10 font-semibold tracking-wider">BHU-DRISHTI</span>
              AI-Powered Mine Subsidence Monitoring &amp; Early Warning System
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] text-fg">Detect ground movement before it becomes a disaster.</h1>
            <p className="text-base sm:text-lg text-fg-2 mt-5 max-w-xl">Real-time, low-cost monitoring and AI-powered risk prediction for safer mining communities.</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link to="/live">
                <Button variant="primary" size="lg">
                  View Live Monitoring <ArrowRight className="w-4 h-4" aria-hidden />
                </Button>
              </Link>
              <a href="#safety-status">
                <Button variant="secondary" size="lg">Check Safety Status</Button>
              </a>
            </div>
            <p className="text-xs text-fg-3 mt-5">Prototype platform · monitoring zones shown are simulated demo sites.</p>
          </div>
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-3">How a warning reaches you</span>
            </div>
            <FlowStrip vertical />
          </Card>
        </div>
      </section>

      {/* LIVE SAFETY STATUS */}
      <section id="safety-status" className="max-w-7xl mx-auto px-4 pt-12 scroll-mt-28" aria-labelledby="live-status-title">
        <SectionTitle eyebrow="Live" title={<span id="live-status-title">Live safety status</span>} action={<DemoTag />} />
        {summary ? (
          <StatusCard level={summary.overall} headline={summary.headline} detail={DETAIL[summary.overall]} updatedAt={summary.lastUpdate} stale={summary.stale}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricCard label="Active monitoring zones" value={summary.activeZones} icon={MapPinned} />
              <MetricCard label="Active warnings" value={summary.warningZones} tone={summary.warningZones ? 'WARNING' : 'neutral'} icon={ShieldAlert} />
              <MetricCard label="Critical zones" value={summary.criticalZones} tone={summary.criticalZones ? 'CRITICAL' : 'neutral'} icon={BellRing} />
              <MetricCard label="Online sensor nodes" value={`${summary.onlineNodes}/${summary.totalNodes}`} icon={Radio} />
              <MetricCard label="Active alerts" value={summary.activeAlerts} tone={summary.activeAlerts ? 'WARNING' : 'neutral'} icon={Signal} onClick={() => navigate('/alerts')} className="col-span-2 md:col-span-1" />
            </div>
          </StatusCard>
        ) : (
          <Card>Connecting to the monitoring network…</Card>
        )}
      </section>

      {/* ACTIVE ALERTS */}
      {activeAlerts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-10" aria-label="Active safety alerts">
          <SectionTitle eyebrow="Safety alerts" title="Current warnings" action={<Link to="/alerts" className="text-sm text-signal hover:underline">All alerts →</Link>} />
          <div className="grid gap-3 lg:grid-cols-2">
            {activeAlerts.slice(0, 2).map((a) => (
              <PublicAlertCard key={a.id} alert={a} onViewArea={() => navigate(`/live?zone=${a.zoneId}`)} />
            ))}
          </div>
        </section>
      )}

      {/* MAP + REGIONS */}
      <section className="max-w-7xl mx-auto px-4 pt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <SectionTitle eyebrow="GIS" title="Monitored mining zones" action={<MapLegend />} />
          <Card pad={false} className="overflow-hidden">
            <MonitoringMap markers={markers} height={380} onSelect={(id) => navigate(`/live?zone=${id}`)} />
          </Card>
        </div>
        <div>
          <SectionTitle eyebrow="Regions" title="Priority mining regions" action={<Link to="/regions" className="text-sm text-signal hover:underline">Details →</Link>} />
          <Card className="p-2">
            {regions.map(([id, r]) => (
              <ZoneStatusRow key={id} label={r.name} sub={`${r.count} monitoring zones`} level={r.status} to="/regions" />
            ))}
          </Card>
          <p className="text-xs text-fg-3 mt-2">Region and zone data on this page are demo/simulation data.</p>
        </div>
      </section>

      {/* SENSOR FUSION USP */}
      <section className="max-w-7xl mx-auto px-4 pt-14">
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <div>
            <SectionTitle eyebrow="Why alerts can be trusted" title="Sensor fusion reduces false alarms" />
            <Card>
              <FusionDiagram />
            </Card>
          </div>
          <div>
            <SectionTitle eyebrow="Built for real sites" title="Designed for remote, low-connectivity mining areas" />
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: Layers, t: 'Multi-sensor nodes', d: 'Tilt, vibration, displacement and crack width measured together on every node.' },
                { icon: Radio, t: 'LoRa long-range radio', d: 'Nodes talk to a shared gateway without mobile data or Wi-Fi.' },
                { icon: ShieldAlert, t: 'Local-first alarms', d: 'Gateways log data and sound local alarms even when the internet is down.' },
                { icon: Wallet, t: 'Low-cost & scalable', d: 'Target ~₹900–₹1,200 per sensor node; many nodes share one gateway.' },
              ].map((f) => (
                <Card key={f.t} className="p-4">
                  <f.icon className="w-5 h-5 text-signal mb-2" aria-hidden />
                  <div className="font-semibold text-sm">{f.t}</div>
                  <p className="text-xs text-fg-3 mt-1">{f.d}</p>
                </Card>
              ))}
            </div>
            <Link to="/how-it-works" className="inline-flex items-center gap-1 text-sm text-signal hover:underline mt-4">
              See the full system architecture <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* SAFETY CTA */}
      <section className="max-w-7xl mx-auto px-4 pt-14">
        <div className="rounded-2xl p-6 sm:p-8 ring-1 ring-risk-warning/30" style={{ background: `linear-gradient(120deg, ${RISK_META.WARNING.color}1a, transparent 60%), #121821` }}>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Know what to do during a subsidence warning</h2>
              <p className="text-sm text-fg-2 mt-1">Simple steps for people living or working near monitored zones. Always follow official instructions from local authorities.</p>
            </div>
            <Link to="/safety">
              <Button variant="warning" size="lg">Safety information</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
