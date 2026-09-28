import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling';
import { useLive } from '../../context/LiveContext';
import { api } from '../../services/api';
import { LastUpdated } from '../../components/cards';
import { GatewayStatusPanel, NodeTable, OfflineFirstPanel } from '../../components/domain';
import { Card, DemoTag, ErrorBanner, Loading, SectionTitle } from '../../components/ui';

export default function GatewayPage() {
  const [params, setParams] = useSearchParams();
  const { summary } = useLive();
  const listQ = usePolling((s) => api.getGateways(s), [], 5000);
  const gwId = params.get('gw') || listQ.data?.[0]?.id || null;
  const gwQ = usePolling((s) => (gwId ? api.getGatewayStatus(gwId, s) : Promise.resolve(null)), [gwId], 2500, !!gwId);
  const [silencing, setSilencing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const gw = gwQ.data;
  const silence = async () => {
    if (!gwId) return;
    setSilencing(true);
    setErr(null);
    try {
      await api.silenceGateway(gwId);
      gwQ.refresh();
    } catch (e: any) {
      setErr(e?.message || 'Failed');
    } finally {
      setSilencing(false);
    }
  };
  if (listQ.loading && !listQ.data) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Mine operator</div>
          <h1 className="text-2xl font-bold">Gateway status</h1>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={gwQ.updatedAt} />
          <DemoTag />
        </div>
      </div>
      <Card className="py-3 flex flex-wrap items-center gap-2">
        <label className="text-xs text-fg-3" htmlFor="gw">Gateway</label>
        <select id="gw" value={gwId || ''} onChange={(e) => setParams({ gw: e.target.value })} className="bg-ink-800 border border-white/10 rounded-lg px-3 py-2 text-sm">
          {(listQ.data || []).map((g) => (
            <option key={g.id} value={g.id}>{g.id} — {g.zoneLabel}</option>
          ))}
        </select>
      </Card>
      <ErrorBanner message={gwQ.error || err} />
      {gw ? (
        <>
          <Card><GatewayStatusPanel gw={gw} onSilence={silence} silencing={silencing} /></Card>
          <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
            <Card>
              <SectionTitle title="Offline-first behaviour" />
              <OfflineFirstPanel internetOnline={gw.internet === 'ONLINE'} synchronizing={gw.cloudSync === 'SYNCHRONIZING'} backlog={gw.backlog} compact />
              {summary?.demo && <p className="text-[11px] text-fg-3 mt-2">Use the demo controls to cut or restore the internet link.</p>}
            </Card>
            <Card>
              <SectionTitle title="Connected nodes" />
              <NodeTable nodes={gw.nodes || []} />
            </Card>
          </div>
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
}
