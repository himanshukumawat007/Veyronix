import React from 'react';
import { Clock, Radio } from 'lucide-react';
import { useNow } from '../hooks/useNow';
import { RISK_META, timeAgo } from '../services/format';
import type { RiskLevel } from '../services/types';
import { RiskBadge } from './RiskBadge';
import { cx } from './ui';

export const LastUpdated: React.FC<{ at: number | null | undefined; stale?: boolean; label?: string; className?: string }> = ({ at, stale, label = 'Updated', className }) => {
  const now = useNow(1000);
  const old = at ? now - at > 30000 : true;
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs', stale || old ? 'text-risk-warning' : 'text-fg-3', className)} aria-live="off">
      <Clock className="w-3.5 h-3.5" aria-hidden />
      {label} {timeAgo(at, now)}
      {stale && <span className="font-medium">· data delayed</span>}
    </span>
  );
};

export const MetricCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: RiskLevel | 'neutral' | 'signal';
  onClick?: () => void;
  className?: string;
}> = ({ label, value, sub, icon: Icon, tone = 'neutral', onClick, className }) => {
  const toneText =
    tone === 'neutral' ? 'text-fg' : tone === 'signal' ? 'text-signal' : RISK_META[tone].text;
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cx(
        'bd-card p-4 text-left flex flex-col gap-2 min-w-0',
        onClick && 'hover:border-white/20 transition-colors cursor-pointer',
        tone !== 'neutral' && tone !== 'signal' && tone !== 'NORMAL' && tone !== 'OFFLINE' && 'ring-1 ' + RISK_META[tone].ring,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-fg-3 leading-tight">{label}</span>
        {Icon && <Icon className={cx('w-4 h-4 shrink-0', toneText)} aria-hidden />}
      </div>
      <div className={cx('text-2xl sm:text-[28px] font-semibold leading-none bd-num', toneText)}>{value}</div>
      {sub && <div className="text-xs text-fg-3 leading-snug">{sub}</div>}
    </Comp>
  );
};

/** Big, citizen-readable safety status panel. */
export const StatusCard: React.FC<{ level: RiskLevel; headline: string; detail?: string; updatedAt?: number | null; stale?: boolean; children?: React.ReactNode }> = ({
  level,
  headline,
  detail,
  updatedAt,
  stale,
  children,
}) => {
  const m = RISK_META[level];
  return (
    <div
      className={cx('rounded-2xl p-5 sm:p-7 ring-1 relative overflow-hidden', m.ring)}
      style={{ background: `linear-gradient(135deg, ${m.color}22, ${m.color}08 55%, transparent), #121821` }}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full grid place-items-center" style={{ background: `${m.color}1f` }}>
          {level === 'CRITICAL' || level === 'WARNING' ? <span className="absolute inset-0 rounded-full bd-ping" style={{ background: `${m.color}33` }} /> : null}
          <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" style={{ background: m.color, boxShadow: `0 0 24px ${m.color}88` }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <RiskBadge level={level} size="md" label={`Overall: ${m.label}`} />
            <span className="inline-flex items-center gap-1 text-xs text-fg-3">
              <Radio className="w-3.5 h-3.5" aria-hidden /> Live safety status
            </span>
          </div>
          <div className="text-xl sm:text-3xl font-bold tracking-tight text-fg uppercase">{headline}</div>
          {detail && <p className="text-sm text-fg-2 mt-1.5 max-w-2xl">{detail}</p>}
          {updatedAt !== undefined && <LastUpdated at={updatedAt} stale={stale} className="mt-2" label="Last data update" />}
        </div>
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
};
