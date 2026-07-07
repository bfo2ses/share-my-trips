import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import { useMe } from '../../auth/hooks/useMe';
import { isMobileViewport } from '../../../lib/viewport';
import { useEditMode } from '../../../components/EditMode/useEditMode';
import { useTripMedia } from '../../media/hooks/useMediaQueries';
import { usePublishTrip, useUnpublishTrip, useDeleteTrip, useReopenTrip, useCloseTrip } from '../hooks/useTripMutations';
import { useTripCloseData } from '../hooks/useTripCloseData';
import { WorldMap } from '../components/WorldMap';
import { TripCard } from '../components/TripCard';
import { TripForm, type FormAction } from '../components/TripForm';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [, publishTrip] = usePublishTrip();
  const [, unpublishTrip] = useUnpublishTrip();
  const [, reopenTrip] = useReopenTrip();
  const [, closeTrip] = useCloseTrip();
  const [, deleteTrip] = useDeleteTrip();

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

  // Version fraîche du voyage édité : après un changement de statut, la liste
  // refetchée porte le nouveau statut alors que le state editingTrip est figé.
  const liveEditingTrip = editingTrip ? trips.find((t) => t.id === editingTrip.id) ?? editingTrip : null;

  const refetchContext = { additionalTypenames: ['Trip'] };

  // Données nécessaires à « Clôturer » (chaque étape doit porter au moins un
  // jour ; les dates de clôture = bornes des jours). Chargées uniquement pour
  // un voyage publié en cours d'édition ; filtrées par tripID (data urql
  // conservée en pause/refetch).
  const [{ data: closeData }] = useTripCloseData(
    isAdmin && liveEditingTrip?.status === 'PUBLISHED' ? liveEditingTrip.id : null,
  );
  const closeStages = (closeData?.stages ?? []).filter((s) => s.tripID === liveEditingTrip?.id);
  const closeDays = (closeData?.tripDays ?? []).filter((d) => d.tripID === liveEditingTrip?.id);
  const canCloseTrip =
    closeStages.length > 0 &&
    closeStages.every((s) => closeDays.some((d) => d.stageIDs[0] === s.id));

  async function handleCloseTrip() {
    if (!liveEditingTrip || closeDays.length === 0) return;
    const dates = closeDays.map((d) => d.date).sort();
    await closeTrip(
      { id: liveEditingTrip.id, input: { firstDay: dates[0], lastDay: dates[dates.length - 1] } },
      refetchContext,
    );
  }

  async function handleDelete() {
    if (!liveEditingTrip || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteTrip({ id: liveEditingTrip.id }, refetchContext);
    setDeleting(false);
    if (result.error || !result.data?.deleteTrip.success) {
      setDeleteError('Impossible de supprimer le voyage. Réessayez.');
      return;
    }
    setConfirmDelete(false);
    handleFormClose();
  }

  // Mêmes actions de cycle de vie que le formulaire de la page voyage —
  // Clôturer reste sur la page voyage (elle exige les dates des jours).
  const tripFormActions: FormAction[] = liveEditingTrip
    ? [
        ...(liveEditingTrip.status === 'DRAFT'
          ? [{ label: 'Publier le voyage', onClick: () => publishTrip({ id: liveEditingTrip.id }, refetchContext) }]
          : []),
        ...(liveEditingTrip.status === 'PUBLISHED'
          ? [{ label: 'Repasser en brouillon', onClick: () => unpublishTrip({ id: liveEditingTrip.id }, refetchContext) }]
          : []),
        ...(liveEditingTrip.status === 'PUBLISHED' && canCloseTrip
          ? [{ label: 'Clôturer le voyage', onClick: handleCloseTrip }]
          : []),
        ...(liveEditingTrip.status === 'CLOSED'
          ? [{ label: 'Réouvrir le voyage', onClick: () => reopenTrip({ id: liveEditingTrip.id }, refetchContext) }]
          : []),
        { label: 'Supprimer le voyage', onClick: () => setConfirmDelete(true), danger: true },
      ]
    : [];

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
        <>
        <TripForm
          open={formOpen}
          onClose={handleFormClose}
          trip={liveEditingTrip}
          pendingCoords={pendingCoords}
          coverChoices={coverChoices}
          actions={tripFormActions}
          noBackdrop
        />
        <ConfirmModal
          open={confirmDelete}
          title="Supprimer ce voyage ?"
          message={deleteError ?? 'Toutes les étapes et tous les jours associés seront définitivement perdus.'}
          confirmLabel="Supprimer"
          danger
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => { setConfirmDelete(false); setDeleteError(null); }}
        />
        </>
      )}
    </main>
  );
}
