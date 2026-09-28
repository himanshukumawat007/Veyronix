import React from 'react';
import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../services/api';
import { RiskBadge } from '../../components/RiskBadge';
import { ZoneStatusRow } from '../../components/domain';
import { Card, DemoTag, ErrorBanner, Loading } from '../../components/ui';
import { RISK_META } from '../../services/format';

export default function RegionsPage() {
  const { data, error, loading, refresh } = usePolling((s) => api.getPublicRegions(s), [], 4000);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3 mb-1">Regional monitoring</div>
          <h1 className="text-2xl sm:text-3xl font-bold">Monitored regions</h1>
          <p className="text-sm text-fg-2 mt-1">Priority rollout in India&apos;s major coal-mining states: Jharkhand, Chhattisgarh, Odisha and West Bengal.</p>
        </div>
        <DemoTag />
      </div>
      <ErrorBanner message={error} onRetry={refresh} />
      {loading && !data ? (
        <Loading />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data || []).map((r) => (
            <Card key={r.id} className="p-0 overflow-hidden">
              <div className="p-5 border-b bd-hairline" style={{ background: `linear-gradient(90deg, ${RISK_META[r.status].color}1c, transparent 70%)` }}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{r.name}</h2>
                  <RiskBadge level={r.status} size="md" pulse />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-fg-2">
                  <span><span className="bd-num font-semibold text-fg">{r.zoneCount}</span> monitoring zones</span>
                  <span><span className="bd-num font-semibold text-fg">{r.warningZones}</span> warning</span>
                  <span><span className="bd-num font-semibold text-fg">{r.criticalZones}</span> critical</span>
                  <span><span className="bd-num font-semibold text-fg">{r.activeAlerts}</span> active alerts</span>
                </div>
              </div>
              <div className="p-2">
                {r.zones.map((z) => (
                  <ZoneStatusRow key={z.id} label={z.label} level={z.status} to={`/live?zone=${z.id}`} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-fg-3 mt-6">
        All regions and zones shown are demo/simulation sites used to demonstrate the platform — they do not represent real deployments or official data. <Link to="/about" className="text-signal hover:underline">About the prototype</Link>
      </p>
    </div>
  );
}
