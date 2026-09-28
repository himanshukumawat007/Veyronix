import React from 'react';
import { usePolling } from '../../hooks/usePolling';
import { useRoleBase } from '../../hooks/useStaff';
import { api } from '../../services/api';
import { ZoneStatusRow } from '../../components/domain';
import { RiskBadge } from '../../components/RiskBadge';
import { Card, DemoTag, ErrorBanner, Loading } from '../../components/ui';
import { RISK_META } from '../../services/format';

export default function AuthorityRegions() {
  const { zoneBase } = useRoleBase();
  const q = usePolling((s) => api.getRegions(s), [], 4000);
  if (q.loading && !q.data) return <Loading />;
  const regions = (q.data || []).filter((r) => r.id !== 'prototype');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Region → zones → risk → alerts</div>
          <h1 className="text-2xl font-bold">Regional monitoring</h1>
        </div>
        <DemoTag />
      </div>
      <ErrorBanner message={q.error} onRetry={q.refresh} />
      <div className="grid gap-4 lg:grid-cols-2">
        {regions.map((r) => (
          <Card key={r.id} pad={false} className="overflow-hidden">
            <div className="p-4 border-b bd-hairline" style={{ background: `linear-gradient(90deg, ${RISK_META[r.status].color}1c, transparent 70%)` }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{r.name}</h2>
                <RiskBadge level={r.status} size="md" pulse />
              </div>
              <dl className="grid grid-cols-4 gap-2 mt-3 text-center">
                {[
                  ['Zones', r.zoneCount],
                  ['Nodes online', `${r.activeNodes}/${r.nodes}`],
                  ['Active alerts', r.activeAlerts],
                  ['Max risk', r.maxRiskScore],
                ].map(([k, v]) => (
                  <div key={k as string} className="bd-card-2 py-2">
                    <dd className="bd-num text-lg font-semibold">{v}</dd>
                    <dt className="text-[10px] text-fg-3">{k}</dt>
                  </div>
                ))}
              </dl>
            </div>
            <div className="p-2">
              {r.zones.map((z) => (
                <ZoneStatusRow
                  key={z.id}
                  label={z.label}
                  sub={`${z.activeNodes}/${z.totalNodes} nodes · score ${z.riskScore}${z.activeAlert ? ` · alert #${z.activeAlert.id}` : ''}`}
                  level={z.status}
                  to={`${zoneBase}/${z.id}`}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
