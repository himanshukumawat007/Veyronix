import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { pad?: boolean }> = ({ className, pad = true, children, ...rest }) => (
  <div className={cx('bd-card', pad && 'p-4 sm:p-5', className)} {...rest}>
    {children}
  </div>
);

export const SectionTitle: React.FC<{ eyebrow?: string; title: React.ReactNode; action?: React.ReactNode; className?: string; id?: string }> = ({
  eyebrow,
  title,
  action,
  className,
  id,
}) => (
  <div className={cx('flex items-end justify-between gap-3 mb-3', className)}>
    <div className="min-w-0">
      {eyebrow && <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3 mb-1">{eyebrow}</div>}
      <h2 id={id} className="text-base sm:text-lg font-semibold text-fg leading-tight">
        {title}
      </h2>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'success';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-signal-strong hover:bg-signal text-white',
  secondary: 'bg-ink-700 hover:bg-ink-600 text-fg border border-white/10',
  ghost: 'hover:bg-white/5 text-fg-2',
  danger: 'bg-risk-critical/90 hover:bg-risk-critical text-white',
  warning: 'bg-risk-warning/90 hover:bg-risk-warning text-ink-950',
  success: 'bg-risk-normal/85 hover:bg-risk-normal text-ink-950',
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; busy?: boolean }> = ({
  variant = 'secondary',
  size = 'md',
  busy,
  className,
  children,
  disabled,
  ...rest
}) => (
  <button
    className={cx(
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
      size === 'sm' && 'text-xs px-2.5 py-1.5',
      size === 'md' && 'text-sm px-3.5 py-2',
      size === 'lg' && 'text-base px-5 py-3',
      BTN[variant],
      className,
    )}
    disabled={disabled || busy}
    {...rest}
  >
    {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
    {children}
  </button>
);

export const Pill: React.FC<{ className?: string; children: React.ReactNode; title?: string }> = ({ className, children, title }) => (
  <span title={title} className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide', className)}>
    {children}
  </span>
);

export const DemoTag: React.FC<{ className?: string; label?: string }> = ({ className, label = 'DEMO DATA' }) => (
  <Pill className={cx('bg-signal/10 text-signal ring-1 ring-signal/30', className)} title="Simulated demonstration data — not a real deployment">
    {label}
  </Pill>
);

export const ErrorBanner: React.FC<{ message: string | null; onRetry?: () => void }> = ({ message, onRetry }) =>
  message ? (
    <div role="alert" className="flex items-center gap-3 rounded-lg border border-risk-critical/30 bg-risk-critical/10 px-3 py-2 text-sm text-fg">
      <AlertTriangle className="w-4 h-4 text-risk-critical shrink-0" aria-hidden />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  ) : null;

export const Loading: React.FC<{ label?: string; className?: string }> = ({ label = 'Loading…', className }) => (
  <div className={cx('flex items-center justify-center gap-2 py-10 text-sm text-fg-3', className)}>
    <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> {label}
  </div>
);

export const Empty: React.FC<{ title: string; hint?: string; icon?: React.ReactNode }> = ({ title, hint, icon }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4 text-fg-3">
    {icon && <div className="mb-2 text-fg-3">{icon}</div>}
    <div className="text-sm font-medium text-fg-2">{title}</div>
    {hint && <div className="text-xs mt-1 max-w-sm">{hint}</div>}
  </div>
);

export const KeyValue: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-center justify-between gap-3 py-1.5 border-b bd-hairline last:border-0">
    <span className="text-xs text-fg-3">{label}</span>
    <span className={cx('text-sm text-fg text-right', mono && 'bd-num')}>{value}</span>
  </div>
);

export const Segmented = <T extends string>({
  value,
  options,
  onChange,
  size = 'sm',
  ariaLabel,
}: {
  value: T;
  options: Array<{ value: T; label: React.ReactNode }>;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}) => (
  <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-lg bg-ink-900 p-0.5 border border-white/10">
    {options.map((o) => (
      <button
        key={o.value}
        role="radio"
        aria-checked={value === o.value}
        onClick={() => onChange(o.value)}
        className={cx(
          'rounded-md font-medium transition-colors',
          size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5',
          value === o.value ? 'bg-ink-600 text-fg' : 'text-fg-3 hover:text-fg-2',
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);
