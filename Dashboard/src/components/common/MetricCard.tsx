import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'normal' | 'warning' | 'critical' | 'neutral';
  badge?: React.ReactNode;
  className?: string;
  valueClassName?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  badge,
  className = '',
  valueClassName,
  onClick,
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'normal':
        return 'bg-[#121820] border-emerald-500/30 hover:border-emerald-400/50 shadow-[0_4px_24px_rgba(16,185,129,0.08)]';
      case 'warning':
        return 'bg-[#19161a] border-amber-500/35 hover:border-amber-400/60 shadow-[0_4px_24px_rgba(245,158,11,0.08)]';
      case 'critical':
        return 'bg-[#1a1218] border-rose-500/40 hover:border-rose-400/70 shadow-[0_4px_24px_rgba(244,63,94,0.12)]';
      case 'neutral':
        return 'bg-[#131722] border-zinc-800/80 hover:border-zinc-700';
      default:
        return 'bg-[#131722] border-zinc-800/90 hover:border-cyan-500/40 shadow-[0_4px_24px_rgba(0,0,0,0.35)]';
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case 'normal':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'critical':
        return 'text-rose-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between overflow-hidden ${getCardStyle()} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {/* Top micro indicator line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] opacity-80 ${
          variant === 'critical'
            ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-transparent'
            : variant === 'warning'
            ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-transparent'
            : variant === 'normal'
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent'
            : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-transparent'
        }`}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-cyan-400 shrink-0">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className={`font-bold font-mono tracking-tight ${getValueColor()} ${valueClassName || 'text-2xl sm:text-3xl'}`}>
          {value}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs font-medium text-slate-400 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
};
