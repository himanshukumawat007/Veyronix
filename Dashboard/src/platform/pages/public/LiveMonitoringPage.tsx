import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Info, MapPin, Radio } from 'lucide-react';
import { useLive } from '../../context/LiveContext';
import { MonitoringMap, MapLegend } from '../../components/MonitoringMap';
import { LastUpdated } from '../../components/cards';
import { RiskBadge, StatusDot } from '../../components/RiskBadge';
import { Button, Card, DemoTag, Empty, SectionTitle, cx } from '../../components/ui';
import { RISK_META, fmtTime } from '../../services/format';
import type { RiskLevel } from '../../services/types';

export default function LiveMonitoringPage() {
  const { zones, summary } = useLive();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('zone');
  const region = params.get('region') || 'all';
  const status = (params.get('status') || 'all') as RiskLevel | 'all';

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null || v === 'all') next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  const regions = useMemo(() => Array.from(new Map(zones.map((z) => [z.regionId, z.regionName])).entries()), [zones]);
  const filtered = useMemo(
    () => zones.filter((z) => (region === 'all' || z.regionId === region) && (status === 'all' || z.status === status)),
    [zones, region, status],
  );
  const selected = zones.find((z) => z.id === selectedId) || null;

  const markers = useMemo(
    () => filtered.map((z) => ({ id: z.id, lat: z.lat, lng: z.lng, status: z.status, title: z.label, size: 'md' as const })),
    [filtered],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3 mb-1">Live monitoring</div>
          <h1 className="text-2xl sm:text-3xl font-bold">Monitored mining zones</h1>
          <p className="text-sm text-fg-2 mt-1">Select a zone on the map or in the list to see its current safety status.</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={summary?.lastUpdate} stale={summary?.stale} />
          <DemoTag />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Filters">
        <label className="text-xs text-fg-3" htmlFor="region-filter">Region</label>
        <select
          id="region-filter"
          value={region}
          onChange={(e) => setParam('region', e.target.value)}
          className="bg-ink-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All regions</option>
          {regions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <span className="text-xs text-fg-3 ml-2">Status</span>
        {(['all', 'NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setParam('status', s)}
            aria-pressed={status === s}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border transition-colors',
              status === s ? 'bg-ink-600 border-white/25 text-fg' : 'bg-ink-800 border-white/10 text-fg-2 hover:border-white/20',
            )}
          >
            {s !== 'all' && <StatusDot level={s} />}
            {s === 'all' ? 'All' : RISK_META[s].label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card pad={false} className="overflow-hidden">
          <MonitoringMap markers={markers} selectedId={selectedId} onSelect={(id) => setParam('zone', id)} height="min(70vh, 620px)" focusZoom={12} />
          <div className="px-4 py-2.5 border-t bd-hairline flex flex-wrap items-center gap-3">
            <MapLegend />
            <span className="text-[11px] text-fg-3 ml-auto">Map locations are approximate demo sites.</span>
          </div>
        </Card>

        <div className="space-y-4">
          {selected ? (
            <Card className="ring-1" style={{ boxShadow: `inset 0 3px 0 ${RISK_META[selected.status].color}` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-lg leading-tight">{selected.label}</h2>
                  <div className="text-xs text-fg-3 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" aria-hidden /> {selected.regionName} · {selected.description}
                  </div>
                </div>
                <button onClick={() => setParam('zone', null)} className="text-xs text-fg-3 hover:text-fg">Close</button>
              </div>
              <div className="mt-4 rounded-xl p-4" style={{ background: `${RISK_META[selected.status].color}14` }}>
                <RiskBadge level={selected.status} size="lg" />
                <div className="text-lg font-semibold mt-2">{RISK_META[selected.status].public}</div>
                <p className="text-sm text-fg-2 mt-1">{selected.message}</p>
              </div>
              {selected.currentWarning && (
                <div className="mt-3 rounded-lg border border-white/10 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">Current warning · since {fmtTime(selected.currentWarning.since)}</div>
                  <div className="text-sm font-medium mt-1">{selected.currentWarning.title}</div>
                  <p className="text-sm text-fg-2 mt-1">{selected.currentWarning.recommendation}</p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div>
                  <dt className="text-xs text-fg-3">Active sensor nodes</dt>
                  <dd className="flex items-center gap-1.5 bd-num"><Radio className="w-4 h-4 text-fg-3" aria-hidden />{selected.activeNodes}</dd>
                </div>
                <div>
                  <dt className="text-xs text-fg-3">Last update</dt>
                  <dd><LastUpdated at={selected.lastUpdate} stale={selected.stale} label="" /></dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 mt-4">
                {selected.currentWarning && (
                  <Link to="/alerts">
                    <Button size="sm" variant="secondary">View alert</Button>
                  </Link>
                )}
                <Link to="/safety">
                  <Button size="sm" variant="ghost">Safety information</Button>
                </Link>
              </div>
              {selected.isDemo && <p className="text-[11px] text-fg-3 mt-3 flex items-center gap-1"><Info className="w-3.5 h-3.5" aria-hidden /> Demo site — simulated data.</p>}
            </Card>
          ) : (
            <Card className="text-sm text-fg-2">Select a zone marker to see its safety status.</Card>
          )}

          <Card pad={false}>
            <div className="px-4 pt-4">
              <SectionTitle title={`Zones (${filtered.length})`} />
            </div>
            {filtered.length === 0 ? (
              <Empty title="No zones match these filters" />
            ) : (
              <ul className="max-h-[420px] overflow-y-auto px-2 pb-2">
                {filtered.map((z) => (
                  <li key={z.id}>
                    <button
                      onClick={() => setParam('zone', z.id)}
                      className={cx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left', z.id === selectedId ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]')}
                      aria-current={z.id === selectedId}
                    >
                      <StatusDot level={z.status} ping />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm truncate">{z.label}</span>
                        <span className="block text-xs text-fg-3">{z.regionName}</span>
                      </span>
                      <RiskBadge level={z.status} size="xs" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
