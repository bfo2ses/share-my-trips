import { useState, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTripDetail } from '../hooks/useTripDetail';
import { useTripMedia } from '../../media/hooks/useMediaQueries';
import { useMe } from '../../auth/hooks/useMe';
import { useEditMode } from '../../../components/EditMode/useEditMode';
import { usePublishTrip, useUnpublishTrip, useDeleteTrip, useReopenTrip, useCloseTrip } from '../hooks/useTripMutations';
import { useUpdateStage, useDeleteStage } from '../../stages/hooks/useStageMutations';
import { useUpdateDay, useDeleteDay } from '../../stages/hooks/useDayMutations';
import { TripMap, type PlacementMode } from '../components/TripMap';
import { TripForm, type FormAction } from '../components/TripForm';
import { TripPanel, type SheetSnap } from '../components/TripPanel';
import { DayDetail } from '../components/DayDetail';
import { StageForm } from '../../stages/components/StageForm';
import { DayForm } from '../../stages/components/DayForm';
import { ActionMenu, type ActionMenuItem } from '../../../components/ActionMenu/ActionMenu';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import { tripColor } from '../utils/tripColor';
import type { TripDetailQuery } from '../../../graphql/generated/graphql';
import styles from './TripDetailPage.module.css';

type Stage = TripDetailQuery['stages'][number];
type Day = TripDetailQuery['tripDays'][number];
type StageDateRangeMap = Record<string, { start: string; end: string }>;
type PanTarget = { lat: number; lng: number; seq: number } | null;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return '';
  return `${formatDate(start)} — ${new Date(end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [{ data, fetching: detailFetching }, reexecuteDetail] = useTripDetail(id!);
  const { data: meData } = useMe();
  const role = meData?.me?.role;
  const hasEditRole = role === 'ADMIN' || role === 'EDITOR';
  const { editMode } = useEditMode();
  const isAdmin = hasEditRole && editMode;

  const [searchParams, setSearchParams] = useSearchParams();

  const selectedStageId = searchParams.get('stage');
  const selectedDayId = searchParams.get('day');
  // Manual forms are create-only (opened via map click); editing an existing
  // entity goes through the auto-open forms driven by the URL selection.
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [dayFormOpen, setDayFormOpen] = useState(false);
  const [dayFormStageId, setDayFormStageId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingStageCoords, setPendingStageCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingDayCoords, setPendingDayCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [panTarget, setPanTarget] = useState<PanTarget>(null);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('half');
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const refetchAll = useCallback(() => reexecuteDetail({ requestPolicy: 'network-only' }), [reexecuteDetail]);
  // Per-entity in-flight drag mutation guard. Ref-based so updates don't
  // re-render the map and lose Leaflet's drag state.
  const savingStagesRef = useRef<Set<string>>(new Set());
  const savingDaysRef = useRef<Set<string>>(new Set());

  const [, publishTrip] = usePublishTrip();
  const [, unpublishTrip] = useUnpublishTrip();
  const [, closeTrip] = useCloseTrip();
  const [, deleteTrip] = useDeleteTrip();
  const [, reopenTrip] = useReopenTrip();
  const [, updateStage] = useUpdateStage();
  const [, deleteStage] = useDeleteStage();
  const [, updateDay] = useUpdateDay();
  const [, deleteDay] = useDeleteDay();

  const refetchContext = { additionalTypenames: ['Trip', 'Stage', 'Day'] };

  // Photos de l'album, proposées comme cover dans le formulaire voyage. En
  // pause dès qu'une étape est sélectionnée : le retour au niveau voyage
  // relance un fetch réseau (cache-and-network) et récupère les photos
  // uploadées entre-temps. Filtre par tripID : urql conserve la data
  // précédente pendant pause/refetch.
  const [{ data: tripMediaData }] = useTripMedia(isAdmin && !selectedStageId ? id : null);
  const coverChoices = (tripMediaData?.tripMedia ?? [])
    .filter((m) => m.tripID === id && m.contentType.startsWith('image/'))
    .map((m) => ({ id: m.id, thumbUrl: m.thumbUrl }));

  const trip = data?.trip ?? null;
  const isModifiable = trip ? trip.status !== 'CLOSED' : false;
  const stages = useMemo(() => data?.stages ?? [], [data?.stages]);
  const allDays = useMemo(() => data?.tripDays ?? [], [data?.tripDays]);

  const selectedDay = useMemo(
    () => (selectedDayId ? allDays.find((d) => d.id === selectedDayId) ?? null : null),
    [selectedDayId, allDays],
  );

  const selectedStage = useMemo(
    () => (selectedStageId ? stages.find((s) => s.id === selectedStageId) ?? null : null),
    [selectedStageId, stages],
  );

  // Contenu rémanent : la pane détail garde son dernier contenu pendant la
  // translation de retour (adjust-during-render, pattern wasOpen).
  const [lastDay, setLastDay] = useState<Day | null>(null);
  if (selectedDay && selectedDay !== lastDay) setLastDay(selectedDay);
  const displayDay = selectedDay ?? lastDay;

  const daysByStage = useMemo(() => {
    const map = new Map<string, Day[]>();
    for (const d of allDays) {
      for (const stageId of d.stageIDs) {
        const existing = map.get(stageId);
        if (existing) existing.push(d);
        else map.set(stageId, [d]);
      }
    }
    return map;
  }, [allDays]);

  const stageDateRanges = useMemo<StageDateRangeMap>(() => {
    const ranges: StageDateRangeMap = {};
    for (const [stageId, days] of daysByStage) {
      const primary = days.filter((d) => d.stageIDs[0] === stageId);
      if (primary.length > 0) {
        const sorted = [...primary].sort((a, b) => a.date.localeCompare(b.date));
        ranges[stageId] = { start: sorted[0].date, end: sorted[sorted.length - 1].date };
      }
    }
    return ranges;
  }, [daysByStage]);

  const activeStageDays = useMemo(() => {
    if (!selectedStageId) return [];
    return (daysByStage.get(selectedStageId) ?? []).filter((d) => d.stageIDs[0] === selectedStageId);
  }, [selectedStageId, daysByStage]);

  // Closing helpers — centralised so the "mutually exclusive forms" rule is
  // easy to enforce in the openers below.
  const closeStageForm = useCallback(() => {
    setStageFormOpen(false);
    setPendingStageCoords(null);
  }, []);

  const closeDayForm = useCallback(() => {
    setDayFormOpen(false);
    setDayFormStageId(null);
    setPendingDayCoords(null);
  }, []);

  // Sélectionner une étape (timeline ou carte) ne change pas de vue : la carte
  // se centre dessus et la timeline défile pour l'amener en haut. Re-cliquer
  // l'étape active la désélectionne (la carte revient à la vue d'ensemble).
  const handleStageClick = useCallback((stageId: string) => {
    if (selectedStageId === stageId && !selectedDayId) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ stage: stageId }, { replace: true });
    setSheetSnap((s) => (s === 'peek' ? 'half' : s));
    // Pas de scrollIntoView : il ajusterait aussi le scrollLeft des conteneurs
    // overflow:hidden du track.
    const el = document.getElementById(`stage-${stageId}`);
    const scroller = timelineScrollRef.current;
    if (el && scroller) {
      scroller.scrollTo({
        top: el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop,
        behavior: 'smooth',
      });
    }
  }, [setSearchParams, selectedStageId, selectedDayId]);

  const handleDayClickFromTimeline = useCallback((stageId: string, day: Day) => {
    setSearchParams({ stage: stageId, day: day.id }, { replace: true });
    setSheetSnap((s) => (s === 'peek' ? 'half' : s));
  }, [setSearchParams]);

  const handleDetailClose = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleBackToStage = useCallback(() => {
    setSearchParams((prev) => {
      prev.delete('day');
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  async function handlePublish() {
    await publishTrip({ id: id! }, refetchContext);
  }

  async function handleUnpublish() {
    await unpublishTrip({ id: id! }, refetchContext);
  }

  async function handleCloseTripAction() {
    const allDates = Object.values(stageDateRanges).flatMap((r) => [r.start, r.end]).sort();
    if (allDates.length === 0) return;
    const firstDay = allDates[0];
    const lastDay = allDates[allDates.length - 1];
    await closeTrip({ id: id!, input: { firstDay, lastDay } }, refetchContext);
  }

  async function handleReopen() {
    await reopenTrip({ id: id! }, refetchContext);
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteTrip({ id: id! }, refetchContext);
    if (result.error || !result.data?.deleteTrip.success) {
      setDeleting(false);
      setDeleteError('Impossible de supprimer le voyage. Réessayez.');
      return;
    }
    navigate('/');
  }

  // Drag handlers — F3 single-writer policy: if the auto-edit form for this
  // entity kind is open, propagate the coords into the form's pending state
  // and skip the immediate mutation (the form submit is the single writer).
  // F8 in-flight guard: ignore subsequent drags on the same entity until the
  // first save resolves, and revert the marker via the provided closure.
  const handleStageDragEnd = useCallback(
    async (stage: Stage, coords: { lat: number; lng: number }, revert: () => void) => {
      // Pending only when THIS stage's auto-form is open (it is the single
      // writer). In the overview (trip form open), a stage drag saves
      // immediately — otherwise the coords would silently feed the trip form.
      const autoEdit = isAdmin && isModifiable;
      if (autoEdit && selectedStageId === stage.id && !selectedDayId) {
        setPendingStageCoords(coords);
        return;
      }
      if (savingStagesRef.current.has(stage.id)) {
        revert();
        return;
      }
      savingStagesRef.current.add(stage.id);
      try {
        const customName = stage.displayName !== stage.city ? stage.displayName : undefined;
        const result = await updateStage(
          {
            id: stage.id,
            input: {
              city: stage.city,
              name: customName,
              lat: coords.lat,
              lng: coords.lng,
              description: stage.description || undefined,
            },
          },
          { additionalTypenames: ['Stage'] },
        );
        if (result.error || (result.data?.updateStage.errors ?? []).length > 0) {
          revert();
          refetchAll();
          return;
        }
        setPanTarget({ lat: coords.lat, lng: coords.lng, seq: Date.now() });
      } finally {
        savingStagesRef.current.delete(stage.id);
      }
    },
    [isAdmin, isModifiable, selectedStageId, selectedDayId, updateStage, refetchAll],
  );

  const handleDayDragEnd = useCallback(
    async (day: Day, coords: { lat: number; lng: number }, revert: () => void) => {
      const autoEdit = isAdmin && isModifiable;
      if (autoEdit && selectedDayId === day.id) {
        setPendingDayCoords(coords);
        return;
      }
      if (savingDaysRef.current.has(day.id)) {
        revert();
        return;
      }
      savingDaysRef.current.add(day.id);
      try {
        const result = await updateDay(
          {
            id: day.id,
            input: {
              title: day.title || undefined,
              description: day.description || undefined,
              lat: coords.lat,
              lng: coords.lng,
            },
          },
          { additionalTypenames: ['Day'] },
        );
        if (result.error || (result.data?.updateDay.errors ?? []).length > 0) {
          revert();
          refetchAll();
          return;
        }
        setPanTarget({ lat: coords.lat, lng: coords.lng, seq: Date.now() });
      } finally {
        savingDaysRef.current.delete(day.id);
      }
    },
    [isAdmin, isModifiable, selectedDayId, updateDay, refetchAll],
  );

  if (detailFetching) {
    return <div className={styles.notFound} style={{ color: 'var(--color-text-muted)' }}>Chargement…</div>;
  }

  if (!trip) {
    return <div className={styles.notFound}>Voyage introuvable.</div>;
  }

  const canEditMarkers = !!isAdmin && isModifiable;
  const color = tripColor(trip.id);
  const canCloseTrip =
    stages.length > 0 && Object.keys(stageDateRanges).length === stages.length;

  // Auto-open edit forms in edit mode based on current selection.
  // Manual opens (create via map click / menu) take priority over auto-open.
  const autoTripForm = isAdmin && isModifiable && !selectedStageId && !stageFormOpen && !dayFormOpen;
  const autoStageForm = isAdmin && isModifiable && !!selectedStage && !selectedDayId && !stageFormOpen && !dayFormOpen;
  const autoDayForm = isAdmin && isModifiable && !!selectedDay && !!selectedStageId && !dayFormOpen;

  const effectiveDayStageId = dayFormOpen ? dayFormStageId : (autoDayForm ? selectedStageId : null);

  // F4: suppress placement mode whenever a real overlay is blocking the map.
  // Auto-open panels are in-grid and don't block.
  const overlayActive = confirmDelete;

  const placementMode: PlacementMode = !canEditMarkers || overlayActive
    ? null
    : stageFormOpen
    ? 'stage'
    : dayFormOpen
    ? 'day'
    : selectedDay
    ? null
    : selectedStageId
    ? 'day'
    : 'stage';

  // Golden "pending" marker for the create forms (auto-edit forms already
  // have the dragged marker visible at the dropped position).
  const pendingMapCoords = stageFormOpen ? pendingStageCoords : dayFormOpen ? pendingDayCoords : null;

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    // Only manual (create) forms intercept map clicks for coord placement.
    // Auto-open panels don't — the click should open a new create form instead.
    if (stageFormOpen) {
      setPendingStageCoords(coords);
      return;
    }
    if (dayFormOpen) {
      setPendingDayCoords(coords);
      return;
    }
    if (!canEditMarkers || overlayActive) return;
    if (!selectedStageId) {
      closeDayForm();
      setPendingStageCoords(coords);
      setStageFormOpen(true);
      return;
    }
    if (!selectedDay) {
      closeStageForm();
      setDayFormStageId(selectedStageId);
      setPendingDayCoords(coords);
      setDayFormOpen(true);
    }
  };

  // Auto-form is one of the three auto-open forms (panel mode in-grid).
  const anyAutoForm = autoTripForm || autoStageForm || autoDayForm;

  // Niveau du panneau unique : seul un jour sélectionné change de vue. En mode
  // édition (auto-form), le panneau reste sur la timeline — c'est le
  // formulaire qui porte le détail sélectionné.
  const panelLevel: 0 | 1 = anyAutoForm ? 0 : selectedDay ? 1 : 0;

  // Actions for each form panel
  const tripFormActions: FormAction[] = isAdmin ? [
    ...(trip.status === 'DRAFT' ? [{ label: 'Publier le voyage', onClick: handlePublish }] : []),
    ...(trip.status === 'PUBLISHED' ? [{ label: 'Repasser en brouillon', onClick: handleUnpublish }] : []),
    ...(trip.status === 'PUBLISHED' && canCloseTrip ? [{ label: 'Clôturer le voyage', onClick: handleCloseTripAction }] : []),
    ...(trip.status === 'CLOSED' ? [{ label: 'Réouvrir le voyage', onClick: handleReopen }] : []),
    { label: 'Supprimer le voyage', onClick: () => setConfirmDelete(true), danger: true },
  ] : [];

  const stageFormActions: FormAction[] = isAdmin && selectedStage ? [
    {
      label: 'Supprimer l\'étape',
      danger: true,
      onClick: async () => {
        const result = await deleteStage({ id: selectedStage.id }, { additionalTypenames: ['Stage', 'Day'] });
        if (!result.error && result.data?.deleteStage.success) handleDetailClose();
      },
    },
  ] : [];

  const dayFormActions: FormAction[] = isAdmin && selectedDay ? [
    {
      label: 'Supprimer le jour',
      danger: true,
      onClick: async () => {
        const result = await deleteDay({ id: selectedDay.id }, { additionalTypenames: ['Day'] });
        if (!result.error && result.data?.deleteDay.success) handleBackToStage();
      },
    },
  ] : [];

  const tripMenuItems: ActionMenuItem[] = isAdmin && !anyAutoForm
    ? [
        ...(trip.status === 'PUBLISHED' ? [{ label: 'Repasser en brouillon', onClick: handleUnpublish }] : []),
        ...(trip.status === 'CLOSED' ? [{ label: 'Réouvrir', onClick: handleReopen }] : []),
        { label: 'Supprimer', onClick: () => setConfirmDelete(true), danger: true },
      ]
    : [];

  const canEditDetail = !!isAdmin && isModifiable;

  return (
    <>
    <div className={`${styles.page} ${anyAutoForm ? styles.formPanelOpen : ''}`}>
      {/* ── Panneau unique : timeline ⇄ détail d'étape ⇄ détail de jour ── */}
      <TripPanel
        level={panelLevel}
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
        hiddenOnMobile={anyAutoForm || stageFormOpen || dayFormOpen}
        timeline={
          <>
        <div className={styles.tripHeader} style={{ borderColor: color }}>
          <div className={styles.headerTop}>
            <Link to="/" viewTransition className={styles.backLink}>← Tous les voyages</Link>
            {tripMenuItems.length > 0 && (
              <ActionMenu items={tripMenuItems} ariaLabel="Actions sur le voyage" />
            )}
          </div>
          <p className={styles.country}>{trip.country}</p>
          <h1 className={styles.tripTitle}>{trip.title}</h1>
          <p className={styles.tripDates}>{formatDateRange(trip.startDate, trip.endDate)}</p>
        </div>

        <div className={styles.content} ref={timelineScrollRef}>
          {detailFetching ? (
            <p style={{ padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Chargement des étapes…</p>
          ) : stages.length === 0 ? (
            <p className={styles.emptyStages}>
              {isAdmin && isModifiable
                ? 'Aucune étape pour l\u2019instant. Cliquez sur la carte ou utilisez le menu ⋮ pour en ajouter une.'
                : 'Aucune étape pour ce voyage.'}
            </p>
          ) : (
            <div className={styles.timeline}>
              {stages.map((stage) => (
                <StageSection
                  key={stage.id}
                  stage={stage}
                  days={daysByStage.get(stage.id) ?? []}
                  dateRange={stageDateRanges[stage.id]}
                  active={selectedStageId === stage.id}
                  onStageClick={handleStageClick}
                  onDayClick={handleDayClickFromTimeline}
                />
              ))}
            </div>
          )}
        </div>
          </>
        }
        dayDetail={displayDay && (
          <DayDetail
            day={displayDay}
            canEdit={canEditDetail}
            onClose={handleDetailClose}
            onBack={handleBackToStage}
          />
        )}
      />

      {/* ── Form panel (mode édition) ── */}
      {anyAutoForm && (
        <div className={styles.formPanelWrapper}>
          {autoTripForm && (
            <TripForm
              open
              panel
              onClose={() => {}}
              trip={trip}
              pendingCoords={pendingStageCoords}
              actions={tripFormActions}
              coverChoices={coverChoices}
            />
          )}
          {autoStageForm && selectedStage && (
            <StageForm
              key={selectedStage.id}
              open
              panel
              onClose={handleDetailClose}
              tripID={id!}
              stage={selectedStage}
              pendingCoords={pendingStageCoords}
              actions={stageFormActions}
            />
          )}
          {autoDayForm && selectedDay && effectiveDayStageId && (
            <DayForm
              key={`${effectiveDayStageId}-${selectedDay.id}`}
              open
              panel
              onClose={handleBackToStage}
              tripID={id!}
              stageID={effectiveDayStageId}
              day={selectedDay}
              pendingCoords={pendingDayCoords}
              actions={dayFormActions}
            />
          )}
        </div>
      )}

      {/* ── Carte droite ── */}
      <div className={styles.mapArea}>
        {stages.length > 0 || canEditMarkers ? (
          <TripMap
            stages={stages}
            activeStageId={selectedStageId}
            activeStageDays={activeStageDays}
            stageDateRanges={stageDateRanges}
            onStageClick={handleStageClick}
            onDayClick={handleDayClickFromTimeline}
            placementMode={placementMode}
            pendingCoords={pendingMapCoords}
            onMapClick={handleMapClick}
            canEditMarkers={canEditMarkers}
            onStageDragEnd={canEditMarkers ? handleStageDragEnd : undefined}
            onDayDragEnd={canEditMarkers ? handleDayDragEnd : undefined}
            panTarget={panTarget}
            mobileSheetLayout={!anyAutoForm}
          />
        ) : (
          !detailFetching && <div className={styles.emptyMap}>Aucune étape pour ce voyage.</div>
        )}
      </div>

    </div>

    {isAdmin && (
      <>
        {/* Create forms (opened via map click) — rendered as drawers */}
        <StageForm
          open={stageFormOpen}
          onClose={closeStageForm}
          tripID={id!}
          pendingCoords={pendingStageCoords}
          noBackdrop
        />
        {dayFormStageId && (
          <DayForm
            key={dayFormStageId}
            open={dayFormOpen}
            onClose={closeDayForm}
            tripID={id!}
            stageID={dayFormStageId}
            pendingCoords={pendingDayCoords}
            noBackdrop
          />
        )}
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
    </>
  );
}

interface StageSectionProps {
  stage: Stage;
  days: Day[];
  dateRange?: { start: string; end: string };
  active: boolean;
  onStageClick: (stageId: string) => void;
  onDayClick: (stageId: string, day: Day) => void;
}

function StageSection({ stage, days, dateRange, active, onStageClick, onDayClick }: StageSectionProps) {
  // COR-008 : un jour multi-étapes n'est affiché que dans son étape principale (premier stageID)
  const primaryDays = days.filter((day) => day.stageIDs[0] === stage.id);

  return (
    <div id={`stage-${stage.id}`} className={styles.timelineGroup}>
      <button
        className={`${styles.stageDivider} ${active ? styles.stageDividerActive : ''}`}
        onClick={() => onStageClick(stage.id)}
      >
        <span className={styles.stageDividerName}>{stage.displayName}</span>
        <span className={styles.stageDividerMeta}>
          {stage.city}
          {dateRange &&
            (dateRange.start === dateRange.end
              ? ` · ${formatDate(dateRange.start)}`
              : ` · ${formatDate(dateRange.start)} — ${formatDate(dateRange.end)}`)}
        </span>
      </button>
      {primaryDays.map((day) => (
        <DayRow key={day.id} day={day} onClick={() => onDayClick(stage.id, day)} />
      ))}
    </div>
  );
}

function DayRow({ day, onClick }: { day: Day; onClick: () => void }) {
  return (
    <button className={styles.dayRow} onClick={onClick}>
      <div className={styles.dayMeta}>
        <span className={styles.dayLabel}>Jour</span>
        <span className={styles.dayDate}>{formatDate(day.date)}</span>
      </div>
      <div className={styles.dayInfo}>
        <p className={styles.dayTitle}>{day.title ?? day.date}</p>
      </div>
    </button>
  );
}
