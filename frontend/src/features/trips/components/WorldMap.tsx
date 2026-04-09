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

function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '';
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return `${new Date(start).toLocaleDateString('fr-FR', opts)} — ${new Date(end).toLocaleDateString('fr-FR', opts)}`;
}

interface WorldMapProps {
  trips: TripSummary[];
}

export function WorldMap({ trips }: WorldMapProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryGroup | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripSummary | null>(null);
  const navigate = useNavigate();

  const countryGroups: CountryGroup[] = [];
  const seen = new Set<string>();

  for (const trip of trips) {
    if (seen.has(trip.country)) {
      const group = countryGroups.find((g) => g.country === trip.country);
      group?.trips.push(trip);
    } else {
      const coords = getCountryCoords(trip.country);
      if (coords) {
        countryGroups.push({
          country: trip.country,
          coords,
          trips: [trip],
          color: tripColor(trip.id),
        });
        seen.add(trip.country);
      }
    }
  }

  function handleMarkerClick(group: CountryGroup) {
    if (selectedCountry?.country === group.country) {
      setSelectedCountry(null);
      setSelectedTrip(null);
    } else {
      setSelectedCountry(group);
      setSelectedTrip(group.trips.length === 1 ? group.trips[0] : null);
    }
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
                  hover: { outline: 'none', fill: 'rgba(255,255,255,0.09)' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {countryGroups.map((group) => {
          const isActive = selectedCountry?.country === group.country;
          return (
            <Marker
              key={group.country}
              coordinates={group.coords}
              onClick={() => handleMarkerClick(group)}
            >
              <circle
                r={isActive ? 16 : 10}
                fill={group.color}
                fillOpacity={0.25}
                className={styles.markerPulse}
              />
              <circle
                r={isActive ? 7 : 5}
                fill={group.color}
                stroke="#ffffff"
                strokeWidth={1.5}
                className={styles.markerDot}
                style={{ cursor: 'pointer' }}
              />
            </Marker>
          );
        })}
      </ComposableMap>

      <div className={styles.counter}>
        <span className={styles.counterNumber}>{trips.length}</span>
        <span className={styles.counterLabel}>
          {trips.length === 1 ? 'voyage' : 'voyages'}
        </span>
      </div>

      {selectedCountry && (
        <div className={styles.popup} key={selectedCountry.country}>
          <button
            className={styles.popupClose}
            onClick={() => { setSelectedCountry(null); setSelectedTrip(null); }}
            aria-label="Fermer"
          >
            ✕
          </button>

          {/* Plusieurs voyages dans ce pays → liste */}
          {!selectedTrip && selectedCountry.trips.length > 1 && (
            <>
              <div
                className={styles.popupCover}
                style={{ background: `linear-gradient(160deg, ${selectedCountry.color}cc, ${selectedCountry.color})` }}
              >
                <span className={styles.popupCountry}>{selectedCountry.country}</span>
                <span className={styles.popupCount}>{selectedCountry.trips.length} voyages</span>
              </div>
              <div className={styles.popupTripList}>
                {selectedCountry.trips.map((t) => (
                  <button
                    key={t.id}
                    className={styles.popupTripItem}
                    onClick={() => setSelectedTrip(t)}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Un seul voyage ou voyage sélectionné dans la liste */}
          {selectedTrip && (
            <>
              {selectedCountry.trips.length > 1 && (
                <button className={styles.popupBack} onClick={() => setSelectedTrip(null)}>
                  ← {selectedCountry.country}
                </button>
              )}
              <div
                className={styles.popupCover}
                style={{ background: `linear-gradient(160deg, ${tripColor(selectedTrip.id)}cc, ${tripColor(selectedTrip.id)})` }}
              >
                <span className={styles.popupCountry}>{selectedTrip.country}</span>
              </div>
              <div className={styles.popupBody}>
                <h3 className={styles.popupTitle}>{selectedTrip.title}</h3>
                <p className={styles.popupDates}>
                  {formatDateRange(selectedTrip.startDate, selectedTrip.endDate)}
                </p>
                <a
                  href={`/trips/${selectedTrip.id}`}
                  className={styles.popupLink}
                  onClick={(e) => { e.preventDefault(); navigate(`/trips/${selectedTrip.id}`); }}
                >
                  Voir le voyage →
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
