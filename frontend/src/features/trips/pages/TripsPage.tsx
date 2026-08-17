import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import { useMe } from '../../auth/hooks/useMe';
import { useEditMode } from '../../../components/EditMode/useEditMode';
import { useTripMedia } from '../../media/hooks/useMediaQueries';
import { usePublishTrip, useUnpublishTrip, useDeleteTrip, useReopenTrip, useCloseTrip } from '../hooks/useTripMutations';
import { useTripCloseData } from '../hooks/useTripCloseData';
import { TripTimeline } from '../components/TripTimeline';
import { TripPanel, type SheetSnap } from '../components/TripPanel';
import { TripForm, type TripFormAction } from '../components/TripForm';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { payloadErrors } from '../utils/payloadErrors';
import styles from './TripsPage.module.css';

type TripSummary = TripsQuery['trips'][number];

const TravelGlobe = lazy(() => import('../components/TravelGlobe').then(({ TravelGlobe: Globe }) => ({ default: Globe })));

export function TripsPage() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripSummary | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [placementPreviewCoords, setPlacementPreviewCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [focusTrip, setFocusTrip] = useState<TripSummary | null>(null);
  const [repositioning, setRepositioning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('half');

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
  const trips = data?.trips ?? [];
  const datedTrips = trips
    .filter((trip) => trip.startDate)
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
  const undatedTrips = trips.filter((trip) => !trip.startDate);

  // Photos de l'album du voyage en cours d'édition, proposées comme cover.
  // Filtre par tripID indispensable : urql conserve la data du voyage
  // précédent quand la query est en pause ou en cours de refetch.
  const [{ data: tripMediaData }] = useTripMedia(isAdmin ? editingTrip?.id : null);
  const coverChoices = (tripMediaData?.tripMedia ?? [])
    .filter((media) => media.tripID === editingTrip?.id && media.contentType.startsWith('image/'))
    .map((media) => ({ id: media.id, thumbUrl: media.thumbUrl }));

  // Version fraîche du voyage édité : après un changement de statut, la liste
  // refetchée porte le nouveau statut alors que le state editingTrip est figé.
  const liveEditingTrip = editingTrip ? trips.find((trip) => trip.id === editingTrip.id) ?? editingTrip : null;

  const refetchContext = { additionalTypenames: ['Trip'] };

  // Données nécessaires à « Clôturer » (chaque étape doit porter au moins une
  // visite ; les dates de clôture = bornes des visites). Chargées uniquement
  // pour un voyage publié en cours d'édition ; filtrées par tripID.
  const [{ data: closeData }] = useTripCloseData(
    isAdmin && liveEditingTrip?.status === 'PUBLISHED' ? liveEditingTrip.id : null,
  );
  const closeStages = (closeData?.stages ?? []).filter((stage) => stage.tripID === liveEditingTrip?.id);
  const closeVisits = (closeData?.tripVisits ?? []).filter((visit) => visit.tripID === liveEditingTrip?.id);
  const canCloseTrip =
    closeStages.length > 0 &&
    closeStages.every((stage) => closeVisits.some((visit) => visit.stageIDs[0] === stage.id));

  async function handleCloseTrip(): Promise<string[] | void> {
    if (!liveEditingTrip || closeVisits.length === 0) return ['Impossible de clôturer ce voyage sans visite.'];
    const dates = closeVisits.map((visit) => visit.date).sort();
    const result = await closeTrip(
      { id: liveEditingTrip.id, input: { firstVisitDate: dates[0], lastVisitDate: dates[dates.length - 1] } },
      refetchContext,
    );
    return payloadErrors(result, result.data?.closeTrip.errors);
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

  async function handlePublish(): Promise<string[] | void> {
    if (!liveEditingTrip) return;
    const result = await publishTrip({ id: liveEditingTrip.id }, refetchContext);
    return payloadErrors(result, result.data?.publishTrip.errors);
  }

  async function handleUnpublish(): Promise<string[] | void> {
    if (!liveEditingTrip) return;
    const result = await unpublishTrip({ id: liveEditingTrip.id }, refetchContext);
    return payloadErrors(result, result.data?.unpublishTrip.errors);
  }

  async function handleReopen(): Promise<string[] | void> {
    if (!liveEditingTrip) return;
    const result = await reopenTrip({ id: liveEditingTrip.id }, refetchContext);
    return payloadErrors(result, result.data?.reopenTrip.errors);
  }

  const tripFormActions: TripFormAction[] = liveEditingTrip
    ? [
        ...(liveEditingTrip.status === 'DRAFT'
          ? [{ label: 'Publier le voyage', onClick: handlePublish }]
          : []),
        ...(liveEditingTrip.status === 'PUBLISHED'
          ? [{ label: 'Repasser en brouillon', onClick: handleUnpublish }]
          : []),
        ...(liveEditingTrip.status === 'PUBLISHED' && canCloseTrip
          ? [{ label: 'Clôturer le voyage', onClick: handleCloseTrip }]
          : []),
        ...(liveEditingTrip.status === 'CLOSED'
          ? [{ label: 'Réouvrir le voyage', onClick: handleReopen }]
          : []),
        { label: 'Supprimer le voyage', onClick: () => setConfirmDelete(true), danger: true },
      ]
    : [];

  function handleEdit(trip: TripSummary) {
    setEditingTrip(trip);
    setPendingCoords({ lat: trip.lat, lng: trip.lng });
    setPlacementPreviewCoords(null);
    setRepositioning(false);
    setFormOpen(true);
  }

  function handleTripSelect(trip: TripSummary) {
    if (isAdmin) {
      handleEdit(trip);
    } else {
      navigate(`/trips/${trip.id}`, { viewTransition: true });
    }
  }

  function handleTimelineTripSelect(trip: TripSummary) {
    if (isAdmin) {
      handleEdit(trip);
      return;
    }
    setFocusTrip(trip);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditingTrip(null);
    setPendingCoords(null);
    setPlacementPreviewCoords(null);
    setRepositioning(false);
  }

  function handleLocationSelect(coords: { lat: number; lng: number }) {
    if (repositioning && editingTrip) {
      setPendingCoords(coords);
      setPlacementPreviewCoords(coords);
      setRepositioning(false);
      return;
    }

    if (editingTrip) return;

    setEditingTrip(null);
    setPendingCoords(coords);
    setPlacementPreviewCoords(coords);
    setFormOpen(true);
  }

  function handleReposition() {
    if (!editingTrip) return;
    setPlacementPreviewCoords(null);
    setRepositioning(true);
  }

  if (error) {
    return (
      <main className={`${styles.page} ${styles.singleColumn}`}>
        <section className={styles.globeArea}>
          <p className={styles.message} role="alert">Impossible de charger les voyages.</p>
        </section>
      </main>
    );
  }

  if (fetching && !data) {
    return (
      <main className={styles.page}>
        <section className={styles.globeArea}>
          <div className={styles.loadingGlobe} aria-hidden="true" />
          <p className={styles.loadingMessage}>Chargement des voyages…</p>
        </section>
        <TripPanel
          level={0}
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          allowPeek={false}
          className={styles.homePanel}
          timeline={<div className={styles.timelineSkeleton} aria-hidden="true" />}
          visitDetail={null}
        />
      </main>
    );
  }

  return (
    <main className={`${styles.page} ${isAdmin && formOpen ? styles.formPanelOpen : ''}`}>
      <section className={styles.globeArea} aria-label="Globe des voyages">
        {repositioning && (
          <p className={styles.placementHint}>Cliquez sur le globe pour choisir le nouvel emplacement.</p>
        )}
        <div className={styles.globeFrame}>
          <Suspense fallback={<div className={styles.globeFallback} role="status">Chargement du globe…</div>}>
            <TravelGlobe
              trips={trips}
              onTripSelect={(trip) => { if (!repositioning) handleTripSelect(trip); }}
              focusTripId={focusTrip?.id}
              onFocusComplete={(trip) => {
                setFocusTrip(null);
                handleTripSelect(trip);
              }}
              onFocusCancel={() => setFocusTrip(null)}
              pendingCoords={placementPreviewCoords ?? (!editingTrip ? pendingCoords : null)}
              onLocationSelect={isAdmin ? handleLocationSelect : undefined}
            />
          </Suspense>
        </div>
      </section>

      <TripPanel
        level={0}
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
        allowPeek={false}
        className={styles.homePanel}
        hiddenOnMobile={isAdmin && formOpen}
        timeline={(
          <TripTimeline
            datedTrips={datedTrips}
            undatedTrips={undatedTrips}
            isAdmin={isAdmin}
            onTripSelect={handleTimelineTripSelect}
          />
        )}
        visitDetail={null}
      />

      {isAdmin && (
        <>
          {formOpen && (
            <div className={styles.formPanelWrapper}>
              <TripForm
                open
                panel
                onClose={handleFormClose}
                trip={liveEditingTrip}
                pendingCoords={pendingCoords}
                coverChoices={coverChoices}
                actions={tripFormActions}
                onReposition={handleReposition}
              />
            </div>
          )}
          <ConfirmModal
            open={confirmDelete}
            title="Supprimer ce voyage ?"
            message={deleteError ?? 'Toutes les étapes et toutes les visites associées seront définitivement perdues.'}
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
