import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Building2, HardHat, Menu, ShieldAlert, WifiOff, X } from 'lucide-react';
import { useLive } from '../context/LiveContext';
import { DemoControls } from '../components/DemoControls';
import { RiskBadge } from '../components/RiskBadge';
import { LastUpdated } from '../components/cards';
import { DemoTag, cx } from '../components/ui';
import { usePlatformAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/live', label: 'Live Monitoring' },
  { to: '/alerts', label: 'Safety Alerts' },
  { to: '/regions', label: 'Regions' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/safety', label: 'Safety' },
  { to: '/about', label: 'About' },
];

export const Logo: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="BHU-DRISHTI home">
    <span className="relative w-9 h-9 rounded-lg bg-ink-750 border border-white/10 grid place-items-center overflow-hidden">
      <svg viewBox="0 0 36 36" className="w-7 h-7" aria-hidden>
        <path d="M3 25 C9 25 11 21 18 21 C25 21 27 25 33 25" fill="none" stroke="#8594a6" strokeWidth="2" />
        <path d="M3 30 C9 30 12 27.5 18 27.5 C24 27.5 27 30 33 30" fill="none" stroke="#3d4b5e" strokeWidth="2" />
        <circle cx="18" cy="13" r="6.5" fill="none" stroke="#4ea1ff" strokeWidth="2" />
        <circle cx="18" cy="13" r="2.4" fill="#4ea1ff" />
      </svg>
    </span>
    {!compact && (
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-wide text-fg">BHU-DRISHTI</span>
        <span className="block text-[10px] text-fg-3 tracking-wide">Mine Subsidence Early Warning</span>
      </span>
    )}
  </Link>
);

export const PublicLayout: React.FC = () => {
  const { summary, updatedAt } = useLive();
  const { user } = usePlatformAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);

  const dashboardLink = user ? (user.role === 'AUTHORITY' ? '/authority/dashboard' : '/operator/dashboard') : null;

  return (
    <div className="bd-root flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[2000] focus:m-2 focus:px-3 focus:py-2 focus:bg-ink-700 focus:rounded">
        Skip to content
      </a>
      <header className="sticky top-0 z-[1100] bg-ink-900/90 backdrop-blur border-b bd-hairline">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Logo />
          <nav className="hidden xl:flex items-center gap-1 ml-4" aria-label="Main">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => cx('px-3 py-2 rounded-md text-sm transition-colors', isActive ? 'text-fg bg-white/[0.06]' : 'text-fg-2 hover:text-fg')}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden md:flex items-center gap-2">
            {dashboardLink ? (
              <Link to={dashboardLink} className="px-3 py-2 rounded-lg text-sm bg-signal-strong hover:bg-signal text-white font-medium">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/login?role=authority" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-white/10 hover:border-white/25 text-fg-2 hover:text-fg">
                  <Building2 className="w-4 h-4" aria-hidden /> Authority Login
                </Link>
                <Link to="/login?role=operator" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-white/10 hover:border-white/25 text-fg-2 hover:text-fg">
                  <HardHat className="w-4 h-4" aria-hidden /> Mine Operator Login
                </Link>
              </>
            )}
          </div>
          <button className="xl:hidden ml-auto md:ml-0 p-2 rounded-lg hover:bg-white/5" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {open && (
          <nav className="xl:hidden border-t bd-hairline px-4 py-3 grid gap-1 bg-ink-900" aria-label="Mobile">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('px-3 py-2.5 rounded-md text-sm', isActive ? 'bg-white/[0.06] text-fg' : 'text-fg-2')}>
                {n.label}
              </NavLink>
            ))}
            <div className="grid grid-cols-2 gap-2 mt-2 md:hidden">
              <Link to="/login?role=authority" className="text-center px-3 py-2.5 rounded-lg text-sm border border-white/10">Authority Login</Link>
              <Link to="/login?role=operator" className="text-center px-3 py-2.5 rounded-lg text-sm border border-white/10">Operator Login</Link>
            </div>
          </nav>
        )}
        {/* Live status strip */}
        <div className={cx('border-t bd-hairline', summary?.overall === 'CRITICAL' ? 'bg-risk-critical/15' : summary?.overall === 'WARNING' ? 'bg-risk-warning/10' : 'bg-ink-850')}>
          <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {summary ? <RiskBadge level={summary.overall} size="xs" pulse /> : <span className="text-fg-3">Connecting…</span>}
            <span className="text-fg-2 font-medium">{summary?.headline}</span>
            {summary && summary.activeAlerts > 0 && (
              <Link to="/alerts" className="inline-flex items-center gap-1 text-risk-warning hover:underline">
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden /> {summary.activeAlerts} active alert{summary.activeAlerts > 1 ? 's' : ''}
              </Link>
            )}
            {summary?.demo && !summary.demo.internetOnline && (
              <span className="inline-flex items-center gap-1 text-risk-warning">
                <WifiOff className="w-3.5 h-3.5" aria-hidden /> Cloud link down — local alarms still active
              </span>
            )}
            <span className="ml-auto flex items-center gap-2">
              <LastUpdated at={summary?.lastUpdate ?? updatedAt} stale={summary?.stale} />
              <DemoTag />
            </span>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bd-hairline mt-16 bd-no-print">
        <div className="max-w-7xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-3 text-sm">
          <div>
            <Logo />
            <p className="text-xs text-fg-3 mt-3 max-w-xs">AI-powered, low-cost mine subsidence monitoring and early warning. Built by Team VEYRONIX.</p>
          </div>
          <div className="text-xs text-fg-3 space-y-1.5">
            <div className="font-semibold text-fg-2 text-sm mb-2">Important</div>
            <p>BHU-DRISHTI is an early-warning and monitoring aid. It does not replace official emergency instructions — always follow your local authorities.</p>
            <p>This is a <strong className="text-fg-2">prototype</strong>. Zones marked “Demo data” are simulated for demonstration and do not represent real mines or government data.</p>
          </div>
          <div className="text-xs text-fg-3 space-y-1.5">
            <div className="font-semibold text-fg-2 text-sm mb-2">Explore</div>
            <Link to="/how-it-works" className="block hover:text-fg">How it works</Link>
            <Link to="/safety" className="block hover:text-fg">What to do during a warning</Link>
            <Link to="/about" className="block hover:text-fg">About the project</Link>
          </div>
        </div>
      </footer>
      <DemoControls />
    </div>
  );
};
