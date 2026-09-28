import React, { useState } from 'react';
import { BarChart3, Download, ExternalLink, Info } from 'lucide-react';
import { useLive } from '../../context/LiveContext';
import { Button, Card, SectionTitle } from '../../components/ui';

const PANELS = [
  'Ax / Ay / Az telemetry (MPU6050)',
  'Potentiometer displacement',
  'Acceleration magnitude',
  'Acceleration deviation',
  'Current risk score (gauge)',
  'Risk status (Normal / Warning / Critical)',
  'Node activity & online sensors',
  'Data ingestion rate',
  'Historical risk trend',
  'End-to-end system health',
];

/**
 * Grafana stays the internal technical / control-room dashboard. This page links to it, offers an
 * optional embed, and provides the provisioned dashboard JSON — it does not replace Grafana.
 */
export default function GrafanaPage() {
  const { meta } = useLive();
  const [embed, setEmbed] = useState(false);
  const url = meta?.grafana.dashboardUrl || 'http://localhost:3001/d/bhu-drishti-telemetry';
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">Engineering control room</div>
        <h1 className="text-2xl font-bold">Grafana technical monitoring</h1>
        <p className="text-sm text-fg-2 mt-1 max-w-3xl">
          Grafana remains BHU-DRISHTI&apos;s internal technical monitoring dashboard (runs locally on the gateway / control room). This platform is the user-facing layer; open Grafana for raw-channel engineering analysis.
        </p>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button variant="primary"><ExternalLink className="w-4 h-4" aria-hidden /> Open Grafana dashboard</Button>
          </a>
          <a href="/api/grafana/dashboard-json" download>
            <Button><Download className="w-4 h-4" aria-hidden /> Download dashboard JSON</Button>
          </a>
          <Button variant="ghost" onClick={() => setEmbed((v) => !v)} aria-expanded={embed}>
            <BarChart3 className="w-4 h-4" aria-hidden /> {embed ? 'Hide embedded view' : 'Embed here'}
          </Button>
          <span className="text-xs text-fg-3 bd-num ml-auto break-all">{url}</span>
        </div>
        {embed && (
          <div className="mt-4">
            <iframe title="Grafana dashboard" src={`${url}?orgId=1&kiosk=tv&theme=dark`} className="w-full rounded-lg border border-white/10 bg-ink-950" style={{ height: '70vh' }} />
            <p className="text-xs text-fg-3 mt-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" aria-hidden /> If the frame is blank, Grafana is not running or blocks embedding. Start it with <code className="bd-num">docker compose up grafana</code> and set <code className="bd-num">GF_SECURITY_ALLOW_EMBEDDING=true</code>.
            </p>
          </div>
        )}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Provisioned panels (10)" />
          <ol className="space-y-1.5 text-sm text-fg-2 list-decimal list-inside">
            {PANELS.map((p) => <li key={p}>{p}</li>)}
          </ol>
        </Card>
        <Card>
          <SectionTitle title="Setup" />
          <ol className="space-y-2 text-sm text-fg-2 list-decimal list-inside">
            <li><code className="bd-num">docker compose up -d postgres grafana</code> — Grafana on port 3001 with the PostgreSQL datasource and dashboard auto-provisioned (<code className="bd-num">grafana/provisioning</code>).</li>
            <li>Set <code className="bd-num">SQL_HOST</code> etc. so the API writes telemetry to PostgreSQL for Grafana to query.</li>
            <li>Set <code className="bd-num">GRAFANA_URL</code> (server) and optionally <code className="bd-num">GRAFANA_PUBLIC_URL</code> (browser-facing link).</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
