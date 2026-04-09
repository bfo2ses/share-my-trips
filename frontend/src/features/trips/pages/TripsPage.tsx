import { useState } from 'react';
import { MOCK_TRIPS } from '../mockData';
import { WorldMap } from '../components/WorldMap';
import { TripsDrawer } from '../components/TripsDrawer';
import styles from './TripsPage.module.css';

const visibleTrips = MOCK_TRIPS
  .filter((t) => t.status !== 'draft')
  .sort((a, b) => b.startDate.localeCompare(a.startDate));

export function TripsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main className={styles.page}>
      <WorldMap trips={visibleTrips} />

      <button
        className={styles.listButton}
        onClick={() => setDrawerOpen(true)}
        aria-label="Afficher la liste des voyages"
      >
        <span className={styles.listButtonIcon}>≡</span>
        <span>Voyages</span>
      </button>

      <TripsDrawer
        trips={visibleTrips}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </main>
  );
}
