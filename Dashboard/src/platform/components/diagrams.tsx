import React, { useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BellRing,
  Brain,
  Building2,
  Cloud,
  Cpu,
  Database,
  HardHat,
  LineChart,
  Merge,
  Radio,
  Ruler,
  Server,
  ShieldCheck,
  Users,
  Waves,
} from 'lucide-react';
import { cx } from './ui';

type Icon = React.ComponentType<{ className?: string }>;

/** Compact hero flow: Sensor → LoRa → Gateway → AI → Alert */
export const FlowStrip: React.FC<{ className?: string; vertical?: boolean }> = ({ className, vertical }) => {
  const steps: Array<{ label: string; sub: string; icon: Icon }> = [
    { label: 'Sensors', sub: 'Tilt · vibration · displacement', icon: Activity },
    { label: 'LoRa', sub: 'Long-range radio', icon: Radio },
    { label: 'Gateway', sub: 'Local log + alarm', icon: Server },
    { label: 'AI', sub: 'Risk prediction', icon: Brain },
    { label: 'Alert', sub: 'Siren · SMS · dashboard', icon: BellRing },
  ];
  return (
    <div className={cx('flex flex-col items-stretch gap-2', !vertical && 'sm:flex-row sm:items-center', className)} aria-label="How data flows through BHU-DRISHTI">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className={cx('flex items-center gap-3 bd-card-2 px-3 py-2.5 min-w-0', !vertical && 'sm:flex-col sm:gap-2 sm:text-center sm:py-3 sm:flex-1')}>
            <span className="w-9 h-9 rounded-lg grid place-items-center bg-signal/12 text-signal shrink-0">
              <s.icon className="w-5 h-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-fg">{s.label}</div>
              <div className="text-[11px] text-fg-3 leading-tight">{s.sub}</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex justify-center text-fg-3 shrink-0" aria-hidden>
              <svg width="28" height="14" viewBox="0 0 28 14" className={cx('hidden', !vertical && 'sm:block')}>
                <line x1="0" y1="7" x2="22" y2="7" stroke="#4ea1ff" strokeWidth="2" className="bd-flow" />
                <path d="M20 2 L27 7 L20 12" fill="none" stroke="#4ea1ff" strokeWidth="2" />
              </svg>
              <ArrowDown className={cx('w-4 h-4', !vertical && 'sm:hidden')} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface Stage {
  id: string;
  title: string;
  icon: Icon;
  items?: string[];
  detail: string;
}

const FIELD: Stage[] = [
  { id: 'sensors', title: 'Sensors', icon: Activity, items: ['MPU6050 — tilt', 'Piezo — vibration', 'Linear potentiometer — displacement / crack'], detail: 'Surface effects of subsidence are measured together: tilt (MPU6050), vibration (piezoelectric) and displacement / crack width (linear potentiometers). The void itself cannot be sensed directly, so the system watches its surface signature.' },
  { id: 'nano', title: 'Arduino Nano', icon: Cpu, detail: 'Battery-powered node MCU samples all sensors and packs a compact reading (timestamp, ax, ay, az, pot) for radio transmission.' },
  { id: 'lora', title: 'LoRa RA-02', icon: Radio, detail: 'Long-range, low-power 433 MHz radio link from each node to a shared gateway — no mobile data or Wi-Fi needed at the node.' },
];
const LOCAL: Stage[] = [
  { id: 'gateway', title: 'Raspberry Pi Gateway', icon: Server, detail: 'Receives LoRa packets (via the Arduino Mega receiver in the prototype), validates them, computes derived features and drives the local LED + buzzer alarm.' },
  { id: 'localdb', title: 'Local Database', icon: Database, detail: 'SQLite on the gateway stores every reading first (offline-first). Nothing is lost if the internet link drops; a sync service back-fills the cloud later.' },
  { id: 'grafana', title: 'Grafana', icon: LineChart, detail: 'Internal engineering / control-room dashboard with the detailed technical panels. Kept as the technical monitoring layer alongside this platform.' },
];
const CLOUD: Stage[] = [
  { id: 'backend', title: 'Backend / Cloud', icon: Cloud, detail: 'Node.js/Express API ingests gateway data (POST /api/sensor-data), keeps the time-series and serves the public, authority and operator applications.' },
  { id: 'ai', title: 'AI Risk Prediction', icon: Brain, detail: 'Sensor fusion scores each reading; the prediction layer forecasts risk ahead of time. In this prototype the forecast is a trend-extrapolation baseline (simulated) that the LSTM model will replace.' },
  { id: 'alerts', title: 'Alert Engine', icon: BellRing, detail: 'Creates, escalates and tracks alerts (ACTIVE → ACKNOWLEDGED → RESOLVED) and delivers them to the dashboard, SMS and e-mail (simulated in the prototype).' },
];
const USERS: Stage[] = [
  { id: 'public', title: 'Public', icon: Users, detail: 'Simple safety status, map and warnings for people living near mining areas — no technical sensor data.' },
  { id: 'authority', title: 'Authority', icon: Building2, detail: 'Multi-region GIS view, risk distribution, AI prediction, alerts, incidents and reports for disaster-management authorities.' },
  { id: 'operator', title: 'Mine Operator', icon: HardHat, detail: 'Node-level telemetry, sensor and gateway health, prediction, alert acknowledgement and zone management.' },
];

const Tier: React.FC<{ title: string; tone: string; stages: Stage[]; active: string; onPick: (s: Stage) => void; note?: string }> = ({ title, tone, stages, active, onPick, note }) => (
  <div className="rounded-xl border p-3" style={{ borderColor: `${tone}55`, background: `${tone}0d` }}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: tone }}>
        {title}
      </span>
      {note && <span className="text-[10px] text-fg-3">{note}</span>}
    </div>
    <div className="grid gap-2 sm:grid-cols-3">
      {stages.map((s) => (
        <button
          key={s.id}
          onClick={() => onPick(s)}
          onMouseEnter={() => onPick(s)}
          className={cx('text-left rounded-lg px-3 py-2.5 border transition-colors', active === s.id ? 'bg-ink-600 border-white/25' : 'bg-ink-800 border-white/8 hover:border-white/20')}
          aria-pressed={active === s.id}
        >
          <div className="flex items-center gap-2">
            <s.icon className="w-4 h-4 shrink-0" aria-hidden />
            <span className="text-sm font-semibold">{s.title}</span>
          </div>
          {s.items && (
            <ul className="mt-1.5 space-y-0.5">
              {s.items.map((it) => (
                <li key={it} className="text-[11px] text-fg-3">
                  {it}
                </li>
              ))}
            </ul>
          )}
        </button>
      ))}
    </div>
  </div>
);

const Down = () => (
  <div className="flex justify-center py-1" aria-hidden>
    <svg width="14" height="26" viewBox="0 0 14 26">
      <line x1="7" y1="0" x2="7" y2="20" stroke="#4ea1ff" strokeWidth="2" className="bd-flow" />
      <path d="M2 18 L7 25 L12 18" fill="none" stroke="#4ea1ff" strokeWidth="2" />
    </svg>
  </div>
);

/** Interactive end-to-end architecture diagram. */
export const ArchitectureDiagram: React.FC = () => {
  const all = [...FIELD, ...LOCAL, ...CLOUD, ...USERS];
  const [active, setActive] = useState<Stage>(LOCAL[0]);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div>
        <Tier title="Field — sensor nodes" tone="#22c55e" stages={FIELD} active={active.id} onPick={setActive} note="battery powered" />
        <Down />
        <div className="rounded-2xl border-2 border-dashed border-risk-normal/35 p-2 relative">
          <span className="absolute -top-2.5 left-4 bg-ink-800 px-2 text-[10px] font-semibold uppercase tracking-wider text-risk-normal">Keeps working without internet</span>
          <Tier title="On-site — local processing" tone="#4ea1ff" stages={LOCAL} active={active.id} onPick={setActive} />
        </div>
        <Down />
        <Tier title="Cloud — needs internet (when available)" tone="#9085e9" stages={CLOUD} active={active.id} onPick={setActive} />
        <Down />
        <Tier title="Users" tone="#f5a524" stages={USERS} active={active.id} onPick={setActive} />
      </div>
      <aside className="bd-card-2 p-4 h-fit lg:sticky lg:top-24" aria-live="polite">
        <div className="flex items-center gap-2 mb-2">
          <active.icon className="w-5 h-5 text-signal" aria-hidden />
          <h3 className="font-semibold">{active.title}</h3>
        </div>
        <p className="text-sm text-fg-2 leading-relaxed">{active.detail}</p>
        <div className="mt-4 text-[11px] text-fg-3">
          Stage {all.findIndex((s) => s.id === active.id) + 1} of {all.length} · hover or tap any block
        </div>
      </aside>
    </div>
  );
};

/** Sensor fusion explainer — the false-alarm filter. */
export const FusionDiagram: React.FC<{ live?: { elevated: string[]; corroborated: boolean; suppressed: boolean; note: string } | null }> = ({ live }) => {
  const signals: Array<{ label: string; icon: Icon }> = [
    { label: 'Tilt', icon: Activity },
    { label: 'Vibration', icon: Waves },
    { label: 'Displacement', icon: Ruler },
    { label: 'Crack width', icon: Ruler },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {signals.map((s) => {
          const hot = live?.elevated.includes(s.label);
          return (
            <div key={s.label} className={cx('bd-card-2 px-3 py-2.5 flex items-center gap-2', hot && 'ring-1 ring-risk-warning/50')}>
              <s.icon className={cx('w-4 h-4', hot ? 'text-risk-warning' : 'text-fg-2')} aria-hidden />
              <span className="text-sm">{s.label}</span>
              {hot && <span className="ml-auto text-[10px] font-semibold text-risk-warning">ELEVATED</span>}
            </div>
          );
        })}
      </div>
      <Down />
      <div className="grid sm:grid-cols-3 gap-2 items-stretch">
        <div className="bd-card-2 px-3 py-3 flex items-center gap-2">
          <Merge className="w-5 h-5 text-signal" aria-hidden />
          <div>
            <div className="text-sm font-semibold">Sensor fusion</div>
            <div className="text-[11px] text-fg-3">Weighted score + corroboration check</div>
          </div>
        </div>
        <div className="flex items-center justify-center text-fg-3" aria-hidden>
          <ArrowRight className="w-5 h-5 hidden sm:block" />
          <ArrowDown className="w-5 h-5 sm:hidden" />
        </div>
        <div className="bd-card-2 px-3 py-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-risk-normal" aria-hidden />
          <div>
            <div className="text-sm font-semibold">Risk assessment → Alert</div>
            <div className="text-[11px] text-fg-3">Alert only if ≥ 2 signals agree</div>
          </div>
        </div>
      </div>
      <p className="text-sm text-fg-2 mt-3">
        A genuine subsidence event should produce correlated changes across multiple signals rather than relying on a single faulty sensor. When only one signal moves, BHU-DRISHTI flags the sensor for maintenance instead of raising a public alarm.
      </p>
      {live && (
        <div className={cx('mt-3 rounded-lg px-3 py-2 text-sm border', live.suppressed ? 'border-risk-warning/40 bg-risk-warning/10' : live.corroborated ? 'border-risk-critical/40 bg-risk-critical/10' : 'border-white/10 bg-white/5')}>
          <span className="font-semibold">Live: </span>
          {live.note}
        </div>
      )}
    </div>
  );
};
