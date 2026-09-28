import React from 'react';
import { BellRing, Brain, Cpu, Layers, Merge, Radio, Server, Wallet } from 'lucide-react';
import { Card, SectionTitle } from '../../components/ui';

const DIFFERENTIATORS = [
  { icon: Layers, title: 'Multi-sensor monitoring', body: 'Tilt (MPU6050), vibration (piezoelectric) and displacement / crack width (linear potentiometers) on every node — not a single signal.' },
  { icon: Merge, title: 'Sensor fusion', body: 'A real event must show up across several signals. A single faulty or drifting sensor is flagged for maintenance instead of triggering a false alarm.' },
  { icon: Radio, title: 'LoRa communication', body: 'Long-range, low-power radio from nodes to a shared gateway, suited to sites without reliable mobile coverage.' },
  { icon: Server, title: 'Local-first monitoring', body: 'The gateway stores, displays (Grafana) and alarms locally, so core monitoring continues without internet.' },
  { icon: Brain, title: 'AI-based prediction', body: 'Looks at how risk is trending to give earlier warning than a present-state threshold alone.' },
  { icon: BellRing, title: 'Dual-layer alerting', body: 'Local LED/buzzer on site, plus remote dashboard, SMS and e-mail alerts for people off site.' },
  { icon: Wallet, title: 'Low-cost, scalable nodes', body: 'Built from off-the-shelf parts; many nodes report to one shared gateway.' },
];

const HARDWARE = ['Arduino Nano (sensor node MCU)', 'MPU6050 accelerometer / gyroscope (tilt)', 'Piezoelectric sensor (vibration)', 'Linear potentiometer ×2 (displacement + crack width)', 'LoRa RA-02 radio modules', 'Raspberry Pi gateway (with Arduino Mega LoRa receiver in the prototype)', 'LED + buzzer local alarm'];
const SOFTWARE = [
  { k: 'Web platform', v: 'React 19 + Vite + Tailwind CSS, Recharts, Leaflet/OpenStreetMap (this application)' },
  { k: 'Backend / API', v: 'Node.js + Express (TypeScript) — telemetry ingestion, fusion, alert engine, role-based API' },
  { k: 'Data storage', v: 'SQLite on the gateway (offline-first); in-memory time-series on the server, with optional PostgreSQL via Drizzle ORM' },
  { k: 'Technical monitoring', v: 'Grafana dashboard (10 panels) provisioned for PostgreSQL' },
  { k: 'AI pipeline', v: 'Edge classifier (Python/scikit-learn training scripts, prototype trained on synthetic data) + fusion scoring. Risk forecasting currently uses a trend-extrapolation baseline; LSTM model is a planned integration.' },
  { k: 'Optional AI narrative', v: 'Server-side OpenAI / Gemini integration for plain-language summaries (numbers always come from the sensor pipeline)' },
];

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="max-w-3xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3 mb-1">About</div>
        <h1 className="text-2xl sm:text-4xl font-bold">About BHU-DRISHTI</h1>
        <p className="text-base text-fg-2 mt-3">
          BHU-DRISHTI (“eye on the ground”) is a low-cost, continuous monitoring and early-warning system for ground subsidence above underground coal mines in India. It is designed to complement — not replace — periodic surveys, satellite InSAR, GNSS and drone monitoring by filling the gap between them with always-on sensing and timely alerts.
        </p>
        <p className="text-sm text-fg-3 mt-3">Built by Team VEYRONIX. Current stage: working hardware prototype and platform prototype.</p>
      </div>

      <SectionTitle eyebrow="What makes it different" title="Core differentiators" className="mt-12" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DIFFERENTIATORS.map((d, i) => (
          <Card key={d.title} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bd-num text-fg-3">{String(i + 1).padStart(2, '0')}</span>
              <d.icon className="w-4 h-4 text-signal" aria-hidden />
            </div>
            <div className="font-semibold text-sm">{d.title}</div>
            <p className="text-xs text-fg-3 mt-1">{d.body}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-12">
        <div>
          <SectionTitle eyebrow="Technology" title="Hardware" />
          <Card>
            <ul className="space-y-2">
              {HARDWARE.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-fg-2">
                  <Cpu className="w-4 h-4 text-fg-3 shrink-0 mt-0.5" aria-hidden /> {h}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div>
          <SectionTitle eyebrow="Technology" title="Software" />
          <Card>
            <dl className="space-y-3">
              {SOFTWARE.map((s) => (
                <div key={s.k}>
                  <dt className="text-xs font-semibold text-fg">{s.k}</dt>
                  <dd className="text-sm text-fg-2">{s.v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>

      <SectionTitle eyebrow="Cost & scalability" title="Designed for wide-area coverage" className="mt-12" />
      <Card>
        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] items-center">
          <div>
            <div className="text-4xl font-bold bd-num">~₹900–₹1,200</div>
            <div className="text-sm text-fg-2 mt-1">prototype / target cost per sensor node, depending on configuration</div>
            <p className="text-xs text-fg-3 mt-3">
              Final deployment cost will depend on hardware choices, enclosures, installation, calibration and site requirements. The gateway is a one-time shared cost per monitoring zone. For comparison, an industrial draw-wire displacement sensor alone can cost around ₹13,000 per unit.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm" aria-label="Many nodes, one gateway, one platform">
            <div className="flex gap-2 flex-wrap justify-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="bd-card-2 px-2.5 py-1.5 text-xs bd-num">Node {i + 1}</span>
              ))}
            </div>
            <span className="text-fg-3">↓ LoRa</span>
            <span className="bd-card-2 px-4 py-2 font-semibold">One shared gateway</span>
            <span className="text-fg-3">↓</span>
            <span className="bd-card-2 px-4 py-2 font-semibold">BHU-DRISHTI monitoring platform</span>
          </div>
        </div>
      </Card>

      <Card className="mt-12 text-sm text-fg-2">
        <h2 className="font-semibold text-fg mb-2">Prototype disclaimer</h2>
        <p>
          This platform is a prototype. Monitoring zones on the map are <strong className="text-fg">simulated demo sites</strong> with approximate locations; they are not real deployments and no official government or mine data is shown. The hardware prototype rig streams real sensor data from our physical test model. AI forecasts shown in the dashboards are clearly marked as simulated until the LSTM model is connected.
        </p>
      </Card>
    </div>
  );
}
