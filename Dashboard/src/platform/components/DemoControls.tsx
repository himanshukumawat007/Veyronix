import React, { useState } from 'react';
import { FlaskConical, RotateCcw, Wifi, WifiOff, X } from 'lucide-react';
import { useLive } from '../context/LiveContext';
import type { Scenario } from '../services/types';
import { Button, cx } from './ui';

const SCENARIOS: Array<{ value: Scenario; label: string; hint: string; tone: string }> = [
  { value: 'NORMAL', label: 'Normal', hint: 'All zones green', tone: 'bg-risk-normal' },
  { value: 'WARNING', label: 'Warning', hint: 'Korba Zone B turns amber', tone: 'bg-risk-warning' },
  { value: 'CRITICAL', label: 'Critical', hint: 'Raniganj Zone B escalates to red', tone: 'bg-risk-critical' },
  { value: 'SENSOR_FAULT', label: 'Sensor fault', hint: 'One drifting sensor — fusion suppresses false alarm', tone: 'bg-signal' },
];

/**
 * Presentation demo controller. Clearly labelled; drives the server-side simulation so every open
 * screen (public, authority, operator) changes consistently.
 */
export const DemoControls: React.FC = () => {
  const { summary, setScenario, setInternet, resetDemo, meta } = useLive();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const demo = summary?.demo;
  if (meta && !meta.demoControlsPublic) return null;

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setErr(null);
    try {
      await fn();
    } catch (e: any) {
      setErr(e?.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1200] bd-no-print">
      {open ? (
        <div className="bd-card w-[300px] max-w-[calc(100vw-2rem)] p-4 shadow-2xl shadow-black/60" role="dialog" aria-label="Demo scenario controls">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-4 h-4 text-signal" aria-hidden />
            <span className="text-sm font-semibold">Demo mode</span>
            <span className="text-[10px] font-semibold text-signal bg-signal/10 ring-1 ring-signal/30 rounded px-1.5 py-0.5">SIMULATION</span>
            <button className="ml-auto p-1 rounded hover:bg-white/5" onClick={() => setOpen(false)} aria-label="Close demo controls">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-fg-3 mb-3">Drives the simulated demo zones on every screen. Not real deployment data.</p>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-3 mb-1.5">Scenario</div>
          <div className="grid gap-1.5">
            {SCENARIOS.map((s) => (
              <button
                key={s.value}
                onClick={() => run(s.value, () => setScenario(s.value))}
                className={cx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-left border transition-colors',
                  demo?.scenario === s.value ? 'border-white/30 bg-ink-600' : 'border-white/8 bg-ink-750 hover:border-white/20',
                )}
                aria-pressed={demo?.scenario === s.value}
                disabled={!!busy}
              >
                <span className={cx('w-2.5 h-2.5 rounded-full', s.tone)} aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{s.label}</span>
                  <span className="block text-[11px] text-fg-3">{s.hint}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-3 mt-3 mb-1.5">Connectivity (offline-first)</div>
          <Button
            className="w-full"
            variant={demo?.internetOnline ? 'secondary' : 'danger'}
            onClick={() => run('net', () => setInternet(!demo?.internetOnline))}
            busy={busy === 'net'}
          >
            {demo?.internetOnline ? <Wifi className="w-4 h-4" aria-hidden /> : <WifiOff className="w-4 h-4" aria-hidden />}
            {demo?.internetOnline ? 'Internet online — cut link' : 'Internet offline — restore'}
          </Button>
          <Button className="w-full mt-2" variant="ghost" onClick={() => run('reset', resetDemo)} busy={busy === 'reset'}>
            <RotateCcw className="w-4 h-4" aria-hidden /> Reset demo
          </Button>
          {err && <p className="text-xs text-risk-critical mt-2">{err}</p>}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-ink-750 border border-white/15 px-4 py-2.5 text-sm font-medium shadow-xl shadow-black/50 hover:border-white/30"
          aria-label="Open demo scenario controls"
        >
          <FlaskConical className="w-4 h-4 text-signal" aria-hidden />
          Demo: <span className="font-semibold">{demo ? SCENARIOS.find((s) => s.value === demo.scenario)?.label : '…'}</span>
          {demo && !demo.internetOnline && <WifiOff className="w-4 h-4 text-risk-critical" aria-label="Internet offline" />}
        </button>
      )}
    </div>
  );
};
