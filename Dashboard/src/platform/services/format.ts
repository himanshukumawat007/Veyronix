import type { RiskLevel } from './types';

export const RISK_META: Record<RiskLevel, { label: string; color: string; text: string; bg: string; ring: string; dot: string; public: string }> = {
  NORMAL: { label: 'Normal', color: '#22c55e', text: 'text-risk-normal', bg: 'bg-risk-normal/12', ring: 'ring-risk-normal/40', dot: 'bg-risk-normal', public: 'Safe — normal conditions' },
  WARNING: { label: 'Warning', color: '#f5a524', text: 'text-risk-warning', bg: 'bg-risk-warning/12', ring: 'ring-risk-warning/40', dot: 'bg-risk-warning', public: 'Caution — stay alert' },
  CRITICAL: { label: 'Critical', color: '#ef4444', text: 'text-risk-critical', bg: 'bg-risk-critical/12', ring: 'ring-risk-critical/45', dot: 'bg-risk-critical', public: 'Danger — avoid the area' },
  OFFLINE: { label: 'Offline', color: '#6b7280', text: 'text-risk-offline', bg: 'bg-risk-offline/15', ring: 'ring-risk-offline/40', dot: 'bg-risk-offline', public: 'No data — monitoring unavailable' },
};

export function timeAgo(t: number | null | undefined, now = Date.now()): string {
  if (!t) return '—';
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s} s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

export const fmtTime = (t: number | null | undefined) =>
  t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtTimeSec = (t: number | null | undefined) =>
  t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
export const fmtDateTime = (t: number | null | undefined) =>
  t ? new Date(t).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtDate = (t: number | null | undefined) =>
  t ? new Date(t).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function fmtDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function fmtUptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  return d ? `${d} d ${h} h` : `${h} h ${Math.floor((sec % 3600) / 60)} min`;
}

export function vibrationLabel(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  if (v >= 1.0) return 'High';
  if (v >= 0.3) return 'Elevated';
  return 'Normal';
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
}

export function downloadFile(name: string, content: string, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
