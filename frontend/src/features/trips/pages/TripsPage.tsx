import { useState } from 'react';
import { useTrips } from '../hooks/useTrips';
import { WorldMap } from '../components/WorldMap';
import { TripsDrawer } from '../components/TripsDrawer';
import styles from './TripsPage.module.css';

export function TripsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data, fetching, error } = useTrips(['PUBLISHED', 'CLOSED']);

  const trips = data?.trips ?? [];

  if (error) {
    return (
      <main className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Impossible de charger les voyages.</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {!fetching && <WorldMap trips={trips} />}

      <button
        className={styles.listButton}
        onClick={() => setDrawerOpen(true)}
        aria-label="Afficher la liste des voyages"
      >
        <span className={styles.listButtonIcon}>≡</span>
        <span>Voyages</span>
      </button>

      <TripsDrawer
        trips={trips}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </main>
  );
}
