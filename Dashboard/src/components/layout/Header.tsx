import React from 'react';
import {
  Menu,
  Bell,
  Radio,
  VolumeX,
  Activity,
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';

interface HeaderProps {
  onOpenMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const {
    alerts,
    setActivePage,
    gateway,
    silenceAlarmBuzzer,
    stats,
  } = useMonitoring();

  const activeAlertCount = alerts.filter(
    (a) => !a.acknowledged && a.severity !== 'RESOLVED'
  ).length;

  const isBuzzerSounding = gateway.alarmState?.buzzerActive;
  const alarmColor = gateway.alarmState?.color || 'GREEN';

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-emerald-900/30 bg-[#0a110d]/90 px-4 sm:px-6 backdrop-blur-xl text-slate-100"
    >
      {/* Left branding & mobile trigger */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-nav-toggle"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
              BHU-DRISHTI
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              IoT Early Warning
            </span>
          </div>
        </div>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* RASPBERRY PI LOCAL HARDWARE ALARM INDICATOR */}
        <div
          id="hardware-alarm-pill"
          className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-medium border ${
            alarmColor === 'RED'
              ? 'bg-red-950/60 border-red-800/80 text-red-300 animate-pulse'
              : alarmColor === 'YELLOW'
              ? 'bg-amber-950/60 border-amber-800/80 text-amber-300'
              : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
          }`}
          title={`Raspberry Pi GPIO Alarm: ${alarmColor} LED active. Buzzer: ${
            isBuzzerSounding ? 'ACTIVE' : 'SILENT'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              alarmColor === 'RED'
                ? 'bg-red-500'
                : alarmColor === 'YELLOW'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
          />
          <span>PI ALARM: {alarmColor}</span>

          {isBuzzerSounding && (
            <button
              onClick={silenceAlarmBuzzer}
              className="ml-1 px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-500 cursor-pointer flex items-center gap-1"
              title="Silence Hardware Buzzer"
            >
              <VolumeX className="h-3 w-3" /> MUTE
            </button>
          )}
        </div>

        {/* INGESTION RATE */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>{stats.ingestRate} pkt/min</span>
        </div>

        {/* NOTIFICATIONS / ALERTS */}
        <button
          id="header-alerts-btn"
          onClick={() => setActivePage('alerts')}
          className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors border border-slate-800/60 cursor-pointer"
          aria-label="Alerts"
          title="View Alerts and Alarm Logs"
        >
          <Bell className="h-5 w-5" />
          {activeAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse">
              {activeAlertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
