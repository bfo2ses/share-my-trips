import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
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
const PENDING_COLOR = '#f2c96a';
const DRAWER_PAD_PX = 440; // right-drawer width + small margin
const EDGE_PAD_PX = 60;

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
      cursor:pointer;
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
      cursor:pointer;
    ">${n}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

const pendingIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:${PENDING_COLOR};border:2px solid #ffffff;
    box-shadow:0 0 0 6px rgba(242,201,106,0.25), 0 2px 8px rgba(0,0,0,0.5);
    pointer-events:none;
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function markerLatLng(e: L.LeafletEvent): { lat: number; lng: number } {
  const { lat, lng } = (e.target as L.Marker).getLatLng();
  return { lat, lng };
}

// FitBounds refits the map whenever `boundsKey` changes. Pass a stable key
// (e.g. the active stage id or 'all') so the map only re-centers on real
// transitions. In placement mode we add asymmetric padding so the right-side
// form drawer doesn't occlude the fit area.
function FitBounds({
  positions,
  boundsKey,
  drawerOpen,
}: {
  positions: [number, number][];
  boundsKey: string;
  drawerOpen: boolean;
}) {
  const map = useMap();
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (positions.length === 0) return;
    if (lastKey.current === boundsKey) return;
    lastKey.current = boundsKey;
    const bounds = L.latLngBounds(positions);
    map.flyToBounds(bounds, {
      paddingTopLeft: [EDGE_PAD_PX, EDGE_PAD_PX],
      paddingBottomRight: [drawerOpen ? DRAWER_PAD_PX : EDGE_PAD_PX, EDGE_PAD_PX],
      duration: 0.8,
      maxZoom: 13,
    });
  }, [map, positions, boundsKey, drawerOpen]);
  return null;
}

// Captures clicks on the map and forwards the latlng to the parent.
function MapClickCapture({ onMapClick }: { onMapClick: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Disables Leaflet's native double-click-to-zoom while the map is in placement
// mode, so double-clicks by muscle-memory don't pan/zoom the map mid-placement.
function PlacementZoomToggle({ disabled }: { disabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (disabled) map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
    return () => {
      map.doubleClickZoom.enable();
    };
  }, [map, disabled]);
  return null;
}

// Imperatively pans the map to bring a target point into view. Only acts on
// `seq` changes so passing identical targets is a no-op.
function PanInsideTarget({ target }: { target: { lat: number; lng: number; seq: number } | null }) {
  const map = useMap();
  const lastSeq = useRef<number | null>(null);
  useEffect(() => {
    if (!target) return;
    if (lastSeq.current === target.seq) return;
    lastSeq.current = target.seq;
    map.panInside([target.lat, target.lng], { padding: [EDGE_PAD_PX, EDGE_PAD_PX] });
  }, [map, target]);
  return null;
}

export type PlacementMode = 'stage' | 'day' | null;

interface TripMapProps {
  stages: Stage[];
  activeStageId?: string | null;
  activeStageDays?: Day[];
  stageDateRanges?: Record<string, { start: string; end: string }>;
  onStageClick?: (stageId: string) => void;
  onDayClick?: (stageId: string, day: Day) => void;
  // Placement (click-to-create) and drag-and-drop editing.
  placementMode?: PlacementMode;
  pendingCoords?: { lat: number; lng: number } | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  canEditMarkers?: boolean;
  onStageDragEnd?: (stage: Stage, coords: { lat: number; lng: number }, revert: () => void) => void;
  onDayDragEnd?: (day: Day, coords: { lat: number; lng: number }, revert: () => void) => void;
  /** Imperative pan target, e.g. after a successful drag to keep the marker in view. */
  panTarget?: { lat: number; lng: number; seq: number } | null;
}

export function TripMap({
  stages,
  activeStageId,
  activeStageDays = [],
  stageDateRanges = {},
  onStageClick,
  onDayClick,
  placementMode = null,
  pendingCoords = null,
  onMapClick,
  canEditMarkers = false,
  onStageDragEnd,
  onDayDragEnd,
  panTarget = null,
}: TripMapProps) {
  const activeStage = activeStageId ? stages.find((s) => s.id === activeStageId) ?? null : null;
  const isZoomed = activeStage !== null;
  const drawerOpen = placementMode !== null;

  // Shared across all marker click/drag handlers. Leaflet emits a click at the
  // end of a drag gesture on the same marker — this flag lets the click handler
  // suppress the stage/day activation so drag-to-move doesn't also open the
  // detail panel or change the active stage.
  const draggingRef = useRef(false);

  function beginDrag() {
    draggingRef.current = true;
  }

  function endDrag() {
    // Keep the flag up until after the synthetic click that follows dragend
    // has been processed in the same tick.
    setTimeout(() => {
      draggingRef.current = false;
    }, 0);
  }

  const polylinePositions = stages.map((s) => [s.lat, s.lng] as [number, number]);

  const boundsPositions: [number, number][] = isZoomed
    ? [
        [activeStage!.lat, activeStage!.lng] as [number, number],
        ...activeStageDays.map((d) => [d.lat, d.lng] as [number, number]),
      ]
    : stages.map((s) => [s.lat, s.lng] as [number, number]);

  // Include drawer state in the key so opening the form (which shrinks the
  // visible map area) triggers a re-fit with the asymmetric padding.
  const boundsKey = isZoomed
    ? `stage-${activeStageId}-${activeStageDays.length}-${drawerOpen ? 'dw' : 'nw'}`
    : `all-${drawerOpen ? 'dw' : 'nw'}`;

  const hintText =
    placementMode === 'stage'
      ? '← Cliquez sur la carte pour placer une nouvelle étape'
      : placementMode === 'day' && activeStage
      ? `← Cliquez sur la carte pour ajouter un jour à ${activeStage.displayName}`
      : null;

  return (
    <div className={`${styles.wrapper} ${placementMode ? styles.placementMode : ''}`}>
      {hintText && (
        <div className={styles.hint}>
          <span className={styles.hintDot} />
          {hintText}
        </div>
      )}

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

        <PlacementZoomToggle disabled={drawerOpen} />
        {drawerOpen && onMapClick && <MapClickCapture onMapClick={onMapClick} />}
        <PanInsideTarget target={panTarget} />

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
                draggable={canEditMarkers}
                eventHandlers={{
                  dragstart: beginDrag,
                  dragend: (e) => {
                    const coords = markerLatLng(e);
                    const marker = e.target as L.Marker;
                    const revert = () => marker.setLatLng([stage.lat, stage.lng]);
                    onStageDragEnd?.(stage, coords, revert);
                    endDrag();
                  },
                  click: () => {
                    if (draggingRef.current) return;
                    onStageClick?.(stage.id);
                  },
                }}
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
            draggable={canEditMarkers}
            eventHandlers={{
              dragstart: beginDrag,
              dragend: (e) => {
                const coords = markerLatLng(e);
                const marker = e.target as L.Marker;
                const revert = () => marker.setLatLng([activeStage.lat, activeStage.lng]);
                onStageDragEnd?.(activeStage, coords, revert);
                endDrag();
              },
              click: () => {
                if (draggingRef.current) return;
                onStageClick?.(activeStage.id);
              },
            }}
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
              draggable={canEditMarkers}
              eventHandlers={{
                dragstart: beginDrag,
                dragend: (e) => {
                  const coords = markerLatLng(e);
                  const marker = e.target as L.Marker;
                  const revert = () => marker.setLatLng([day.lat, day.lng]);
                  onDayDragEnd?.(day, coords, revert);
                  endDrag();
                },
                click: () => {
                  if (draggingRef.current) return;
                  onDayClick?.(activeStage!.id, day);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -14]} opacity={1} className="smt-tooltip">
                <strong>{day.title ?? formatShortDate(day.date)}</strong>
                <span>{formatShortDate(day.date)}</span>
              </Tooltip>
            </Marker>
          ))}

        {/* Pending coords marker while a CREATE placement form is open. */}
        {pendingCoords && (
          <Marker
            position={[pendingCoords.lat, pendingCoords.lng]}
            icon={pendingIcon}
            interactive={false}
          />
        )}

        <FitBounds positions={boundsPositions} boundsKey={boundsKey} drawerOpen={drawerOpen} />
      </MapContainer>
    </div>
  );
}
