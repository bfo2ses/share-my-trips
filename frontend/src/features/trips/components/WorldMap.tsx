import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { Trip } from '../mockData';
import styles from './WorldMap.module.css';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface WorldMapProps {
  trips: Trip[];
}

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return `${new Date(start).toLocaleDateString('fr-FR', opts)} — ${new Date(end).toLocaleDateString('fr-FR', opts)}`;
}

export function WorldMap({ trips }: WorldMapProps) {
  const [selected, setSelected] = useState<Trip | null>(null);
  const navigate = useNavigate();

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

        {trips.map((trip) => (
          <Marker
            key={trip.id}
            coordinates={trip.coordinates}
            onClick={() => setSelected(selected?.id === trip.id ? null : trip)}
          >
            <circle
              r={selected?.id === trip.id ? 16 : 10}
              fill={trip.coverColor}
              fillOpacity={0.25}
              className={styles.markerPulse}
            />
            <circle
              r={selected?.id === trip.id ? 7 : 5}
              fill={trip.coverColor}
              stroke="#ffffff"
              strokeWidth={1.5}
              className={styles.markerDot}
              style={{ cursor: 'pointer' }}
            />
          </Marker>
        ))}
      </ComposableMap>

      <div className={styles.counter}>
        <span className={styles.counterNumber}>{trips.length}</span>
        <span className={styles.counterLabel}>
          {trips.length === 1 ? 'voyage' : 'voyages'}
        </span>
      </div>

      {selected && (
        <div className={styles.popup} key={selected.id}>
          <button
            className={styles.popupClose}
            onClick={() => setSelected(null)}
            aria-label="Fermer"
          >
            ✕
          </button>
          <div
            className={styles.popupCover}
            style={{ background: `linear-gradient(160deg, ${selected.coverColor}cc, ${selected.coverColor})` }}
          >
            <span className={styles.popupCountry}>{selected.country}</span>
          </div>
          <div className={styles.popupBody}>
            <h3 className={styles.popupTitle}>{selected.title}</h3>
            <p className={styles.popupDates}>
              {formatDateRange(selected.startDate, selected.endDate)}
            </p>
            <a href={`/trips/${selected.id}`} className={styles.popupLink} onClick={(e) => { e.preventDefault(); navigate(`/trips/${selected.id}`); }}>
              Voir le voyage →
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
