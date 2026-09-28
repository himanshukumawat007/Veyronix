import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  FileText,
  Gauge,
  Globe2,
  HardHat,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  Map,
  Menu,
  MonitorCog,
  Radio,
  Server,
  Siren,
  Building2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { usePlatformAuth } from '../context/AuthContext';
import { useLive } from '../context/LiveContext';
import { DemoControls } from '../components/DemoControls';
import { RiskBadge } from '../components/RiskBadge';
import { LastUpdated } from '../components/cards';
import { DemoTag, Loading, cx } from '../components/ui';
import { Logo } from './PublicLayout';
import type { Role } from '../services/types';

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const AUTHORITY_NAV: NavItem[] = [
  { to: '/authority/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/authority/map', label: 'Live Map', icon: Map },
  { to: '/authority/risk', label: 'Risk Analysis', icon: Brain },
  { to: '/authority/alerts', label: 'Alerts', icon: Bell },
  { to: '/authority/incidents', label: 'Incidents', icon: History },
  { to: '/authority/regions', label: 'Regions', icon: Globe2 },
  { to: '/authority/reports', label: 'Reports', icon: FileText },
  { to: '/system-health', label: 'System Health', icon: Gauge },
];

const OPERATOR_NAV: NavItem[] = [
  { to: '/operator/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/operator/sites', label: 'Mine Sites', icon: HardHat },
  { to: '/operator/nodes', label: 'Nodes', icon: Radio },
  { to: '/operator/telemetry', label: 'Telemetry', icon: LineChart },
  { to: '/operator/prediction', label: 'Risk Prediction', icon: Brain },
  { to: '/operator/alerts', label: 'Alerts', icon: Bell },
  { to: '/operator/gateway', label: 'Gateway', icon: Server },
  { to: '/operator/grafana', label: 'Grafana', icon: BarChart3 },
  { to: '/operator/reports', label: 'Reports', icon: FileText },
  { to: '/system-health', label: 'System Health', icon: Gauge },
  { to: '/operator/console', label: 'Classic Console', icon: MonitorCog },
];

/** Route guard: requires a session with one of the given roles. */
export const RequireRole: React.FC<{ roles: Role[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user, ready } = usePlatformAuth();
  const loc = useLocation();
  if (!ready) return <div className="bd-root"><Loading label="Checking session…" /></div>;
  if (!user) {
    const role = roles.length === 1 && roles[0] === 'MINE_OPERATOR' ? 'operator' : 'authority';
    return <Navigate to={`/login?role=${role}&next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  if (!roles.includes(user.role)) {
    return (
      <div className="bd-root grid place-items-center p-6">
        <div className="bd-card p-6 max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">Not available for your role</h1>
          <p className="text-sm text-fg-3 mb-4">This page is restricted to {roles.map((r) => (r === 'AUTHORITY' ? 'authority' : 'mine operator')).join(' / ')} users.</p>
          <Link className="text-signal hover:underline text-sm" to={user.role === 'AUTHORITY' ? '/authority/dashboard' : '/operator/dashboard'}>
            Go to your dashboard
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export const ConsoleLayout: React.FC = () => {
  const { user, logout } = usePlatformAuth();
  const { summary } = useLive();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [loc.pathname]);
  if (!user) return null;
  const items = user.role === 'AUTHORITY' ? AUTHORITY_NAV : OPERATOR_NAV;
  const RoleIcon = user.role === 'AUTHORITY' ? Building2 : HardHat;
  const demo = summary?.demo;

  const sidebar = (
    <nav className="flex flex-col h-full" aria-label="Dashboard">
      <div className="h-16 px-4 flex items-center border-b bd-hairline">
        <Logo />
      </div>
      <div className="px-4 py-3 border-b bd-hairline">
        <div className="flex items-center gap-2 text-xs text-fg-3">
          <RoleIcon className="w-4 h-4" aria-hidden />
          {user.role === 'AUTHORITY' ? 'Authority / Disaster Management' : 'Mine Operator'}
        </div>
        <div className="text-sm font-medium mt-0.5 truncate">{user.name}</div>
        <div className="text-[11px] text-fg-3 truncate">{user.organisation}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              cx('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors', isActive ? 'bg-signal/12 text-fg ring-1 ring-signal/25' : 'text-fg-2 hover:bg-white/[0.04] hover:text-fg')
            }
          >
            <n.icon className="w-4 h-4 shrink-0" aria-hidden />
            {n.label}
          </NavLink>
        ))}
      </div>
      <div className="p-3 border-t bd-hairline space-y-2">
        <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-fg-3 hover:text-fg hover:bg-white/[0.04]">
          <Activity className="w-4 h-4" aria-hidden /> Public portal
        </Link>
        <button
          onClick={() => {
            logout();
            nav('/');
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-fg-3 hover:text-fg hover:bg-white/[0.04]"
        >
          <LogOut className="w-4 h-4" aria-hidden /> Sign out
        </button>
        <p className="text-[10px] text-fg-3 px-3">Prototype login — not production-grade authentication.</p>
      </div>
    </nav>
  );

  return (
    <div className="bd-root flex">
      <aside className="hidden lg:block w-64 shrink-0 border-r bd-hairline bg-ink-950 sticky top-0 h-screen bd-no-print">{sidebar}</aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-[1300] flex">
          <div className="w-72 max-w-[85vw] bg-ink-950 border-r bd-hairline h-full">{sidebar}</div>
          <button className="flex-1 bg-black/60" onClick={() => setOpen(false)} aria-label="Close menu" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-[1100] bg-ink-900/90 backdrop-blur border-b bd-hairline bd-no-print">
          <div className="h-14 px-4 flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/5" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <Logo compact />
            </div>
            {summary && <RiskBadge level={summary.overall} size="sm" label={`Network: ${summary.overall.toLowerCase()}`} pulse />}
            <span className={cx('hidden sm:inline-flex items-center gap-1 text-xs', demo?.internetOnline ? 'text-fg-3' : 'text-risk-critical')}>
              {demo?.internetOnline ? <Wifi className="w-3.5 h-3.5" aria-hidden /> : <WifiOff className="w-3.5 h-3.5" aria-hidden />}
              {demo?.internetOnline ? (demo.synchronizing ? 'Cloud syncing' : 'Cloud connected') : 'Internet offline (local mode)'}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <LastUpdated at={summary?.lastUpdate} stale={summary?.stale} className="hidden md:inline-flex" />
              <DemoTag className="hidden sm:inline-flex" />
              <Link
                to="/emergency"
                className="inline-flex items-center gap-1.5 rounded-lg bg-risk-critical/90 hover:bg-risk-critical text-white px-3 py-1.5 text-sm font-semibold"
              >
                <Siren className="w-4 h-4" aria-hidden /> <span className="hidden sm:inline">Emergency View</span>
              </Link>
            </div>
          </div>
        </header>
        <main id="main" className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <DemoControls />
    </div>
  );
};

