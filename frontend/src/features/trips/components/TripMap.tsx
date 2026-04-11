import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { StagesQuery, DaysQuery } from '../../../graphql/generated/graphql';
import styles from './TripMap.module.css';
import 'leaflet/dist/leaflet.css';

type Stage = StagesQuery['stages'][number];
type Day = DaysQuery['days'][number];

// Fix default marker icons (Leaflet + Vite issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STAGE_COLORS = ['#c6a35d', '#7a8ebd', '#c87060', '#6aab8e', '#b07ab8'];
const ACTIVE_STAGE_COLOR = '#c6a35d';
const DAY_COLOR = '#f2e2bb';

function makeStageIcon(n: number, color: string, active: boolean) {
  const size = active ? 40 : 32;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid rgba(255,255,255,0.95);
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Sans',sans-serif;font-size:${active ? 15 : 13}px;font-weight:600;color:#fff;
      box-shadow:0 2px 10px rgba(0,0,0,0.55);
    ">${n}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

function makeDayIcon(n: number) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:${DAY_COLOR};border:2px solid ${ACTIVE_STAGE_COLOR};
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;color:#1a1a1a;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    ">${n}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// FitBounds refits the map whenever `boundsKey` changes. Pass a stable key
// (e.g. the active stage id or 'all') so the map only re-centers on real
// transitions.
function FitBounds({ positions, boundsKey }: { positions: [number, number][]; boundsKey: string }) {
  const map = useMap();
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (positions.length === 0) return;
    if (lastKey.current === boundsKey) return;
    lastKey.current = boundsKey;
    const bounds = L.latLngBounds(positions);
    map.flyToBounds(bounds, { padding: [60, 60], duration: 0.8, maxZoom: 13 });
  }, [map, positions, boundsKey]);
  return null;
}

interface TripMapProps {
  stages: Stage[];
  activeStageId?: string | null;
  activeStageDays?: Day[];
  stageDateRanges?: Record<string, { start: string; end: string }>;
  onStageClick?: (stageId: string) => void;
  onDayClick?: (stageId: string, day: Day) => void;
}

export function TripMap({
  stages,
  activeStageId,
  activeStageDays = [],
  stageDateRanges = {},
  onStageClick,
  onDayClick,
}: TripMapProps) {
  const activeStage = activeStageId ? stages.find((s) => s.id === activeStageId) ?? null : null;
  const isZoomed = activeStage !== null;

  const polylinePositions = stages.map((s) => [s.lat, s.lng] as [number, number]);

  const boundsPositions: [number, number][] = isZoomed
    ? [
        [activeStage!.lat, activeStage!.lng] as [number, number],
        ...activeStageDays.map((d) => [d.lat, d.lng] as [number, number]),
      ]
    : stages.map((s) => [s.lat, s.lng] as [number, number]);

  const boundsKey = isZoomed ? `stage-${activeStageId}-${activeStageDays.length}` : 'all';

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

        {/* Overview mode: polyline between stages */}
        {!isZoomed && stages.length > 1 && (
          <Polyline
            positions={polylinePositions}
            color="rgba(198,163,93,0.5)"
            weight={2}
            dashArray="6 4"
          />
        )}

        {/* Overview mode: numbered stage markers */}
        {!isZoomed &&
          stages.map((stage, i) => {
            const dateRange = stageDateRanges[stage.id];
            return (
              <Marker
                key={stage.id}
                position={[stage.lat, stage.lng]}
                icon={makeStageIcon(i + 1, STAGE_COLORS[i % STAGE_COLORS.length], false)}
                eventHandlers={{ click: () => onStageClick?.(stage.id) }}
              >
                <Tooltip direction="top" offset={[0, -18]} opacity={1} className="smt-tooltip">
                  <strong>{stage.displayName}</strong>
                  {dateRange && (
                    <span>
                      {formatShortDate(dateRange.start)} — {formatShortDate(dateRange.end)}
                    </span>
                  )}
                </Tooltip>
              </Marker>
            );
          })}

        {/* Zoomed mode: radial polylines from stage to each day */}
        {isZoomed &&
          activeStageDays.map((day) => (
            <Polyline
              key={`line-${day.id}`}
              positions={[
                [activeStage!.lat, activeStage!.lng],
                [day.lat, day.lng],
              ]}
              color="rgba(198,163,93,0.45)"
              weight={2}
              dashArray="4 4"
            />
          ))}

        {/* Zoomed mode: active stage marker (larger, gold) */}
        {isZoomed && activeStage && (
          <Marker
            position={[activeStage.lat, activeStage.lng]}
            icon={makeStageIcon(
              stages.findIndex((s) => s.id === activeStage.id) + 1,
              ACTIVE_STAGE_COLOR,
              true,
            )}
            eventHandlers={{ click: () => onStageClick?.(activeStage.id) }}
          >
            <Tooltip direction="top" offset={[0, -22]} opacity={1} className="smt-tooltip">
              <strong>{activeStage.displayName}</strong>
              <span>{activeStage.city}</span>
            </Tooltip>
          </Marker>
        )}

        {/* Zoomed mode: day markers */}
        {isZoomed &&
          activeStageDays.map((day, i) => (
            <Marker
              key={day.id}
              position={[day.lat, day.lng]}
              icon={makeDayIcon(i + 1)}
              eventHandlers={{ click: () => onDayClick?.(activeStage!.id, day) }}
            >
              <Tooltip direction="top" offset={[0, -14]} opacity={1} className="smt-tooltip">
                <strong>{day.title ?? formatShortDate(day.date)}</strong>
                <span>{formatShortDate(day.date)}</span>
              </Tooltip>
            </Marker>
          ))}

        <FitBounds positions={boundsPositions} boundsKey={boundsKey} />
      </MapContainer>
    </div>
  );
}
