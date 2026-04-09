import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { StagesQuery } from '../../../graphql/generated/graphql';
import styles from './TripMap.module.css';
import 'leaflet/dist/leaflet.css';

type Stage = StagesQuery['stages'][number];

// Fix default marker icons (Leaflet + Vite issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeNumberedIcon(n: number, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:2px solid rgba(255,255,255,0.9);
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:#fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
    ">${n}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function FitBounds({ stages }: { stages: Stage[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || stages.length === 0) return;
    const bounds = L.latLngBounds(stages.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [48, 48] });
    fitted.current = true;
  }, [map, stages]);
  return null;
}

interface TripMapProps {
  stages: Stage[];
  activeStageId?: string | null;
  stageDateRanges?: Record<string, { start: string; end: string }>;
  onStageClick?: (stageId: string) => void;
}

const STAGE_COLORS = ['#c6a35d', '#7a8ebd', '#c87060', '#6aab8e', '#b07ab8'];

export function TripMap({ stages, activeStageId, stageDateRanges = {}, onStageClick }: TripMapProps) {
  const polylinePositions = stages.map((s) => [s.lat, s.lng] as [number, number]);

  return (
    <div className={styles.wrapper}>
      <MapContainer
        center={stages[0] ? [stages[0].lat, stages[0].lng] : [64.1, -18.5]}
        zoom={6}
        className={styles.map}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {stages.length > 1 && (
          <Polyline
            positions={polylinePositions}
            color="rgba(198,163,93,0.5)"
            weight={2}
            dashArray="6 4"
          />
        )}

        {stages.map((stage, i) => {
          const dateRange = stageDateRanges[stage.id];
          return (
            <Marker
              key={stage.id}
              position={[stage.lat, stage.lng]}
              icon={makeNumberedIcon(i + 1, activeStageId === stage.id ? '#c6a35d' : STAGE_COLORS[i % STAGE_COLORS.length])}
              eventHandlers={{ click: () => onStageClick?.(stage.id) }}
            >
              <Tooltip direction="top" offset={[0, -18]} opacity={1} className="smt-tooltip">
                <strong>{stage.displayName}</strong>
                {dateRange && (
                  <span>{formatShortDate(dateRange.start)} — {formatShortDate(dateRange.end)}</span>
                )}
              </Tooltip>
            </Marker>
          );
        })}

        <FitBounds stages={stages} />
      </MapContainer>
    </div>
  );
}
