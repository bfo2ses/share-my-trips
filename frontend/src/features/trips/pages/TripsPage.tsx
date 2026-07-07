import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import { useMe } from '../../auth/hooks/useMe';
import { isMobileViewport } from '../../../lib/viewport';
import { useEditMode } from '../../../components/EditMode/useEditMode';
import { useTripMedia } from '../../media/hooks/useMediaQueries';
import { WorldMap } from '../components/WorldMap';
import { TripCard } from '../components/TripCard';
import { TripForm } from '../components/TripForm';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import styles from './TripsPage.module.css';

type TripSummary = TripsQuery['trips'][number];

export function TripsPage() {
  const navigate = useNavigate();
  // On mobile the list is the primary entry point — the world map markers are
  // too small to be a mandatory tap path.
  const [panelOpen, setPanelOpen] = useState(isMobileViewport);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripSummary | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { data: meData } = useMe();
  const role = meData?.me?.role;
  const hasEditRole = role === 'ADMIN' || role === 'EDITOR';
  const { editMode } = useEditMode();
  const isAdmin = hasEditRole && editMode;

  const { data, fetching, error } = useTrips(hasEditRole ? undefined : ['PUBLISHED', 'CLOSED']);

  // Photos de l'album du voyage en cours d'édition, proposées comme cover.
  // Filtre par tripID indispensable : urql conserve la data du voyage
  // précédent quand la query est en pause ou en cours de refetch.
  const [{ data: tripMediaData }] = useTripMedia(isAdmin ? editingTrip?.id : null);
  const coverChoices = (tripMediaData?.tripMedia ?? [])
    .filter((m) => m.tripID === editingTrip?.id && m.contentType.startsWith('image/'))
    .map((m) => ({ id: m.id, thumbUrl: m.thumbUrl }));

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
    // En lecture sur mobile, la liste EST la page (carte monde et toggle
    // masqués) ; la carte ne réapparaît qu'en mode édition, pour le placement
    // d'un voyage au clic. Desktop inchangé.
    <main className={`${styles.page} ${panelOpen ? styles.panelOpen : ''} ${!isAdmin ? styles.listOnly : ''}`}>
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
          coverChoices={coverChoices}
          noBackdrop
        />
      )}
    </main>
  );
}
