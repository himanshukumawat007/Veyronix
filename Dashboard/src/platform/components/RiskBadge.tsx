import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, WifiOff } from 'lucide-react';
import { RISK_META } from '../services/format';
import type { RiskLevel } from '../services/types';
import { cx } from './ui';

const ICON: Record<RiskLevel, React.ComponentType<{ className?: string }>> = {
  NORMAL: CheckCircle2,
  WARNING: AlertTriangle,
  CRITICAL: AlertOctagon,
  OFFLINE: WifiOff,
};

/** Risk level badge — always icon + text + colour, never colour alone. */
export const RiskBadge: React.FC<{ level: RiskLevel; size?: 'xs' | 'sm' | 'md' | 'lg'; label?: string; className?: string; pulse?: boolean }> = ({
  level,
  size = 'sm',
  label,
  className,
  pulse,
}) => {
  const m = RISK_META[level];
  const Icon = ICON[level];
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-md font-semibold uppercase tracking-wide ring-1',
        m.bg,
        m.text,
        m.ring,
        size === 'xs' && 'text-[10px] px-1.5 py-0.5',
        size === 'sm' && 'text-[11px] px-2 py-0.5',
        size === 'md' && 'text-xs px-2.5 py-1',
        size === 'lg' && 'text-sm px-3 py-1.5',
        className,
      )}
    >
      <Icon className={cx(size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5', pulse && level === 'CRITICAL' && 'bd-pulse')} aria-hidden />
      {label || m.label}
    </span>
  );
};

export const StatusDot: React.FC<{ level: RiskLevel; className?: string; ping?: boolean }> = ({ level, className, ping }) => (
  <span className={cx('relative inline-flex w-2.5 h-2.5', className)} aria-hidden>
    {ping && level !== 'NORMAL' && level !== 'OFFLINE' && <span className={cx('absolute inset-0 rounded-full bd-ping', RISK_META[level].dot)} />}
    <span className={cx('relative inline-flex w-2.5 h-2.5 rounded-full', RISK_META[level].dot)} />
  </span>
);

export const HealthBadge: React.FC<{ state: string; className?: string }> = ({ state, className }) => {
  const map: Record<string, string> = {
    HEALTHY: 'bg-risk-normal/12 text-risk-normal ring-risk-normal/30',
    OPERATIONAL: 'bg-risk-normal/12 text-risk-normal ring-risk-normal/30',
    ONLINE: 'bg-risk-normal/12 text-risk-normal ring-risk-normal/30',
    SYNCED: 'bg-risk-normal/12 text-risk-normal ring-risk-normal/30',
    SENT: 'bg-risk-normal/12 text-risk-normal ring-risk-normal/30',
    WARNING: 'bg-risk-warning/12 text-risk-warning ring-risk-warning/30',
    DEGRADED: 'bg-risk-warning/12 text-risk-warning ring-risk-warning/30',
    SYNCHRONIZING: 'bg-signal/12 text-signal ring-signal/30',
    QUEUED: 'bg-risk-warning/12 text-risk-warning ring-risk-warning/30',
    PAUSED: 'bg-risk-warning/12 text-risk-warning ring-risk-warning/30',
    FAULT: 'bg-risk-critical/12 text-risk-critical ring-risk-critical/30',
    OFFLINE: 'bg-risk-critical/12 text-risk-critical ring-risk-critical/30',
    NOT_FITTED: 'bg-risk-offline/15 text-fg-3 ring-white/10',
    NOT_CONFIGURED: 'bg-risk-offline/15 text-fg-3 ring-white/10',
  };
  const label = state.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  return <span className={cx('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1', map[state] || map.NOT_FITTED, className)}>{label}</span>;
};
