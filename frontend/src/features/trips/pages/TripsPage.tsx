import { useState } from 'react';
import { useTrips } from '../hooks/useTrips';
import { useMe } from '../../auth/hooks/useMe';
import { WorldMap } from '../components/WorldMap';
import { TripsDrawer } from '../components/TripsDrawer';
import { TripForm } from '../components/TripForm';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import styles from './TripsPage.module.css';

type TripSummary = TripsQuery['trips'][number];

export function TripsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripSummary | null>(null);

  const { data: meData } = useMe();
  const isAdmin = meData?.me?.role === 'ADMIN';

  const { data, fetching, error } = useTrips(isAdmin ? undefined : ['PUBLISHED', 'CLOSED']);

  const trips = data?.trips ?? [];

  function handleEdit(trip: TripSummary) {
    setEditingTrip(trip);
    setFormOpen(true);
  }

  function handleCreate() {
    setEditingTrip(null);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditingTrip(null);
  }

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

      {isAdmin && (
        <button
          className={styles.createButton}
          onClick={handleCreate}
          aria-label="Créer un voyage"
        >
          +
        </button>
      )}

      <TripsDrawer
        trips={trips}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isAdmin={isAdmin}
        onEdit={handleEdit}
        onCreate={handleCreate}
      />

      {isAdmin && (
        <TripForm
          open={formOpen}
          onClose={handleFormClose}
          trip={editingTrip}
        />
      )}
    </main>
  );
}
