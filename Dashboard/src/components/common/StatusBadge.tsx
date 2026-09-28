import React from 'react';
import { NodeStatus } from '../../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, WifiOff } from 'lucide-react';

interface StatusBadgeProps {
  status: NodeStatus | 'ONLINE' | 'DEGRADED';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'NORMAL':
      case 'ONLINE':
        return {
          label: status === 'ONLINE' ? 'ONLINE' : 'NORMAL',
          icon: ShieldCheck,
          bg: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
        };
      case 'WARNING':
      case 'DEGRADED':
        return {
          label: status === 'DEGRADED' ? 'DEGRADED' : 'WARNING',
          icon: AlertTriangle,
          bg: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
        };
      case 'CRITICAL':
        return {
          label: 'CRITICAL',
          icon: AlertOctagon,
          bg: 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
          dot: 'bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.9)]',
        };
      case 'OFFLINE':
      default:
        return {
          label: 'OFFLINE',
          icon: WifiOff,
          bg: 'bg-slate-800/80 border-slate-700/60 text-slate-400',
          dot: 'bg-slate-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5 font-semibold',
    md: 'text-xs px-3 py-1 gap-1.5 font-bold tracking-wide',
    lg: 'text-sm px-4 py-1.5 gap-2 font-bold tracking-wider',
  }[size];

  const iconSizes = {
    sm: 12,
    md: 13,
    lg: 15,
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors whitespace-nowrap ${config.bg} ${sizeClasses}`}
    >
      <span className={`h-2 w-2 rounded-full shrink-0 ${config.dot}`} />
      {showIcon && <Icon size={iconSizes} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
