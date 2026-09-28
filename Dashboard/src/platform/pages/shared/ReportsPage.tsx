import React, { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../services/api';
import { MetricCard } from '../../components/cards';
import { RiskBadge } from '../../components/RiskBadge';
import { Button, Card, DemoTag, ErrorBanner, Loading, SectionTitle, Segmented } from '../../components/ui';
import { downloadFile, fmtDate, fmtDateTime, toCsv } from '../../services/format';

export default function ReportsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const q = usePolling((s) => api.getReport(period, s), [period], 15000);
  const r = q.data;

  const exportCsv = (kind: 'zones' | 'alerts' | 'events') => {
    if (!r) return;
    const rows =
      kind === 'zones'
        ? r.zones.map((z) => ({ zone: z.zone, region: z.region, status: z.currentStatus, avg_risk: z.avgRiskScore, max_risk: z.maxRiskScore, alerts: z.alerts, nodes_online: z.activeNodes, nodes_total: z.totalNodes }))
        : kind === 'alerts'
        ? r.alertHistory.map((a) => ({ id: a.id, zone: a.zone, severity: a.severity, detected: new Date(a.detectedAt).toISOString(), status: a.status, acknowledged_by: a.acknowledgedBy || '', resolved: a.resolvedAt ? new Date(a.resolvedAt).toISOString() : '' }))
        : r.riskEvents.map((e) => ({ id: e.id, zone: e.zone, severity: e.severity, trigger: e.trigger, started: new Date(e.startedAt).toISOString(), status: e.status }));
    const header = `# BHU-DRISHTI ${period} report (${kind}) — generated ${new Date(r.generatedAt).toISOString()} — DEMO DATA\n`;
    downloadFile(`bhu-drishti-${period}-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, header + toCsv(rows));
  };

  return (
    <div className="space-y-5 bd-print-area">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Reports</div>
          <h1 className="text-2xl font-bold">{period === 'daily' ? 'Daily' : 'Weekly'} monitoring summary</h1>
          {r && <p className="text-xs text-fg-3 mt-1">Period {fmtDateTime(r.from)} – {fmtDateTime(r.generatedAt)} · demo/simulated data</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 bd-no-print">
          <Segmented value={period} onChange={setPeriod} ariaLabel="Report period" options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]} />
          <Button size="sm" onClick={() => exportCsv('zones')} disabled={!r}><Download className="w-4 h-4" aria-hidden /> Zones CSV</Button>
          <Button size="sm" onClick={() => exportCsv('alerts')} disabled={!r}><Download className="w-4 h-4" aria-hidden /> Alerts CSV</Button>
          <Button size="sm" onClick={() => exportCsv('events')} disabled={!r}><Download className="w-4 h-4" aria-hidden /> Events CSV</Button>
          <Button size="sm" variant="primary" onClick={() => window.print()} disabled={!r}><Printer className="w-4 h-4" aria-hidden /> Print / PDF</Button>
          <DemoTag />
        </div>
      </div>
      <ErrorBanner message={q.error} onRetry={q.refresh} />
      {!r ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            <MetricCard label="Zones monitored" value={r.totals.zones} />
            <MetricCard label="Alerts" value={r.totals.alerts} tone={r.totals.alerts ? 'WARNING' : 'neutral'} />
            <MetricCard label="Critical alerts" value={r.totals.criticalAlerts} tone={r.totals.criticalAlerts ? 'CRITICAL' : 'neutral'} />
            <MetricCard label="Risk events" value={r.totals.incidents} sub={`${r.totals.openIncidents} open`} />
            <MetricCard label="Nodes online" value={`${r.totals.nodesOnline}/${r.totals.nodesTotal}`} />
            <MetricCard label="Node health issues" value={r.nodeHealth.offline + r.nodeHealth.batteryIssues + r.nodeHealth.loraIssues + r.nodeHealth.sensorWarnings} sub={`${r.nodeHealth.offline} offline · ${r.nodeHealth.batteryIssues} battery · ${r.nodeHealth.sensorWarnings} sensor`} />
          </div>

          {period === 'weekly' && r.dailyTrend.length > 0 && (
            <Card>
              <SectionTitle title="Peak daily risk score (all zones)" />
              <div style={{ height: 220 }} role="img" aria-label="Peak daily risk score bar chart">
                <ResponsiveContainer>
                  <BarChart data={r.dailyTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: '#8594a6' }} stroke="rgba(255,255,255,0.06)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8594a6' }} stroke="rgba(255,255,255,0.06)" />
                    <Tooltip contentStyle={{ background: '#0f141b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="maxScore" name="Peak risk score" fill="#3987e5" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card pad={false}>
            <div className="px-4 pt-4"><SectionTitle title="Zone summary" /></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-fg-3 border-b bd-hairline">
                    <th className="py-2 px-4">Zone</th><th className="py-2 px-3">Region</th><th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Avg risk</th><th className="py-2 px-3 text-right">Max risk</th><th className="py-2 px-3 text-right">Alerts</th><th className="py-2 px-4 text-right">Nodes</th>
                  </tr>
                </thead>
                <tbody>
                  {r.zones.map((z) => (
                    <tr key={z.zoneId} className="border-b bd-hairline">
                      <td className="py-2 px-4">{z.zone}</td><td className="py-2 px-3 text-fg-2">{z.region}</td>
                      <td className="py-2 px-3"><RiskBadge level={z.currentStatus} size="xs" /></td>
                      <td className="py-2 px-3 text-right bd-num">{z.avgRiskScore}</td><td className="py-2 px-3 text-right bd-num">{z.maxRiskScore}</td>
                      <td className="py-2 px-3 text-right bd-num">{z.alerts}</td><td className="py-2 px-4 text-right bd-num">{z.activeNodes}/{z.totalNodes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <SectionTitle title="Risk events" />
              {r.riskEvents.length === 0 ? <p className="text-sm text-fg-3">No risk events in this period.</p> : (
                <ul className="divide-y divide-white/5">
                  {r.riskEvents.map((e) => (
                    <li key={e.id} className="py-2 flex items-start gap-3 text-sm">
                      <RiskBadge level={e.severity as 'WARNING' | 'CRITICAL'} size="xs" />
                      <div className="min-w-0 flex-1"><div>{e.zone}</div><div className="text-xs text-fg-3">{e.trigger}</div></div>
                      <div className="text-xs text-fg-3 bd-num text-right">{fmtDate(e.startedAt)}<br />{e.status}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <SectionTitle title="Alert history" />
              {r.alertHistory.length === 0 ? <p className="text-sm text-fg-3">No alerts in this period.</p> : (
                <ul className="divide-y divide-white/5">
                  {r.alertHistory.map((a) => (
                    <li key={a.id} className="py-2 flex items-start gap-3 text-sm">
                      <span className="bd-num text-xs text-fg-3 w-16">#{a.id}</span>
                      <RiskBadge level={a.severity as 'WARNING' | 'CRITICAL'} size="xs" />
                      <div className="min-w-0 flex-1">{a.zone}<div className="text-xs text-fg-3">{a.acknowledgedBy ? `Ack: ${a.acknowledgedBy}` : 'Not acknowledged'}</div></div>
                      <span className="text-xs font-semibold">{a.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
