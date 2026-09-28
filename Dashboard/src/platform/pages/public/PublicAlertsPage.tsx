import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff } from 'lucide-react';
import { useLive } from '../../context/LiveContext';
import { PublicAlertCard } from '../../components/domain';
import { LastUpdated } from '../../components/cards';
import { Card, DemoTag, Empty, Segmented } from '../../components/ui';

export default function PublicAlertsPage() {
  const { alerts, summary } = useLive();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const list = useMemo(() => (filter === 'active' ? alerts.filter((a) => a.status !== 'RESOLVED') : alerts), [alerts, filter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3 mb-1">Public alert centre</div>
          <h1 className="text-2xl sm:text-3xl font-bold">Safety alerts</h1>
          <p className="text-sm text-fg-2 mt-1">Warnings issued by the BHU-DRISHTI monitoring network. Always follow instructions from local authorities.</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={summary?.lastUpdate} stale={summary?.stale} />
          <DemoTag />
        </div>
      </div>
      <div className="mb-4">
        <Segmented
          ariaLabel="Alert filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'active', label: `Active (${alerts.filter((a) => a.status !== 'RESOLVED').length})` },
            { value: 'all', label: 'Last 24 hours' },
          ]}
        />
      </div>
      {list.length === 0 ? (
        <Card>
          <Empty icon={<BellOff className="w-6 h-6" />} title="No active safety alerts" hint="All monitored zones are currently within normal limits. This page updates automatically." />
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <PublicAlertCard key={a.id} alert={a} onViewArea={() => navigate(`/live?zone=${a.zoneId}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
