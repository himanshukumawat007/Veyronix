import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, Phone } from 'lucide-react';
import { Card } from '../../components/ui';

const SECTIONS = [
  {
    icon: AlertOctagon,
    color: '#ef4444',
    title: 'If you are near the affected area',
    items: [
      'Move away from the marked zone calmly and quickly.',
      'Follow official instructions from local authorities and site staff.',
      'Do not enter restricted or cordoned-off areas.',
      'Stay away from visible cracks, depressions or unstable ground.',
      'Contact the appropriate local authority in an emergency.',
    ],
  },
  {
    icon: AlertTriangle,
    color: '#f5a524',
    title: 'During a warning (amber)',
    items: [
      'Stay alert and check this portal or local announcements for updates.',
      'Avoid unnecessary movement near the marked area, especially with heavy vehicles.',
      'Keep children and livestock away from cracks and open ground.',
      'Report new cracks in walls, floors or roads to local authorities.',
    ],
  },
  {
    icon: CheckCircle2,
    color: '#22c55e',
    title: 'Signs of ground movement to watch for',
    items: [
      'New or widening cracks in walls, floors or the ground.',
      'Doors or windows that suddenly stick or no longer close.',
      'Tilting poles, fences, trees or walls.',
      'Sinking or bulging patches of ground, or pooling water in new places.',
    ],
  },
];

export default function SafetyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3 mb-1">Public safety information</div>
      <h1 className="text-2xl sm:text-4xl font-bold">What to do during a subsidence warning</h1>
      <div className="mt-4 rounded-xl border border-signal/30 bg-signal/10 p-4 flex gap-3 text-sm">
        <Info className="w-5 h-5 text-signal shrink-0 mt-0.5" aria-hidden />
        <p className="text-fg-2">
          BHU-DRISHTI is an <strong className="text-fg">early-warning and monitoring system</strong>. It does not replace official emergency instructions. Always follow directions from your district administration, disaster-management authority, mine safety officials and local emergency services.
        </p>
      </div>
      <div className="grid gap-4 mt-6 md:grid-cols-3">
        {SECTIONS.map((s) => (
          <Card key={s.title} className="border-t-4" style={{ borderTopColor: s.color }}>
            <s.icon className="w-6 h-6 mb-2" style={{ color: s.color }} aria-hidden />
            <h2 className="font-semibold text-lg mb-3">{s.title}</h2>
            <ul className="space-y-2">
              {s.items.map((i) => (
                <li key={i} className="text-sm text-fg-2 flex gap-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <Card className="mt-6 flex flex-col sm:flex-row gap-4 sm:items-center">
        <Phone className="w-6 h-6 text-fg-2 shrink-0" aria-hidden />
        <div className="text-sm text-fg-2">
          <div className="font-semibold text-fg">In an emergency</div>
          Call the national emergency number <strong className="text-fg bd-num">112</strong>, or contact your local police, fire service or district control room.
        </div>
      </Card>
      <p className="text-xs text-fg-3 mt-6">What the colours mean: <span className="text-risk-normal font-semibold">Green — normal</span>, <span className="text-risk-warning font-semibold">Amber — warning, stay alert</span>, <span className="text-risk-critical font-semibold">Red — critical, avoid the area</span>, <span className="text-fg-2 font-semibold">Grey — no data</span>.</p>
    </div>
  );
}
