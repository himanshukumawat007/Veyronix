import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling';
import { useRoleBase } from '../../hooks/useStaff';
import { api } from '../../services/api';
import { IncidentTimeline } from '../../components/domain';
import { RiskBadge } from '../../components/RiskBadge';
import { Card, DemoTag, Empty, ErrorBanner, Loading, Pill, SectionTitle, Segmented, cx } from '../../components/ui';
import { fmtDateTime, fmtDuration } from '../../services/format';

export default function IncidentsPage() {
  const { zoneBase } = useRoleBase();
  const q = usePolling((s) => api.getIncidents(s), [], 5000);
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'CLOSED'>('all');
  const list = useMemo(() => (q.data || []).filter((i) => filter === 'all' || i.status === filter), [q.data, filter]);
  const current = (q.data || []).find((i) => i.id === sel) || list[0];

  if (q.loading && !q.data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Records</div>
          <h1 className="text-2xl font-bold">Incident history</h1>
        </div>
        <div className="flex items-center gap-2">
          <Segmented value={filter} onChange={setFilter} ariaLabel="Incident status" options={[{ value: 'all', label: 'All' }, { value: 'OPEN', label: 'Open' }, { value: 'CLOSED', label: 'Closed' }]} />
          <DemoTag />
        </div>
      </div>
      <ErrorBanner message={q.error} onRetry={q.refresh} />
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card pad={false}>
          {list.length === 0 ? (
            <Empty title="No incidents" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-fg-3 border-b bd-hairline">
                    <th className="py-2.5 px-4">Incident ID</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Cause / trigger</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((i) => (
                    <tr key={i.id} onClick={() => setSel(i.id)} className={cx('border-b bd-hairline cursor-pointer', current?.id === i.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]')}>
                      <td className="py-2.5 px-4 bd-num font-medium">{i.id}</td>
                      <td className="py-2.5 px-3">
                        <div>{i.zoneLabel}</div>
                        <div className="text-[11px] text-fg-3">{i.regionName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs bd-num">{fmtDateTime(i.startedAt)}</td>
                      <td className="py-2.5 px-3"><RiskBadge level={i.severity} size="xs" /></td>
                      <td className="py-2.5 px-3 text-xs text-fg-2 max-w-[240px]">{i.trigger}</td>
                      <td className="py-2.5 px-3 text-xs bd-num">{fmtDuration(i.durationMin)}</td>
                      <td className="py-2.5 px-3">
                        <Pill className={i.status === 'OPEN' ? 'bg-risk-critical/12 text-risk-critical ring-1 ring-risk-critical/30' : 'bg-white/5 text-fg-2 ring-1 ring-white/10'}>{i.status}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        {current && (
          <Card className="h-fit xl:sticky xl:top-20">
            <SectionTitle eyebrow={current.id} title={current.zoneLabel} action={<Link to={`${zoneBase}/${current.zoneId}`} className="text-sm text-signal hover:underline">Zone →</Link>} />
            <div className="flex flex-wrap gap-2 mb-4">
              <RiskBadge level={current.severity} />
              <Pill className="bg-white/5 ring-1 ring-white/10 text-fg-2">{current.status}</Pill>
              {current.isDemo && <DemoTag />}
            </div>
            <p className="text-sm text-fg-2 mb-4">{current.trigger}</p>
            <IncidentTimeline incident={current} />
          </Card>
        )}
      </div>
    </div>
  );
}
