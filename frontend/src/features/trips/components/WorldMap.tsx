import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { getCountryCoords } from '../utils/countryCoords';
import { tripColor } from '../utils/tripColor';
import styles from './WorldMap.module.css';

type TripSummary = TripsQuery['trips'][number];

interface CountryGroup {
  country: string;
  coords: [number, number];
  trips: TripSummary[];
  color: string;
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface WorldMapProps {
  trips: TripSummary[];
}

export function WorldMap({ trips }: WorldMapProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryGroup | null>(null);
  const navigate = useNavigate();

  const countryGroups: CountryGroup[] = [];
  const seen = new Set<string>();

  for (const trip of trips) {
    if (seen.has(trip.country)) {
      countryGroups.find((g) => g.country === trip.country)?.trips.push(trip);
    } else {
      const coords = getCountryCoords(trip.country);
      if (coords) {
        countryGroups.push({ country: trip.country, coords, trips: [trip], color: tripColor(trip.id) });
        seen.add(trip.country);
      }
    }
  }

  function goToTrip(tripId: string) {
    navigate(`/trips/${tripId}`, { viewTransition: true });
  }

  function handleMarkerClick(group: CountryGroup) {
    if (group.trips.length === 1) {
      goToTrip(group.trips[0].id);
      return;
    }
    setSelectedCountry(selectedCountry?.country === group.country ? null : group);
  }

  return (
    <section className={styles.section}>
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 185 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(255,255,255,0.055)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover:   { outline: 'none', fill: 'rgba(255,255,255,0.09)' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {countryGroups.map((group) => {
          const isActive = selectedCountry?.country === group.country;
          return (
            <Marker key={group.country} coordinates={group.coords} onClick={() => handleMarkerClick(group)}>
              <circle r={isActive ? 16 : 10} fill={group.color} fillOpacity={0.25} className={styles.markerPulse} />
              <circle r={isActive ? 7 : 5} fill={group.color} stroke="#ffffff" strokeWidth={1.5} className={styles.markerDot} style={{ cursor: 'pointer' }} />
            </Marker>
          );
        })}
      </ComposableMap>

      <div className={styles.counter}>
        <span className={styles.counterNumber}>{trips.length}</span>
        <span className={styles.counterLabel}>{trips.length === 1 ? 'voyage' : 'voyages'}</span>
      </div>

      {selectedCountry && (
        <div className={styles.popup} key={selectedCountry.country}>
          <div className={styles.popupHeader}>
            <span className={styles.popupCountry}>{selectedCountry.country}</span>
            <button
              className={styles.popupClose}
              onClick={() => setSelectedCountry(null)}
              aria-label="Fermer"
            >✕</button>
          </div>
          <div className={styles.popupTripList}>
            {selectedCountry.trips.map((t) => (
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
