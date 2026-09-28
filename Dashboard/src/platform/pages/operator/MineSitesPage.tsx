import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../services/api';
import { RiskBadge } from '../../components/RiskBadge';
import { Button, Card, DemoTag, ErrorBanner, Loading, SectionTitle } from '../../components/ui';
import type { ZoneView } from '../../services/types';

const ZoneManager: React.FC<{ zone: ZoneView; onSaved: () => void }> = ({ zone, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [warn, setWarn] = useState(zone.thresholds.warningScore);
  const [crit, setCrit] = useState(zone.thresholds.criticalScore);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const save = async (patch: Parameters<typeof api.updateZone>[1], key: string) => {
    setBusy(key);
    setErr(null);
    try {
      await api.updateZone(zone.id, patch);
      onSaved();
      if (key === 'thr') setOpen(false);
    } catch (e: any) {
      setErr(e?.message || 'Update failed');
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="bd-card-2 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <Link to={`/operator/dashboard?zone=${zone.id}`} className="text-sm font-medium hover:underline">{zone.name}</Link>
          <div className="text-xs text-fg-3">{zone.description} · {zone.activeNodes}/{zone.totalNodes} nodes · gateway {zone.gatewayId}</div>
        </div>
        <RiskBadge level={zone.status} size="xs" />
        <span className="bd-num text-xs text-fg-3">score {zone.riskScore}</span>
        <Button size="sm" variant={zone.monitoringEnabled ? 'secondary' : 'warning'} onClick={() => save({ monitoringEnabled: !zone.monitoringEnabled }, 'mon')} busy={busy === 'mon'}>
          {zone.monitoringEnabled ? 'Pause monitoring' : 'Resume monitoring'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <Settings2 className="w-4 h-4" aria-hidden /> Thresholds
        </Button>
      </div>
      {!zone.monitoringEnabled && <p className="text-xs text-risk-warning mt-2">Monitoring paused — alerts suppressed and the public portal shows this zone as unavailable.</p>}
      {open && (
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t bd-hairline pt-3">
          <label className="text-xs text-fg-3">
            Warning score
            <input type="number" min={10} max={60} value={warn} onChange={(e) => setWarn(Number(e.target.value))} className="block mt-1 w-24 bg-ink-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm bd-num" />
          </label>
          <label className="text-xs text-fg-3">
            Critical score
            <input type="number" min={40} max={95} value={crit} onChange={(e) => setCrit(Number(e.target.value))} className="block mt-1 w-24 bg-ink-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm bd-num" />
          </label>
          <Button size="sm" variant="primary" onClick={() => save({ warningScore: warn, criticalScore: crit }, 'thr')} busy={busy === 'thr'}>Save</Button>
          <span className="text-[11px] text-fg-3">Fused score bands used for this zone&apos;s status and alerts.</span>
        </div>
      )}
      {err && <p className="text-xs text-risk-critical mt-2">{err}</p>}
    </div>
  );
};

export default function MineSitesPage() {
  const q = usePolling((s) => api.getMonitoringZones(s), [], 4000);
  const sites = useMemo(() => {
    const m = new Map<string, ZoneView[]>();
    for (const z of q.data || []) m.set(z.siteName, [...(m.get(z.siteName) || []), z]);
    return Array.from(m.entries());
  }, [q.data]);
  if (q.loading && !q.data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Mine operator</div>
          <h1 className="text-2xl font-bold">Mine sites &amp; monitoring zones</h1>
          <p className="text-sm text-fg-2 mt-1">Manage monitoring zones: pause/resume monitoring and tune alert thresholds.</p>
        </div>
        <DemoTag />
      </div>
      <ErrorBanner message={q.error} onRetry={q.refresh} />
      <div className="grid gap-4 xl:grid-cols-2">
        {sites.map(([site, zones]) => (
          <Card key={site}>
            <SectionTitle title={site} eyebrow={`${zones[0].regionName}${zones[0].dataSource === 'LIVE' ? ' · live hardware' : ' · demo site'}`} />
            <div className="space-y-2">
              {zones.map((z) => (
                <ZoneManager key={z.id} zone={z} onSaved={q.refresh} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
