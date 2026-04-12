import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { getCountryCoords } from '../utils/countryCoords';
import { tripColor } from '../utils/tripColor';
import styles from './WorldMap.module.css';

// react-simple-maps exports MapContext but it's not in @types/react-simple-maps
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rsm: any = await import('react-simple-maps');
const MapContext: React.Context<{ projection: any; width: number; height: number }> = rsm.MapContext;

type TripSummary = TripsQuery['trips'][number];

interface TripMarker {
  id: string;
  coords: [number, number];
  trip: TripSummary;
  color: string;
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const topology = await fetch(GEO_URL).then((r) => r.json());
const MAP_SCALE = 185;

interface WorldMapProps {
  trips: TripSummary[];
  placementMode?: boolean;
  pendingCoords?: { lat: number; lng: number } | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

export function WorldMap({ trips, placementMode, pendingCoords, onMapClick }: WorldMapProps) {
  const [selectedTrips, setSelectedTrips] = useState<{ country: string; trips: TripSummary[]; color: string } | null>(null);
  const navigate = useNavigate();

  const markers: TripMarker[] = [];
  for (const trip of trips) {
    if (trip.lat != null && trip.lng != null) {
      markers.push({ id: trip.id, coords: [trip.lng, trip.lat], trip, color: tripColor(trip.id) });
    } else {
      const coords = getCountryCoords(trip.country);
      if (coords) {
        markers.push({ id: trip.id, coords, trip, color: tripColor(trip.id) });
      }
    }
  }

  const groups = new Map<string, TripMarker[]>();
  for (const m of markers) {
    const key = `${m.coords[0].toFixed(1)},${m.coords[1].toFixed(1)}`;
    const existing = groups.get(key);
    if (existing) { existing.push(m); } else { groups.set(key, [m]); }
  }

  function goToTrip(tripId: string) {
    navigate(`/trips/${tripId}`, { viewTransition: true });
  }

  function handleMarkerClick(group: TripMarker[]) {
    if (group.length === 1) { goToTrip(group[0].id); return; }
    const country = group[0].trip.country;
    setSelectedTrips(selectedTrips?.country === country ? null : { country, trips: group.map((m) => m.trip), color: group[0].color });
  }

  return (
    <section className={`${styles.section} ${placementMode ? styles.placementMode : ''}`}>
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: MAP_SCALE }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={topology}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(255,255,255,0.055)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none', cursor: placementMode ? 'crosshair' : 'default' },
                  hover: { outline: 'none', fill: placementMode ? 'rgba(198,163,93,0.12)' : 'rgba(255,255,255,0.09)', cursor: placementMode ? 'crosshair' : 'default' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {placementMode && onMapClick && <MapClickCapture onMapClick={onMapClick} />}

        {[...groups.values()].map((group) => {
          const first = group[0];
          const isActive = selectedTrips?.country === first.trip.country;
          return (
            <Marker key={first.id} coordinates={first.coords} onClick={() => handleMarkerClick(group)}>
              <circle r={isActive ? 16 : 10} fill={first.color} fillOpacity={0.25} className={styles.markerPulse} />
              <circle r={isActive ? 7 : 5} fill={first.color} stroke="#ffffff" strokeWidth={1.5} className={styles.markerDot} style={{ cursor: 'pointer' }} />
              {group.length > 1 && (
                <text textAnchor="middle" y={-14} fill={first.color} fontSize={10} fontWeight={600}>
                  {group.length}
                </text>
              )}
            </Marker>
          );
        })}

        {pendingCoords && (
          <Marker coordinates={[pendingCoords.lng, pendingCoords.lat]}>
            <circle r={8} fill="#c6a35d" fillOpacity={0.3} />
            <circle r={4} fill="#c6a35d" stroke="#ffffff" strokeWidth={1.5} />
          </Marker>
        )}
      </ComposableMap>

      <div className={styles.counter}>
        <span className={styles.counterNumber}>{trips.length}</span>
        <span className={styles.counterLabel}>{trips.length === 1 ? 'voyage' : 'voyages'}</span>
      </div>

      {selectedTrips && (
        <div className={styles.popup} key={selectedTrips.country}>
          <div className={styles.popupHeader}>
            <span className={styles.popupCountry}>{selectedTrips.country}</span>
            <button className={styles.popupClose} onClick={() => setSelectedTrips(null)} aria-label="Fermer">✕</button>
          </div>
          <div className={styles.popupTripList}>
            {selectedTrips.trips.map((t) => (
              <button key={t.id} className={styles.popupTripItem} onClick={() => goToTrip(t.id)}>
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Transparent rect overlay that captures clicks anywhere on the map
 * and converts screen coordinates to geo coordinates via the projection.
 */
function MapClickCapture({ onMapClick }: { onMapClick: (coords: { lat: number; lng: number }) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { projection } = useContext<any>(MapContext);

  function handleClick(e: React.MouseEvent<SVGRectElement>) {
    const svg = e.currentTarget.ownerSVGElement as SVGSVGElement | null;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());

    const geo = projection.invert([svgPt.x, svgPt.y]);
    if (geo) {
      onMapClick({ lat: geo[1], lng: geo[0] });
    }
  }

  return (
    <rect
      x="0" y="0" width="9999" height="9999"
      fill="transparent"
      style={{ cursor: 'crosshair' }}
      onClick={handleClick}
    />
  );
}
