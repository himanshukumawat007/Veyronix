import React, { useMemo, useState } from 'react';
import { BellOff } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { useAlertActions, useRoleBase } from '../../hooks/useStaff';
import { api } from '../../services/api';
import { StaffAlertCard } from '../../components/domain';
import { LastUpdated } from '../../components/cards';
import { Card, DemoTag, Empty, ErrorBanner, Loading, Segmented } from '../../components/ui';
import type { AlertStatus } from '../../services/types';

export default function AlertsManagementPage() {
  const { zoneBase } = useRoleBase();
  const q = usePolling((s) => api.getAlerts(s), [], 3000);
  const actions = useAlertActions(q.refresh);
  const [status, setStatus] = useState<AlertStatus | 'OPEN' | 'ALL'>('OPEN');
  const [sev, setSev] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const list = useMemo(
    () =>
      (q.data || []).filter(
        (a) =>
          (status === 'ALL' || (status === 'OPEN' ? a.status !== 'RESOLVED' : a.status === status)) && (sev === 'ALL' || a.severity === sev),
      ),
    [q.data, status, sev],
  );
  const count = (s: AlertStatus) => (q.data || []).filter((a) => a.status === s).length;

  if (q.loading && !q.data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Alert management</div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-sm text-fg-2 mt-1">Channels: local LED/buzzer · web dashboard · SMS · e-mail. <span className="text-fg-3">* SMS/e-mail delivery is simulated in the prototype.</span></p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={q.updatedAt} />
          <DemoTag />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Segmented
          ariaLabel="Alert status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'OPEN', label: `Open (${count('ACTIVE') + count('ACKNOWLEDGED')})` },
            { value: 'ACTIVE', label: `Active (${count('ACTIVE')})` },
            { value: 'ACKNOWLEDGED', label: `Acknowledged (${count('ACKNOWLEDGED')})` },
            { value: 'RESOLVED', label: `Resolved (${count('RESOLVED')})` },
            { value: 'ALL', label: 'All' },
          ]}
        />
        <Segmented ariaLabel="Severity" value={sev} onChange={setSev} options={[{ value: 'ALL', label: 'All severities' }, { value: 'CRITICAL', label: 'Critical' }, { value: 'WARNING', label: 'Warning' }]} />
      </div>
      <ErrorBanner message={q.error || actions.error} onRetry={q.refresh} />
      {list.length === 0 ? (
        <Card>
          <Empty icon={<BellOff className="w-6 h-6" />} title="No alerts match this filter" hint="Use the demo controls (bottom-right) to run the WARNING or CRITICAL scenario." />
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {list.map((a) => (
            <StaffAlertCard key={a.id} alert={a} onAck={() => actions.ack(a.id)} onResolve={() => actions.resolve(a.id)} busy={actions.busy} viewTo={`${zoneBase}/${a.zoneId}`} />
          ))}
        </div>
      )}
    </div>
  );
}
