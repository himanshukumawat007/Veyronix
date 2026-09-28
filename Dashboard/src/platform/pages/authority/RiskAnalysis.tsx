import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling';
import { useRoleBase } from '../../hooks/useStaff';
import { api } from '../../services/api';
import { FusionDiagram } from '../../components/diagrams';
import { PredictionPanel, RiskDistribution, SimulatedTag, TrendIcon } from '../../components/staff';
import { RiskBadge } from '../../components/RiskBadge';
import { Card, DemoTag, Loading, SectionTitle, cx } from '../../components/ui';
import type { RiskLevel } from '../../services/types';

export default function RiskAnalysis() {
  const { zoneBase } = useRoleBase();
  const predQ = usePolling((s) => api.getRiskPredictions(s), [], 4000);
  const zonesQ = usePolling((s) => api.getMonitoringZones(s), [], 4000);
  const [sel, setSel] = useState<string | null>(null);
  const zones = (zonesQ.data || []).filter((z) => z.publicVisible);
  const preds = (predQ.data || []).filter((p) => zones.some((z) => z.id === p.zoneId)).sort((a, b) => b.predictedScore - a.predictedScore);
  const current = preds.find((p) => p.zoneId === sel) || preds[0];
  const zone = zones.find((z) => z.id === current?.zoneId);
  const nodesQ = usePolling((s) => (zone ? api.getNodes(zone.id, s) : Promise.resolve([])), [zone?.id], 4000, !!zone);
  const worst = (nodesQ.data || []).filter((n) => n.fusion).sort((a, b) => (b.fusion!.score || 0) - (a.fusion!.score || 0));
  const fusionLive = worst.find((n) => n.fusion?.suppressedSingleSensor) || worst[0];
  const predictedCounts = useMemo(() => {
    const c = { NORMAL: 0, WARNING: 0, CRITICAL: 0, OFFLINE: 0 } as Record<RiskLevel, number>;
    preds.forEach((p) => c[p.predictedLevel]++);
    return c;
  }, [preds]);

  if (predQ.loading && !predQ.data) return <Loading label="Computing predictions…" />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">AI-based subsidence risk prediction</div>
          <h1 className="text-2xl font-bold">Risk analysis</h1>
          <p className="text-sm text-fg-2 mt-1 max-w-3xl">The system analyses sensor trends and identifies increasing patterns that may indicate elevated subsidence risk.</p>
        </div>
        <div className="flex items-center gap-2">
          {preds[0] && <SimulatedTag simulated={preds[0].simulated} />}
          <DemoTag />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card pad={false}>
          <div className="px-4 pt-4"><SectionTitle title="All zones — current vs predicted (60 min)" /></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-fg-3 border-b bd-hairline">
                  <th className="py-2 px-4">Zone</th>
                  <th className="py-2 px-2">Current</th>
                  <th className="py-2 px-2">Predicted</th>
                  <th className="py-2 px-2">Trend</th>
                  <th className="py-2 px-4 text-right">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {preds.map((p) => (
                  <tr key={p.zoneId} onClick={() => setSel(p.zoneId)} className={cx('border-b bd-hairline cursor-pointer', p.zoneId === current?.zoneId ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]')}>
                    <td className="py-2.5 px-4">
                      <div className="text-sm">{p.zoneLabel}</div>
                      <div className="text-[11px] text-fg-3">{p.regionName}</div>
                    </td>
                    <td className="py-2.5 px-2"><RiskBadge level={p.currentLevel} size="xs" /></td>
                    <td className="py-2.5 px-2"><RiskBadge level={p.predictedLevel} size="xs" /></td>
                    <td className="py-2.5 px-2"><TrendIcon trend={p.trend} /></td>
                    <td className="py-2.5 px-4 text-right bd-num">{p.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <div className="text-xs text-fg-3 mb-2">Predicted distribution (60 min)</div>
            <RiskDistribution counts={predictedCounts} />
          </div>
        </Card>
        <div className="space-y-4">
          {current && zone && (
            <Card>
              <SectionTitle
                eyebrow="Selected zone"
                title={zone.label}
                action={<Link to={`${zoneBase}/${zone.id}`} className="text-sm text-signal hover:underline">Investigate →</Link>}
              />
              <PredictionPanel prediction={current} thresholds={zone.thresholds} />
            </Card>
          )}
          <Card>
            <SectionTitle eyebrow="False-alarm filter" title="Sensor fusion" />
            <FusionDiagram
              live={
                fusionLive?.fusion
                  ? { elevated: fusionLive.fusion.elevatedSignals, corroborated: fusionLive.fusion.corroborated, suppressed: fusionLive.fusion.suppressedSingleSensor, note: `${fusionLive.id}: ${fusionLive.fusion.note}` }
                  : null
              }
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
