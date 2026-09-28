import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  Cloud,
  CloudOff,
  Cpu,
  Gauge,
  HardDrive,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Radio,
  RefreshCw,
  Siren,
  Thermometer,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useNow } from '../hooks/useNow';
import { RISK_META, fmtDateTime, fmtTime, fmtUptime, timeAgo, vibrationLabel } from '../services/format';
import type { RiskLevel, AlertRecord, GatewayView, Incident, NodeView, PublicAlert, SensorHealth, SystemHealth } from '../services/types';
import { HealthBadge, RiskBadge, StatusDot } from './RiskBadge';
import { Button, DemoTag, KeyValue, Pill, cx } from './ui';

// ------------------------------------------------------------------ alerts
export const PublicAlertCard: React.FC<{ alert: PublicAlert; onViewArea?: () => void }> = ({ alert, onViewArea }) => {
  const now = useNow(15000);
  const resolved = alert.status === 'RESOLVED';
  const level = resolved ? 'NORMAL' : alert.severity;
  return (
    <article className={cx('bd-card p-4 sm:p-5 border-l-4')} style={{ borderLeftColor: RISK_META[level].color }} aria-label={`${alert.severity} alert ${alert.location}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <RiskBadge level={alert.severity} size="md" pulse={!resolved} />
        <Pill className={cx('ring-1', resolved ? 'bg-risk-normal/10 text-risk-normal ring-risk-normal/30' : 'bg-white/5 text-fg-2 ring-white/10')}>
          {resolved ? 'Resolved' : alert.status === 'ACKNOWLEDGED' ? 'Authorities responding' : 'Active'}
        </Pill>
        {alert.isDemo && <DemoTag />}
        <span className="ml-auto text-xs text-fg-3 bd-num">
          {fmtTime(alert.detectedAt)} · {timeAgo(alert.detectedAt, now)}
        </span>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-fg">{alert.title}</h3>
      <div className="flex items-center gap-1.5 text-sm text-fg-2 mt-1">
        <MapPin className="w-4 h-4 shrink-0" aria-hidden /> {alert.location}, {alert.regionName}
      </div>
      <p className="text-sm text-fg-2 mt-2">{alert.description}</p>
      {!resolved && (
        <div className="mt-3 rounded-lg bg-ink-900/70 border bd-hairline p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-fg-3 mb-1">Recommended action</div>
          <p className="text-sm text-fg">{alert.recommendation}</p>
          {alert.conditionCleared && <p className="text-xs text-risk-normal mt-1.5">Readings have returned to normal; awaiting official all-clear.</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {onViewArea && (
          <Button size="sm" variant="secondary" onClick={onViewArea}>
            <MapPin className="w-4 h-4" aria-hidden /> View affected area
          </Button>
        )}
        <Link to="/safety">
          <Button size="sm" variant="ghost">Safety instructions</Button>
        </Link>
      </div>
    </article>
  );
};

const CHANNEL_ICON = { LOCAL_ALARM: Siren, DASHBOARD: Monitor, SMS: MessageSquare, EMAIL: Mail } as const;
const CHANNEL_LABEL = { LOCAL_ALARM: 'LED / buzzer', DASHBOARD: 'Dashboard', SMS: 'SMS', EMAIL: 'E-mail' } as const;

export const AlertChannels: React.FC<{ alert: AlertRecord }> = ({ alert }) => (
  <div className="flex flex-wrap gap-1.5">
    {alert.channels.map((c) => {
      const Icon = CHANNEL_ICON[c.channel];
      return (
        <span
          key={c.channel}
          title={c.simulated ? 'Simulated delivery (no provider configured in prototype)' : undefined}
          className={cx(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] ring-1',
            c.state === 'SENT' ? 'bg-risk-normal/10 text-risk-normal ring-risk-normal/25' : c.state === 'QUEUED' ? 'bg-risk-warning/10 text-risk-warning ring-risk-warning/25' : 'bg-white/5 text-fg-3 ring-white/10',
          )}
        >
          <Icon className="w-3 h-3" aria-hidden />
          {CHANNEL_LABEL[c.channel]} · {c.state.toLowerCase()}
          {c.simulated ? '*' : ''}
        </span>
      );
    })}
  </div>
);

export const AlertStatusBadge: React.FC<{ status: AlertRecord['status'] }> = ({ status }) => (
  <span
    className={cx(
      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1',
      status === 'ACTIVE' && 'bg-risk-critical/12 text-risk-critical ring-risk-critical/30',
      status === 'ACKNOWLEDGED' && 'bg-signal/12 text-signal ring-signal/30',
      status === 'RESOLVED' && 'bg-risk-normal/12 text-risk-normal ring-risk-normal/30',
    )}
  >
    {status === 'ACTIVE' ? <Bell className="w-3 h-3" aria-hidden /> : status === 'ACKNOWLEDGED' ? <BellOff className="w-3 h-3" aria-hidden /> : <Check className="w-3 h-3" aria-hidden />}
    {status}
  </span>
);

export const StaffAlertCard: React.FC<{
  alert: AlertRecord;
  onAck?: () => void;
  onResolve?: () => void;
  busy?: string | null;
  viewTo?: string;
  compact?: boolean;
}> = ({ alert, onAck, onResolve, busy, viewTo, compact }) => {
  const now = useNow(10000);
  return (
    <article className="bd-card p-4 border-l-4" style={{ borderLeftColor: alert.status === 'RESOLVED' ? RISK_META.NORMAL.color : RISK_META[alert.severity].color }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="bd-num text-sm font-semibold text-fg">Alert #{alert.id}</span>
        <RiskBadge level={alert.severity} pulse={alert.status === 'ACTIVE'} />
        <AlertStatusBadge status={alert.status} />
        {alert.isDemo && <DemoTag />}
        <span className="ml-auto text-xs text-fg-3 bd-num">Detected {fmtTime(alert.detectedAt)} · {timeAgo(alert.detectedAt, now)}</span>
      </div>
      <div className="mt-2 text-sm font-medium text-fg">{alert.zoneLabel}</div>
      <div className="text-xs text-fg-3">{alert.regionName} · Peak risk score <span className="bd-num">{alert.peakRiskScore}</span> · Incident {alert.incidentId}</div>
      {!compact && <p className="text-sm text-fg-2 mt-2">{alert.description}</p>}
      {alert.conditionCleared && alert.status !== 'RESOLVED' && <p className="text-xs text-risk-normal mt-1.5">Sensor readings back to normal — ready to resolve after field verification.</p>}
      {!compact && (
        <div className="mt-3">
          <AlertChannels alert={alert} />
        </div>
      )}
      {(alert.acknowledgedBy || alert.resolvedBy) && (
        <div className="text-xs text-fg-3 mt-2 space-y-0.5">
          {alert.acknowledgedBy && <div>Acknowledged by {alert.acknowledgedBy} at {fmtTime(alert.acknowledgedAt)}</div>}
          {alert.resolvedBy && <div>Resolved by {alert.resolvedBy} at {fmtTime(alert.resolvedAt)}</div>}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {onAck && alert.status === 'ACTIVE' && (
          <Button size="sm" variant="primary" onClick={onAck} busy={busy === `ack:${alert.id}`}>
            Acknowledge
          </Button>
        )}
        {onResolve && alert.status !== 'RESOLVED' && (
          <Button size="sm" variant="success" onClick={onResolve} busy={busy === `res:${alert.id}`}>
            Mark resolved
          </Button>
        )}
        {viewTo && (
          <Link to={viewTo}>
            <Button size="sm" variant="secondary">
              <MapPin className="w-4 h-4" aria-hidden /> View location
            </Button>
          </Link>
        )}
      </div>
    </article>
  );
};

// ------------------------------------------------------------------ nodes
export const NodeTable: React.FC<{ nodes: NodeView[]; linkBase?: string | null; showZone?: boolean }> = ({ nodes, linkBase = '/operator/node', showZone }) => {
  const now = useNow(5000);
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-fg-3 border-b bd-hairline">
            <th className="py-2 px-4 sm:px-3 font-semibold">Node ID</th>
            {showZone && <th className="py-2 px-3 font-semibold">Zone</th>}
            <th className="py-2 px-3 font-semibold">Status</th>
            <th className="py-2 px-3 font-semibold text-right">Tilt</th>
            <th className="py-2 px-3 font-semibold">Vibration</th>
            <th className="py-2 px-3 font-semibold text-right">Displacement</th>
            <th className="py-2 px-3 font-semibold text-right">Crack</th>
            <th className="py-2 px-3 font-semibold text-right">Risk</th>
            <th className="py-2 px-3 font-semibold text-right">Battery</th>
            <th className="py-2 px-3 font-semibold">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((n) => {
            const off = n.status === 'OFFLINE';
            const l = n.latest;
            return (
              <tr key={n.id} className="border-b bd-hairline hover:bg-white/[0.03]">
                <td className="py-2.5 px-4 sm:px-3">
                  {linkBase ? (
                    <Link to={`${linkBase}/${encodeURIComponent(n.id)}`} className="font-medium text-signal hover:underline bd-num">
                      {n.id}
                    </Link>
                  ) : (
                    <span className="font-medium bd-num">{n.id}</span>
                  )}
                  {n.fusion?.suppressedSingleSensor && <div className="text-[10px] text-risk-warning">Sensor check needed</div>}
                </td>
                {showZone && <td className="py-2.5 px-3 text-fg-2 text-xs">{n.zoneLabel}</td>}
                <td className="py-2.5 px-3">
                  <RiskBadge level={n.status} size="xs" />
                </td>
                <td className="py-2.5 px-3 text-right bd-num">{off || !l ? '--' : `${l.tiltDeg.toFixed(1)}°`}</td>
                <td className="py-2.5 px-3">{off || !l ? '--' : vibrationLabel(l.vibration)}</td>
                <td className="py-2.5 px-3 text-right bd-num">{off || !l ? '--' : `${l.displacementMm.toFixed(1)} mm`}</td>
                <td className="py-2.5 px-3 text-right bd-num">{off || !l || l.crackMm === null ? '--' : `${l.crackMm.toFixed(2)} mm`}</td>
                <td className="py-2.5 px-3 text-right bd-num">{off || !l ? '--' : l.riskScore.toFixed(0)}</td>
                <td className={cx('py-2.5 px-3 text-right bd-num', n.batteryPct < 15 ? 'text-risk-critical' : n.batteryPct < 30 ? 'text-risk-warning' : '')}>{n.batteryPct}%</td>
                <td className="py-2.5 px-3 text-xs text-fg-3">{timeAgo(n.lastSeen, now)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const SENSOR_ROWS: Array<{ key: keyof SensorHealth; label: string; hint: string }> = [
  { key: 'mpu6050', label: 'MPU6050 (tilt / acceleration)', hint: 'Inclination and 3-axis acceleration' },
  { key: 'piezo', label: 'Piezoelectric sensor', hint: 'Ground vibration' },
  { key: 'potentiometer', label: 'Linear potentiometer', hint: 'Displacement / crack width' },
  { key: 'battery', label: 'Battery', hint: '2× battery pack' },
  { key: 'lora', label: 'LoRa RA-02 link', hint: 'Radio link to gateway' },
];

export const SensorHealthCard: React.FC<{ node: NodeView }> = ({ node }) => (
  <ul className="divide-y divide-white/5">
    {SENSOR_ROWS.map((r) => (
      <li key={r.key} className="flex items-center justify-between gap-3 py-2.5">
        <div className="min-w-0">
          <div className="text-sm text-fg">{r.label}</div>
          <div className="text-xs text-fg-3">
            {r.key === 'battery' ? `${node.batteryPct}% remaining` : r.key === 'lora' ? `RSSI ${node.rssi} dBm` : r.hint}
          </div>
        </div>
        <HealthBadge state={node.health[r.key]} />
      </li>
    ))}
  </ul>
);

// ------------------------------------------------------------------ gateway
export const GatewayStatusPanel: React.FC<{ gw: GatewayView; onSilence?: () => void; silencing?: boolean }> = ({ gw, onSilence, silencing }) => {
  const now = useNow(1000);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="bd-num text-lg font-semibold">{gw.id}</span>
          <HealthBadge state={gw.loraStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE'} />
        </div>
        <div className="text-xs text-fg-3 mb-3">{gw.hardware} · {gw.zoneLabel}</div>
        <KeyValue label="LoRa receiver" value={<HealthBadge state={gw.loraStatus} />} />
        <KeyValue label="Internet" value={<HealthBadge state={gw.internet} />} />
        <KeyValue label="Local database" value={<HealthBadge state={gw.localDb} />} />
        <KeyValue label="Cloud sync" value={<HealthBadge state={gw.cloudSync} />} />
        <KeyValue label="Last sync" value={timeAgo(gw.lastSync, now)} />
        <KeyValue label="Buffered records" value={<span className="bd-num">{gw.backlog}</span>} />
        <KeyValue label="Uptime" value={fmtUptime(gw.uptimeSec)} />
      </div>
      <div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'CPU', value: `${gw.cpuPct}%`, icon: Cpu },
            { label: 'Memory', value: `${gw.memoryPct}%`, icon: Gauge },
            { label: 'Storage', value: `${gw.storagePct}%`, icon: HardDrive },
            { label: 'Temperature', value: `${gw.temperatureC} °C`, icon: Thermometer },
          ].map((x) => (
            <div key={x.label} className="bd-card-2 p-3">
              <div className="flex items-center gap-1.5 text-xs text-fg-3">
                <x.icon className="w-3.5 h-3.5" aria-hidden /> {x.label}
              </div>
              <div className="bd-num text-lg font-semibold mt-1">{x.value}</div>
            </div>
          ))}
        </div>
        <div className="bd-card-2 p-3">
          <div className="text-xs text-fg-3 mb-2">Local alarm (LED + buzzer on gateway)</div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-label={`Alarm LED ${gw.localAlarm}`}>
              {(['GREEN', 'YELLOW', 'RED'] as const).map((c) => (
                <span
                  key={c}
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: gw.localAlarm === c ? (c === 'GREEN' ? '#22c55e' : c === 'YELLOW' ? '#f5a524' : '#ef4444') : '#2c3848',
                    boxShadow: gw.localAlarm === c ? `0 0 12px ${c === 'GREEN' ? '#22c55e' : c === 'YELLOW' ? '#f5a524' : '#ef4444'}` : 'none',
                  }}
                />
              ))}
            </div>
            <span className="text-sm">{gw.localAlarm === 'RED' ? 'Critical' : gw.localAlarm === 'YELLOW' ? 'Warning' : 'Normal'}</span>
            <span className={cx('ml-auto text-xs inline-flex items-center gap-1', gw.buzzerActive ? 'text-risk-critical' : 'text-fg-3')}>
              <Siren className={cx('w-3.5 h-3.5', gw.buzzerActive && 'bd-pulse')} aria-hidden /> Buzzer {gw.buzzerActive ? 'sounding' : 'off'}
            </span>
          </div>
          {gw.buzzerActive && onSilence && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={onSilence} busy={silencing}>
              <BellOff className="w-4 h-4" aria-hidden /> Silence buzzer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/** Visualises the offline-first design: local layer keeps working when the internet drops. */
export const OfflineFirstPanel: React.FC<{ internetOnline: boolean; synchronizing: boolean; backlog?: number; compact?: boolean }> = ({ internetOnline, synchronizing, backlog, compact }) => {
  const rows = [
    { label: 'Internet', icon: internetOnline ? Wifi : WifiOff, state: internetOnline ? 'ONLINE' : 'OFFLINE' },
    { label: 'Local gateway', icon: Radio, state: 'OPERATIONAL' },
    { label: 'Local monitoring', icon: Activity, state: 'OPERATIONAL' },
    { label: 'Local alarm (LED/buzzer)', icon: Siren, state: 'OPERATIONAL' },
    { label: 'Grafana (local)', icon: Monitor, state: 'OPERATIONAL' },
    { label: 'Remote alerts (SMS/e-mail)', icon: MessageSquare, state: internetOnline ? 'OPERATIONAL' : 'OFFLINE' },
    { label: 'Cloud sync', icon: internetOnline ? (synchronizing ? RefreshCw : Cloud) : CloudOff, state: internetOnline ? (synchronizing ? 'SYNCHRONIZING' : 'SYNCED') : 'PAUSED' },
  ];
  return (
    <div>
      <ul className={cx('grid gap-2', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
        {rows.map((r) => (
          <li key={r.label} className="bd-card-2 px-3 py-2 flex items-center gap-2.5">
            <r.icon className={cx('w-4 h-4 shrink-0', r.state === 'SYNCHRONIZING' && 'animate-spin', r.state === 'OFFLINE' || r.state === 'PAUSED' ? 'text-risk-critical' : 'text-fg-2')} aria-hidden />
            <span className="text-sm flex-1">{r.label}</span>
            <HealthBadge state={r.state === 'OFFLINE' && r.label === 'Remote alerts (SMS/e-mail)' ? 'OFFLINE' : r.state} />
          </li>
        ))}
      </ul>
      <p className="text-xs text-fg-3 mt-2">
        {internetOnline
          ? synchronizing
            ? `Connection restored — gateways are back-filling buffered readings${backlog ? ` (${backlog} records remaining)` : ''}.`
            : 'All layers connected. Gateways log locally and sync to the cloud continuously.'
          : 'Internet link down. Gateways keep logging, visualising in Grafana and sounding local alarms; cloud data and SMS/e-mail resume automatically when the link returns.'}
      </p>
    </div>
  );
};

// ------------------------------------------------------------------ incidents
const EVENT_ICON = { DETECTION: Activity, ESCALATION: AlertOctagon, ALERT: Bell, ACKNOWLEDGEMENT: BellOff, RESOLUTION: CheckCircle2 } as const;
const EVENT_LABEL = { DETECTION: 'Detection', ESCALATION: 'Risk escalation', ALERT: 'Alert issued', ACKNOWLEDGEMENT: 'Acknowledged', RESOLUTION: 'Resolved' } as const;

export const IncidentTimeline: React.FC<{ incident: Incident }> = ({ incident }) => {
  const steps: Array<keyof typeof EVENT_LABEL> = ['DETECTION', 'ESCALATION', 'ALERT', 'ACKNOWLEDGEMENT', 'RESOLUTION'];
  return (
    <ol className="relative ml-3 border-l border-white/10 space-y-4 py-1">
      {steps.map((type) => {
        const ev = incident.events.find((e) => e.type === type);
        const Icon = EVENT_ICON[type];
        const skipped = type === 'ESCALATION' && !ev && incident.severity === 'WARNING';
        if (skipped) return null;
        return (
          <li key={type} className="ml-5">
            <span className={cx('absolute -left-3 w-6 h-6 rounded-full grid place-items-center ring-4 ring-ink-800', ev ? 'bg-ink-600 text-fg' : 'bg-ink-750 text-fg-3')}>
              <Icon className="w-3.5 h-3.5" aria-hidden />
            </span>
            <div className={cx('text-sm font-medium', ev ? 'text-fg' : 'text-fg-3')}>{EVENT_LABEL[type]}</div>
            <div className="text-xs text-fg-3">{ev ? `${fmtDateTime(ev.at)} — ${ev.note}` : 'Pending'}</div>
          </li>
        );
      })}
    </ol>
  );
};

// ------------------------------------------------------------------ system health
export const ServiceStatusList: React.FC<{ health: SystemHealth }> = ({ health }) => (
  <ul className="grid gap-2 md:grid-cols-2">
    {health.services.map((s) => (
      <li key={s.id} className="bd-card-2 p-3 flex items-start gap-3">
        <span className={cx('mt-1 w-2.5 h-2.5 rounded-full shrink-0', s.state === 'OPERATIONAL' ? 'bg-risk-normal' : s.state === 'DEGRADED' ? 'bg-risk-warning' : 'bg-risk-critical')} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{s.name}</span>
            <HealthBadge state={s.state} className="ml-auto" />
          </div>
          <p className="text-xs text-fg-3 mt-1">{s.detail}</p>
        </div>
      </li>
    ))}
  </ul>
);

export const ZoneStatusRow: React.FC<{ label: string; sub?: string; level: RiskLevel; to?: string; right?: React.ReactNode }> = ({ label, sub, level, to, right }) => {
  const inner = (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04]">
      <StatusDot level={level} ping />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-fg truncate">{label}</div>
        {sub && <div className="text-xs text-fg-3 truncate">{sub}</div>}
      </div>
      {right}
      <RiskBadge level={level} size="xs" />
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};


