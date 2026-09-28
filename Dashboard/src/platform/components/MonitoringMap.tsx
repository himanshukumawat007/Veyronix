import React, { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RISK_META } from '../services/format';
import type { RiskLevel } from '../services/types';

/**
 * GIS map of monitoring zones. Uses free OpenStreetMap tiles by default (no API key), darkened with a
 * CSS filter for the control-room theme. Override with VITE_MAP_TILE_URL / VITE_MAP_ATTRIBUTION
 * (e.g. a self-hosted tile server for production — respect the OSM tile usage policy).
 */
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DARKEN = !import.meta.env.VITE_MAP_TILE_URL;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  status: RiskLevel;
  title: string;
  subtitle?: string;
  popup?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const FitAndFocus: React.FC<{ markers: MapMarker[]; selectedId?: string | null; focusZoom: number }> = ({ markers, selectedId, focusZoom }) => {
  const map = useMap();
  const key = markers.map((m) => m.id).join(',');
  useEffect(() => {
    if (!markers.length) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], focusZoom);
      return;
    }
    const b: LatLngBoundsExpression = markers.map((m) => [m.lat, m.lng]) as LatLngBoundsExpression;
    map.fitBounds(b, { padding: [40, 40], maxZoom: 9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    const m = markers.find((x) => x.id === selectedId);
    if (m) map.flyTo([m.lat, m.lng], Math.max(map.getZoom(), focusZoom), { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);
  return null;
};

export const MonitoringMap: React.FC<{
  markers: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number | string;
  focusZoom?: number;
  className?: string;
  ariaLabel?: string;
}> = ({ markers, selectedId, onSelect, height = 420, focusZoom = 11, className, ariaLabel = 'Map of monitored zones' }) => {
  const valid = useMemo(() => markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng) && !(m.lat === 0 && m.lng === 0)), [markers]);
  const center: [number, number] = valid.length ? [valid[0].lat, valid[0].lng] : [22.5, 85.5];
  return (
    <div className={className} style={{ height }} role="region" aria-label={ariaLabel}>
      <MapContainer center={center} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} attributionControl>
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} className={DARKEN ? 'bd-dark-tiles' : undefined} />
        <FitAndFocus markers={valid} selectedId={selectedId} focusZoom={focusZoom} />
        {valid.map((m) => {
          const meta = RISK_META[m.status];
          const r = m.size === 'sm' ? 6 : m.size === 'lg' ? 12 : 9;
          const selected = m.id === selectedId;
          return (
            <React.Fragment key={m.id}>
              {(m.status === 'CRITICAL' || m.status === 'WARNING') && (
                <CircleMarker
                  center={[m.lat, m.lng]}
                  radius={r * (m.status === 'CRITICAL' ? 2.6 : 2)}
                  pathOptions={{ color: meta.color, weight: 1, opacity: 0.5, fillColor: meta.color, fillOpacity: 0.12 }}
                  interactive={false}
                />
              )}
              <CircleMarker
                center={[m.lat, m.lng]}
                radius={selected ? r + 3 : r}
                pathOptions={{ color: selected ? '#ffffff' : '#0b0f14', weight: selected ? 3 : 2, fillColor: meta.color, fillOpacity: 0.95 }}
                eventHandlers={{ click: () => onSelect?.(m.id) }}
              >
                <Tooltip direction="top" offset={[0, -r]} opacity={0.95}>
                  <span style={{ fontWeight: 600 }}>{m.title}</span> — {meta.label}
                </Tooltip>
                {m.popup && <Popup>{m.popup}</Popup>}
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export const MapLegend: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-2 ${className || ''}`}>
    {(['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'] as RiskLevel[]).map((l) => (
      <span key={l} className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full ring-2 ring-ink-900" style={{ background: RISK_META[l].color }} aria-hidden />
        {RISK_META[l].label}
      </span>
    ))}
  </div>
);
