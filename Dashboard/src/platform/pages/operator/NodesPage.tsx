import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../services/api';
import { LastUpdated } from '../../components/cards';
import { NodeTable } from '../../components/domain';
import { Card, DemoTag, Empty, ErrorBanner, Loading, Segmented } from '../../components/ui';
import type { RiskLevel } from '../../services/types';

export default function NodesPage() {
  const [params, setParams] = useSearchParams();
  const zoneFilter = params.get('zone') || 'all';
  const [status, setStatus] = useState<RiskLevel | 'ALL'>('ALL');
  const [q, setQ] = useState('');
  const nodesQ = usePolling((s) => api.getNodes(undefined, s), [], 4000);
  const zonesQ = usePolling((s) => api.getMonitoringZones(s), [], 10000);
  const list = useMemo(
    () =>
      (nodesQ.data || []).filter(
        (n) =>
          (zoneFilter === 'all' || n.zoneId === zoneFilter) &&
          (status === 'ALL' || n.status === status) &&
          (!q || `${n.id} ${n.name} ${n.zoneLabel}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [nodesQ.data, zoneFilter, status, q],
  );
  if (nodesQ.loading && !nodesQ.data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Mine operator</div>
          <h1 className="text-2xl font-bold">Sensor nodes</h1>
          <p className="text-sm text-fg-2 mt-1">{list.length} of {nodesQ.data?.length || 0} nodes</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={nodesQ.updatedAt} />
          <DemoTag />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={zoneFilter}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value === 'all') next.delete('zone');
            else next.set('zone', e.target.value);
            setParams(next, { replace: true });
          }}
          className="bg-ink-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
          aria-label="Zone filter"
        >
          <option value="all">All zones</option>
          {(zonesQ.data || []).map((z) => (
            <option key={z.id} value={z.id}>{z.label}</option>
          ))}
        </select>
        <Segmented
          ariaLabel="Status filter"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'NORMAL', label: 'Normal' },
            { value: 'WARNING', label: 'Warning' },
            { value: 'CRITICAL', label: 'Critical' },
            { value: 'OFFLINE', label: 'Offline' },
          ]}
        />
        <label className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search node ID" aria-label="Search nodes" className="bg-ink-800 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm w-48" />
        </label>
      </div>
      <ErrorBanner message={nodesQ.error} onRetry={nodesQ.refresh} />
      <Card>{list.length ? <NodeTable nodes={list} showZone /> : <Empty title="No nodes match these filters" />}</Card>
    </div>
  );
}
