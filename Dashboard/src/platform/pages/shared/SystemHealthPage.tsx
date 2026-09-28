import React from 'react';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../services/api';
import { LastUpdated } from '../../components/cards';
import { OfflineFirstPanel, ServiceStatusList } from '../../components/domain';
import { HealthBadge } from '../../components/RiskBadge';
import { Card, DemoTag, ErrorBanner, Loading, SectionTitle } from '../../components/ui';
import { timeAgo } from '../../services/format';
import { useNow } from '../../hooks/useNow';

export default function SystemHealthPage() {
  const hq = usePolling((s) => api.getSystemHealth(s), [], 5000);
  const gq = usePolling((s) => api.getGateways(s), [], 4000);
  const now = useNow(2000);
  const h = hq.data;
  if (hq.loading && !h) return <Loading />;
  const counts = { OPERATIONAL: 0, DEGRADED: 0, OFFLINE: 0 };
  h?.services.forEach((s) => counts[s.state]++);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Platform</div>
          <h1 className="text-2xl font-bold">System health</h1>
          {h && <p className="text-sm text-fg-2 mt-1">{counts.OPERATIONAL} operational · {counts.DEGRADED} degraded · {counts.OFFLINE} offline</p>}
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={hq.updatedAt} label="Checked" />
          <DemoTag />
        </div>
      </div>
      <ErrorBanner message={hq.error} onRetry={hq.refresh} />
      {h && (
        <Card>
          <SectionTitle title="Services" />
          <ServiceStatusList health={h} />
        </Card>
      )}
      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <SectionTitle title="Offline-first status" />
          <OfflineFirstPanel internetOnline={h?.demo.internetOnline ?? true} synchronizing={h?.demo.synchronizing ?? false} backlog={(gq.data || []).reduce((a, g) => a + g.backlog, 0)} compact />
        </Card>
        <Card pad={false}>
          <div className="px-4 pt-4"><SectionTitle title="Gateways" /></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-fg-3 border-b bd-hairline">
                  <th className="py-2 px-4">Gateway</th><th className="py-2 px-3">LoRa</th><th className="py-2 px-3">Internet</th><th className="py-2 px-3">Cloud sync</th><th className="py-2 px-3 text-right">Backlog</th><th className="py-2 px-4">Last sync</th>
                </tr>
              </thead>
              <tbody>
                {(gq.data || []).map((g) => (
                  <tr key={g.id} className="border-b bd-hairline">
                    <td className="py-2 px-4"><div className="bd-num">{g.id}</div><div className="text-[11px] text-fg-3">{g.zoneLabel}</div></td>
                    <td className="py-2 px-3"><HealthBadge state={g.loraStatus} /></td>
                    <td className="py-2 px-3"><HealthBadge state={g.internet} /></td>
                    <td className="py-2 px-3"><HealthBadge state={g.cloudSync} /></td>
                    <td className="py-2 px-3 text-right bd-num">{g.backlog}</td>
                    <td className="py-2 px-4 text-xs text-fg-3">{timeAgo(g.lastSync, now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
