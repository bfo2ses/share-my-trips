import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import { useMe } from '../../auth/hooks/useMe';
import { useEditMode } from '../../../components/EditMode/useEditMode';
import { WorldMap } from '../components/WorldMap';
import { TripCard } from '../components/TripCard';
import { TripForm } from '../components/TripForm';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import styles from './TripsPage.module.css';

type TripSummary = TripsQuery['trips'][number];

export function TripsPage() {
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripSummary | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { data: meData } = useMe();
  const role = meData?.me?.role;
  const hasEditRole = role === 'ADMIN' || role === 'EDITOR';
  const { editMode } = useEditMode();
  const isAdmin = hasEditRole && editMode;

  const { data, fetching, error } = useTrips(hasEditRole ? undefined : ['PUBLISHED', 'CLOSED']);

  const trips = data?.trips ?? [];

  function handleEdit(trip: TripSummary) {
    setEditingTrip(trip);
    setPendingCoords(trip.lat != null && trip.lng != null ? { lat: trip.lat, lng: trip.lng } : null);
    setFormOpen(true);
  }

  function handleCardClick(trip: TripSummary) {
    if (isAdmin) {
      handleEdit(trip);
    } else {
      navigate(`/trips/${trip.id}`, { viewTransition: true });
    }
  }

  function handleCreate() {
    setEditingTrip(null);
    setPendingCoords(null);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditingTrip(null);
    setPendingCoords(null);
  }

  function handleMapClick(coords: { lat: number; lng: number }) {
    setPendingCoords(coords);
    if (!formOpen) {
      setEditingTrip(null);
      setFormOpen(true);
    }
  }

  if (error) {
    return (
      <main className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Impossible de charger les voyages.</p>
      </main>
    );
  }

  return (
    <main className={`${styles.page} ${panelOpen ? styles.panelOpen : ''}`}>
      {/* ── Panel gauche ── */}
      <aside className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Tous les voyages</span>
          <div className={styles.panelActions}>
            {isAdmin && (
              <button className={styles.addBtn} onClick={handleCreate} aria-label="Créer un voyage">
                +
              </button>
            )}
            <button className={styles.closeBtn} onClick={() => setPanelOpen(false)} aria-label="Fermer">
              ✕
            </button>
          </div>
        </div>
        <div className={styles.list}>
          {trips.map((trip, index) => (
            <TripCard
              key={trip.id}
              trip={trip}
              index={index}
              isAdmin={isAdmin}
              onEdit={handleCardClick}
            />
          ))}
          {trips.length === 0 && (
            <p className={styles.empty}>Aucun voyage pour le moment.</p>
          )}
        </div>
      </aside>

      {/* ── Carte ── */}
      <div className={styles.mapArea}>
        {!fetching && (
          <WorldMap
            trips={trips}
            placementMode={isAdmin}
            pendingCoords={formOpen ? pendingCoords : null}
            onMapClick={isAdmin ? handleMapClick : undefined}
          />
        )}
      </div>

      {/* ── Bouton toggle ── */}
      <button
        className={styles.listButton}
        onClick={() => setPanelOpen(!panelOpen)}
        aria-label="Afficher la liste des voyages"
      >
        <span className={styles.listButtonIcon}>≡</span>
        <span>Voyages</span>
      </button>

      {/* ── Formulaire (drawer) ── */}
      {isAdmin && (
        <TripForm
          open={formOpen}
          onClose={handleFormClose}
          trip={editingTrip}
          pendingCoords={pendingCoords}
          noBackdrop
        />
      )}
    </main>
  );
}
