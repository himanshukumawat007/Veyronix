import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  BrainCircuit,
  BarChart3,
  Radio,
  Bell,
  Network,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Download,
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';
import { ActivePage } from '../../types';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activePage, setActivePage, stats, alerts } = useMonitoring();

  const unackAlerts = alerts.filter((a) => !a.acknowledged && a.severity !== 'RESOLVED').length;

  const navItems: Array<{
    id: ActivePage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Sensor Analytics', icon: LineChart },
    { id: 'ai', label: 'AI Prediction', icon: BrainCircuit },
    { id: 'grafana', label: 'Grafana Telemetry', icon: BarChart3 },
    {
      id: 'nodes',
      label: 'Nodes & Gateway',
      icon: Radio,
      badge: stats.warning + stats.critical > 0 ? `${stats.warning + stats.critical}` : undefined,
      badgeColor: stats.critical > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'alerts',
      label: 'Alerts & Alarms',
      icon: Bell,
      badge: unackAlerts > 0 ? unackAlerts : undefined,
      badgeColor: 'bg-red-600 text-white',
    },
    { id: 'pipeline', label: 'Pipeline & System', icon: Network },
  ];

  const handleNav = (page: ActivePage) => {
    setActivePage(page);
    if (onCloseMobile) onCloseMobile();
  };

  const getHealthBadge = () => {
    if (stats.systemHealth === 'CRITICAL') {
      return (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <AlertOctagon className="h-4 w-4 text-red-400 shrink-0 animate-pulse" />
          <div className="text-xs font-bold tracking-wide">SYSTEM: CRITICAL</div>
        </div>
      );
    }
    if (stats.systemHealth === 'WARNING') {
      return (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="text-xs font-bold tracking-wide">SYSTEM: WARNING</div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <div className="text-xs font-bold tracking-wide">SYSTEM: NOMINAL</div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a110d]/95 border-r border-emerald-900/30 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Section */}
        <div className="p-4 space-y-6">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3 px-2 py-1.5 border-b border-emerald-900/40 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 shadow-sm">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white tracking-tight text-sm font-sans">
                BHU-DRISHTI
              </div>
              <div className="text-[11px] text-emerald-400/80 font-mono">
                Geotechnical Telemetry
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.3)] font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-emerald-950/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? 'text-white' : 'text-emerald-400/70'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info: Health Status & Export Link */}
        <div className="p-4 border-t border-emerald-900/30 space-y-3 bg-[#080d0a]/60">
          {getHealthBadge()}

          <div className="rounded-xl border border-emerald-950 bg-[#090f1d]/40 p-2.5 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="flex justify-between">
              <span>Nodes Online:</span>
              <span className="text-emerald-400 font-bold">
                {stats.online}/{stats.total}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Current Risk:</span>
              <span
                className={`font-bold ${
                  stats.critical > 0
                    ? 'text-red-400'
                    : stats.warning > 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {stats.currentRiskScore}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pi Gateway:</span>
              <span className="text-emerald-400">ONLINE</span>
            </div>
          </div>

          <a
            href="/api/export-project-zip"
            download="bhu_drishti_full_project.zip"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Project ZIP</span>
          </a>
        </div>
      </aside>
    </>
  );
};
