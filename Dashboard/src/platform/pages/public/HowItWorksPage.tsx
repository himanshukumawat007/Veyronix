import React from 'react';
import { Activity, BellRing, Brain, Cloud, Cpu, Database, LineChart, Radio } from 'lucide-react';
import { ArchitectureDiagram, FusionDiagram } from '../../components/diagrams';
import { Card, SectionTitle } from '../../components/ui';

const STEPS = [
  { icon: Activity, title: 'Sensors continuously measure', body: 'Tilt, vibration, displacement and crack width at the ground surface above underground workings.' },
  { icon: Cpu, title: 'Arduino sensor nodes collect data', body: 'Battery-powered Arduino Nano nodes sample every sensor and package the readings.' },
  { icon: Radio, title: 'LoRa transmits to the gateway', body: 'LoRa RA-02 radios send readings over long range to a Raspberry Pi gateway — no mobile data needed.' },
  { icon: Database, title: 'Gateway stores data locally', body: 'Every reading is saved on the gateway first, so nothing is lost if the internet drops. Local LED + buzzer alarms work offline.' },
  { icon: LineChart, title: 'Grafana provides technical visualisation', body: 'Engineers use Grafana as the detailed control-room view of raw sensor channels.' },
  { icon: Cloud, title: 'Cloud / backend analyses trends', body: 'When connected, the gateway syncs to the BHU-DRISHTI backend, which fuses signals from all nodes.' },
  { icon: Brain, title: 'AI predicts risk', body: 'The prediction layer looks at how the fused risk is changing and forecasts where it is heading.' },
  { icon: BellRing, title: 'Alerts are sent', body: 'Local siren on site, plus dashboard, SMS and e-mail alerts to authorities, operators and the public portal.' },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="max-w-3xl mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3 mb-1">How it works</div>
        <h1 className="text-2xl sm:text-4xl font-bold">From ground movement to early warning</h1>
        <p className="text-base text-fg-2 mt-3">
          The void left by underground mining (the goaf) cannot be seen directly — but as it settles, the surface tilts, vibrates, shifts and cracks. BHU-DRISHTI measures those surface signs continuously and turns them into timely warnings.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-14">
        {STEPS.map((s, i) => (
          <li key={s.title} className="bd-card p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-full bg-signal/15 text-signal grid place-items-center text-xs font-bold bd-num">{i + 1}</span>
              <s.icon className="w-4 h-4 text-fg-2" aria-hidden />
            </div>
            <div className="font-semibold text-sm">{s.title}</div>
            <p className="text-xs text-fg-3 mt-1">{s.body}</p>
          </li>
        ))}
      </ol>

      <SectionTitle eyebrow="Architecture" title="System architecture" />
      <Card className="mb-14">
        <ArchitectureDiagram />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Core idea" title="Sensor fusion" />
          <Card>
            <FusionDiagram />
          </Card>
        </div>
        <div>
          <SectionTitle eyebrow="Resilience" title="Offline-first by design" />
          <Card className="space-y-3 text-sm text-fg-2">
            <p>Mining areas often have unreliable power and internet. BHU-DRISHTI is designed so the parts that protect people on site never depend on the cloud:</p>
            <ul className="space-y-2">
              <li><strong className="text-fg">Battery-powered nodes</strong> — no grid wiring at the sensor.</li>
              <li><strong className="text-fg">LoRa radio</strong> — node-to-gateway link needs no mobile network.</li>
              <li><strong className="text-fg">Local database + Grafana + LED/buzzer</strong> on the gateway keep logging, displaying and alarming offline.</li>
              <li><strong className="text-fg">Automatic back-fill</strong> — when the internet returns, buffered readings sync to the cloud and queued SMS/e-mail alerts are sent.</li>
            </ul>
            <p className="text-xs text-fg-3">Try it: open the demo controls (bottom-right) and cut the internet link.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
