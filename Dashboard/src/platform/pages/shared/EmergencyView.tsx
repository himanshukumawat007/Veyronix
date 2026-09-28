import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, MapPin, Siren, WifiOff } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { useAlertActions, useRoleBase } from '../../hooks/useStaff';
import { useNow } from '../../hooks/useNow';
import { useLive } from '../../context/LiveContext';
import { api } from '../../services/api';
import { MonitoringMap } from '../../components/MonitoringMap';
import { AlertStatusBadge } from '../../components/domain';
import { RiskBadge } from '../../components/RiskBadge';
import { Button, DemoTag, cx } from '../../components/ui';
import { RISK_META, fmtTimeSec, timeAgo, vibrationLabel } from '../../services/format';

/**
 * One-click emergency view for control-room screens: only the critical facts, large type,
 * no navigation chrome.
 */
export default function EmergencyView() {
  const { base, zoneBase } = useRoleBase();
  const { summary } = useLive();
  const now = useNow(1000);
  const alertsQ = usePolling((s) => api.getAlerts(s), [], 2500);
  const actions = useAlertActions(alertsQ.refresh);
  const open = (alertsQ.data || []).filter((a) => a.status !== 'RESOLVED').sort((a, b) => (a.severity === b.severity ? b.detectedAt - a.detectedAt : a.severity === 'CRITICAL' ? -1 : 1));
  const top = open[0];
  const zoneQ = usePolling((s) => (top ? api.getZone(top.zoneId, s) : Promise.resolve(null)), [top?.zoneId], 2500, !!top);
  const zone = top ? zoneQ.data : null;
  const worstNode = zone?.nodes.filter((n) => n.latest && n.status !== 'OFFLINE').sort((a, b) => (b.latest!.riskScore || 0) - (a.latest!.riskScore || 0))[0];
  const markers = useMemo(
    () => (zone ? [{ id: zone.id, lat: zone.lat, lng: zone.lng, status: zone.status, title: zone.label, size: 'lg' as const }, ...zone.nodes.filter((n) => n.lat).map((n) => ({ id: n.id, lat: n.lat, lng: n.lng, status: n.status, title: n.id, size: 'sm' as const }))] : []),
    [zone],
  );
  const level = top ? top.severity : 'NORMAL';
  const color = RISK_META[level].color;

  return (
    <div className="bd-root min-h-screen p-4 sm:p-6" style={{ background: top ? `radial-gradient(ellipse at top, ${color}26, #07090d 60%)` : '#07090d' }}>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Link to={`${base}/dashboard`} className="inline-flex items-center gap-1 text-sm text-fg-3 hover:text-fg">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Exit emergency view
        </Link>
        <span className="inline-flex items-center gap-2 text-lg font-bold tracking-wide">
          <Siren className={cx('w-6 h-6', top && 'bd-pulse')} style={{ color }} aria-hidden /> EMERGENCY VIEW
        </span>
        <span className="ml-auto flex items-center gap-3 text-sm">
          {summary?.demo && !summary.demo.internetOnline && (
            <span className="inline-flex items-center gap-1 text-risk-warning"><WifiOff className="w-4 h-4" aria-hidden /> Internet offline — local alarms active</span>
          )}
          <span className="bd-num text-fg-2">{fmtTimeSec(now)}</span>
          <DemoTag />
        </span>
      </div>

      {!top ? (
        <div className="grid place-items-center py-24 text-center">
          <CheckCircle2 className="w-16 h-16 text-risk-normal mb-4" aria-hidden />
          <div className="text-3xl font-bold">NO ACTIVE EMERGENCIES</div>
          <p className="text-fg-2 mt-2">All monitored zones are within normal limits. This screen updates automatically.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl p-5 sm:p-6 ring-2" style={{ background: `${color}1a`, boxShadow: `inset 0 0 0 2px ${color}66` }}>
              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge level={top.severity} size="lg" pulse />
                <AlertStatusBadge status={top.status} />
                <span className="bd-num text-sm text-fg-2">Alert #{top.id}</span>
              </div>
              <div className="mt-3 flex items-start gap-2">
                <MapPin className="w-7 h-7 shrink-0 mt-1" style={{ color }} aria-hidden />
                <div>
                  <div className="text-2xl sm:text-4xl font-bold leading-tight">{top.zoneLabel}</div>
                  <div className="text-fg-2">{top.regionName}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                <div className="bd-card-2 p-3">
                  <div className="text-xs text-fg-3">Current risk</div>
                  <div className="text-3xl font-bold bd-num" style={{ color }}>{zone?.riskScore ?? top.peakRiskScore}</div>
                </div>
                <div className="bd-card-2 p-3">
                  <div className="text-xs text-fg-3 flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden /> Detected</div>
                  <div className="text-2xl font-bold bd-num">{fmtTimeSec(top.detectedAt)}</div>
                  <div className="text-xs text-fg-3">{timeAgo(top.detectedAt, now)}</div>
                </div>
                <div className="bd-card-2 p-3 col-span-2 sm:col-span-1">
                  <div className="text-xs text-fg-3">Predicted (60 min)</div>
                  <div className="text-2xl font-bold" style={{ color: zone?.prediction ? RISK_META[zone.prediction.predictedLevel].color : undefined }}>
                    {zone?.prediction?.predictedLevel || '…'}
                  </div>
                  {zone?.prediction?.simulated && <div className="text-[11px] text-fg-3">simulated</div>}
                </div>
              </div>
            </div>

            <div className="bd-card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-fg-3 mb-2">Latest sensor reading {worstNode ? `· ${worstNode.id}` : ''}</div>
              {worstNode?.latest ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ['Tilt', `${worstNode.latest.tiltDeg.toFixed(1)}°`],
                    ['Vibration', vibrationLabel(worstNode.latest.vibration)],
                    ['Displacement', `${worstNode.latest.displacementMm.toFixed(1)} mm`],
                    ['Crack width', worstNode.latest.crackMm === null ? 'n/a' : `${worstNode.latest.crackMm.toFixed(2)} mm`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs text-fg-3">{k}</div>
                      <div className="text-2xl font-semibold bd-num">{v}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-fg-3">Waiting for data…</p>
              )}
            </div>

            <div className="bd-card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-fg-3 mb-1">Recommended public action</div>
              <p className="text-xl font-semibold">{top.recommendation}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {top.status === 'ACTIVE' && <Button size="lg" variant="primary" onClick={() => actions.ack(top.id)} busy={actions.busy === `ack:${top.id}`}>Acknowledge alert</Button>}
              <Button size="lg" variant="success" onClick={() => actions.resolve(top.id)} busy={actions.busy === `res:${top.id}`}>Mark resolved</Button>
              <Link to={`${zoneBase}/${top.zoneId}`}><Button size="lg" variant="secondary">Open zone details</Button></Link>
            </div>
            {actions.error && <p className="text-risk-critical text-sm">{actions.error}</p>}
          </div>

          <div className="space-y-4">
            <div className="bd-card overflow-hidden">
              <MonitoringMap markers={markers} height="min(58vh, 560px)" focusZoom={13} ariaLabel="Affected area map" />
            </div>
            {open.length > 1 && (
              <div className="bd-card p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-fg-3 mb-2">Other open alerts ({open.length - 1})</div>
                <ul className="space-y-2">
                  {open.slice(1).map((a) => (
                    <li key={a.id} className="flex items-center gap-3 text-sm">
                      <RiskBadge level={a.severity} size="xs" />
                      <span className="flex-1 truncate">{a.zoneLabel}</span>
                      <AlertStatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
