/**
 * Natural-language situation summaries.
 *
 * Numerical risk comes from the sensor-fusion + prediction pipeline, never from the language model.
 * If OPENAI_API_KEY is set on the server, OpenAI turns those numbers into a short operator-readable
 * briefing. The key is only read server-side and never sent to the browser.
 * Without a key, a deterministic template summary is returned.
 */

export interface SummaryFacts {
  zoneLabel: string;
  status: string;
  riskScore: number;
  predictedLevel: string;
  predictedScore: number;
  trend: string;
  confidence: number;
  activeNodes: number;
  totalNodes: number;
  elevatedSignals: string[];
  activeAlert: string | null;
  simulated: boolean;
}

function template(f: SummaryFacts): string {
  const signals = f.elevatedSignals.length ? f.elevatedSignals.join(', ').toLowerCase() : 'no signals';
  const lead =
    f.status === 'CRITICAL'
      ? `${f.zoneLabel} is at CRITICAL risk (score ${f.riskScore}).`
      : f.status === 'WARNING'
      ? `${f.zoneLabel} is at WARNING level (score ${f.riskScore}).`
      : f.status === 'OFFLINE'
      ? `${f.zoneLabel} is not reporting data.`
      : `${f.zoneLabel} is operating normally (score ${f.riskScore}).`;
  const sig = f.status === 'NORMAL' ? '' : ` Elevated signals: ${signals}.`;
  const nodes = ` ${f.activeNodes}/${f.totalNodes} nodes reporting.`;
  const fut = ` The trend model projects ${f.predictedLevel} (score ${f.predictedScore}) within the next hour; trend ${f.trend.toLowerCase()}, confidence ${f.confidence}%.`;
  const act =
    f.status === 'CRITICAL'
      ? ' Recommended: keep the area cordoned, dispatch a field inspection team and keep public warnings active.'
      : f.status === 'WARNING'
      ? ' Recommended: schedule a field inspection and monitor closely for escalation.'
      : ' No action required beyond routine monitoring.';
  const alert = f.activeAlert ? ` Active alert: ${f.activeAlert}.` : '';
  const demo = f.simulated ? ' (Demo/simulated data.)' : '';
  return lead + sig + nodes + fut + act + alert + demo;
}

export async function summarize(facts: SummaryFacts): Promise<{ text: string; source: string }> {
  const fallback = { text: template(facts), source: 'Template summary (OpenAI not configured)' };
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallback;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              'You write short, factual situation briefings for a mine-subsidence early-warning control room. Use only the numbers provided. Do not invent readings, casualties, or locations. 3-4 sentences, plain English. If data is marked simulated, say it is demo data.',
          },
          { role: 'user', content: JSON.stringify(facts) },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return { ...fallback, source: `Template summary (OpenAI error ${res.status})` };
    const data: any = await res.json();
    const text = String(data?.choices?.[0]?.message?.content || '').trim();
    if (!text) return fallback;
    return { text, source: `OpenAI ${process.env.OPENAI_MODEL || 'gpt-4o-mini'} (narrative only — risk numbers from fusion/prediction pipeline)` };
  } catch {
    return { ...fallback, source: 'Template summary (OpenAI unreachable)' };
  }
}
