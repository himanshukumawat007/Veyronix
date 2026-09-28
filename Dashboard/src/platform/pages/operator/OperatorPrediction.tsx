import React from 'react';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../services/api';
import { FusionDiagram } from '../../components/diagrams';
import { PredictionPanel, ZoneSelector } from '../../components/staff';
import { Card, DemoTag, Loading, SectionTitle } from '../../components/ui';
import { useOperatorZone } from './useOperatorZone';

export default function OperatorPrediction() {
  const { zones, zone, zoneId, setZone, loading } = useOperatorZone();
  const predQ = usePolling((s) => (zoneId ? api.getRiskPrediction(zoneId, s) : Promise.resolve(null)), [zoneId], 3000, !!zoneId);
  const nodesQ = usePolling((s) => (zoneId ? api.getNodes(zoneId, s) : Promise.resolve([])), [zoneId], 3000, !!zoneId);
  if (loading || !zone) return <Loading />;
  const ranked = (nodesQ.data || []).filter((n) => n.fusion).sort((a, b) => (b.fusion!.score || 0) - (a.fusion!.score || 0));
  const live = ranked.find((n) => n.fusion?.suppressedSingleSensor) || ranked[0];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">AI-based subsidence risk prediction</div>
          <h1 className="text-2xl font-bold">Risk prediction</h1>
          <p className="text-sm text-fg-2 mt-1 max-w-3xl">The system analyses sensor trends and identifies increasing patterns that may indicate elevated subsidence risk.</p>
        </div>
        <DemoTag />
      </div>
      <Card className="py-3"><ZoneSelector zones={zones} value={zoneId} onChange={setZone} /></Card>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <SectionTitle title={zone.label} eyebrow="Prediction" />
          {predQ.data ? <PredictionPanel prediction={predQ.data} thresholds={zone.thresholds} /> : <Loading />}
        </Card>
        <Card>
          <SectionTitle title="Sensor fusion (live)" />
          <FusionDiagram live={live?.fusion ? { elevated: live.fusion.elevatedSignals, corroborated: live.fusion.corroborated, suppressed: live.fusion.suppressedSingleSensor, note: `${live.id}: ${live.fusion.note}` } : null} />
          <div className="mt-4 text-xs text-fg-3 space-y-1">
            <p><strong className="text-fg-2">How the numbers are made:</strong> each reading is scored by the fusion engine (0–100). The prediction layer extrapolates the recent trend of the zone&apos;s fused score.</p>
            <p>The production LSTM model will plug in through the same API (<code className="bd-num">AI_PREDICT_URL</code>) without UI changes.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
