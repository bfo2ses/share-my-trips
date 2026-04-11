import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTrip } from '../hooks/useTrip';
import { useStages } from '../../stages/hooks/useStages';
import { useDays } from '../../stages/hooks/useDays';
import { useMe } from '../../auth/hooks/useMe';
import { usePublishTrip, useUnpublishTrip, useDeleteTrip, useReopenTrip, useCloseTrip } from '../hooks/useTripMutations';
import { useUpdateStage } from '../../stages/hooks/useStageMutations';
import { useUpdateDay } from '../../stages/hooks/useDayMutations';
import { TripMap, type PlacementMode } from '../components/TripMap';
import { TripForm } from '../components/TripForm';
import { DetailPanel } from '../components/DetailPanel';
import { StageForm } from '../../stages/components/StageForm';
import { DayForm } from '../../stages/components/DayForm';
import { ActionMenu, type ActionMenuItem } from '../../../components/ActionMenu/ActionMenu';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import { tripColor } from '../utils/tripColor';
import type { StagesQuery, DaysQuery } from '../../../graphql/generated/graphql';
import styles from './TripDetailPage.module.css';

type Stage = StagesQuery['stages'][number];
type Day = DaysQuery['days'][number];
type StageDateRangeMap = Record<string, { start: string; end: string }>;
type PanTarget = { lat: number; lng: number; seq: number } | null;

type View = 'timeline' | 'stages';

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
  const { data: tripData, fetching: tripFetching } = useTrip(id!);
  const [{ data: stagesData, fetching: stagesFetching }, reexecuteStages] = useStages(id!);
  const { data: meData } = useMe();
  const isAdmin = meData?.me?.role === 'ADMIN';

  const [view, setView] = useState<View>('timeline');
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [stageDateRanges, setStageDateRanges] = useState<StageDateRangeMap>({});
  const [formOpen, setFormOpen] = useState(false);
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [dayFormOpen, setDayFormOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Day | null>(null);
  const [dayFormStageId, setDayFormStageId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingStageCoords, setPendingStageCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingDayCoords, setPendingDayCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [panTarget, setPanTarget] = useState<PanTarget>(null);

  // Days-query refetch handle, shared upward from TripMapWithActiveDays.
  // Ref (not state) avoids an effect storm if urql ever re-creates reexecute.
  const daysRefetchRef = useRef<(() => void) | null>(null);
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
  const [, updateDay] = useUpdateDay();

  const refetchContext = { additionalTypenames: ['Trip'] };

  const trip = tripData?.trip ?? null;
  const stages = useMemo(() => stagesData?.stages ?? [], [stagesData?.stages]);

  // Derive live ranges, dropping entries for stages that no longer exist
  // (addresses residual risk R1 on stale canCloseTrip / handleClose payload).
  const liveStageDateRanges = useMemo<StageDateRangeMap>(() => {
    if (stages.length === 0) return {};
    const liveIds = new Set(stages.map((s) => s.id));
    const filtered: StageDateRangeMap = {};
    for (const [k, v] of Object.entries(stageDateRanges)) {
      if (liveIds.has(k)) filtered[k] = v;
    }
    return filtered;
  }, [stages, stageDateRanges]);

  const handleDaysLoaded = useCallback((stageId: string, start: string, end: string) => {
    setStageDateRanges((prev) => {
      const existing = prev[stageId];
      if (existing && existing.start === start && existing.end === end) return prev;
      return { ...prev, [stageId]: { start, end } };
    });
  }, []);

  const handleStageClick = useCallback((stageId: string) => {
    setSelectedStageId(stageId);
    setSelectedDay(null);
    document.getElementById(`stage-${stageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleDayClickFromTimeline = useCallback((stageId: string, day: Day) => {
    setSelectedStageId(stageId);
    setSelectedDay(day);
  }, []);

  const handleDetailClose = useCallback(() => {
    setSelectedStageId(null);
    setSelectedDay(null);
  }, []);

  const handleBackToStage = useCallback(() => {
    setSelectedDay(null);
  }, []);

  async function handlePublish() {
    await publishTrip({ id: id! }, refetchContext);
  }

  async function handleUnpublish() {
    await unpublishTrip({ id: id! }, refetchContext);
  }

  async function handleCloseTripAction() {
    const allDates = Object.values(liveStageDateRanges).flatMap((r) => [r.start, r.end]).sort();
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

  // Closing helpers — centralised so the "mutually exclusive forms" rule is
  // easy to enforce in the openers below.
  const closeStageForm = useCallback(() => {
    setStageFormOpen(false);
    setEditingStage(null);
    setPendingStageCoords(null);
  }, []);

  const closeDayForm = useCallback(() => {
    setDayFormOpen(false);
    setEditingDay(null);
    setDayFormStageId(null);
    setPendingDayCoords(null);
  }, []);

  function handleAddStage() {
    closeDayForm();
    setEditingStage(null);
    setPendingStageCoords(null);
    setStageFormOpen(true);
  }

  function handleEditStage(stage: Stage) {
    closeDayForm();
    setEditingStage(stage);
    setPendingStageCoords(null);
    setStageFormOpen(true);
  }

  function handleAddDay(stageId: string) {
    closeStageForm();
    setEditingDay(null);
    setDayFormStageId(stageId);
    setPendingDayCoords(null);
    setDayFormOpen(true);
  }

  function handleEditDay(stageId: string, day: Day) {
    closeStageForm();
    setEditingDay(day);
    setDayFormStageId(stageId);
    setPendingDayCoords(null);
    setDayFormOpen(true);
  }

  // Drag handlers — F3 single-writer policy: if the edit form for this exact
  // entity is open, propagate the coords into the form's pending state and
  // skip the immediate mutation (the form submit is the single writer).
  // F8 in-flight guard: ignore subsequent drags on the same entity until the
  // first save resolves, and revert the marker via the provided closure.
  const handleStageDragEnd = useCallback(
    async (stage: Stage, coords: { lat: number; lng: number }, revert: () => void) => {
      if (stageFormOpen && editingStage?.id === stage.id) {
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
          reexecuteStages({ requestPolicy: 'network-only' });
          return;
        }
        setPanTarget({ lat: coords.lat, lng: coords.lng, seq: Date.now() });
      } finally {
        savingStagesRef.current.delete(stage.id);
      }
    },
    [stageFormOpen, editingStage, updateStage, reexecuteStages],
  );

  const handleDayDragEnd = useCallback(
    async (day: Day, coords: { lat: number; lng: number }, revert: () => void) => {
      if (dayFormOpen && editingDay?.id === day.id) {
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
          daysRefetchRef.current?.();
          return;
        }
        setPanTarget({ lat: coords.lat, lng: coords.lng, seq: Date.now() });
      } finally {
        savingDaysRef.current.delete(day.id);
      }
    },
    [dayFormOpen, editingDay, updateDay],
  );

  if (tripFetching) {
    return <div className={styles.notFound} style={{ color: 'var(--color-text-muted)' }}>Chargement…</div>;
  }

  if (!trip) {
    return <div className={styles.notFound}>Voyage introuvable.</div>;
  }

  const isModifiable = trip.status !== 'CLOSED';
  const canEditMarkers = !!isAdmin && isModifiable;
  const color = tripColor(trip.id);
  const detailOpen = selectedStageId !== null;
  const selectedStage = selectedStageId ? (stages.find((s) => s.id === selectedStageId) ?? null) : null;
  const canCloseTrip =
    stages.length > 0 && Object.keys(liveStageDateRanges).length === stages.length;

  // F4: suppress placement mode whenever a modal/overlay is blocking the map.
  const overlayActive = confirmDelete || formOpen;

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

  // Only render the golden "pending" marker while CREATING (edit forms already
  // have the dragged marker visible at the dropped position).
  const pendingMapCoords =
    stageFormOpen && !editingStage
      ? pendingStageCoords
      : dayFormOpen && !editingDay
      ? pendingDayCoords
      : null;

  const handleMapClick = (coords: { lat: number; lng: number }) => {
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
      setEditingStage(null);
      setPendingStageCoords(coords);
      setStageFormOpen(true);
      return;
    }
    if (!selectedDay) {
      closeStageForm();
      setEditingDay(null);
      setDayFormStageId(selectedStageId);
      setPendingDayCoords(coords);
      setDayFormOpen(true);
    }
  };

  const tripMenuItems: ActionMenuItem[] = isAdmin
    ? [
        { label: 'Modifier', onClick: () => setFormOpen(true) },
        ...(isModifiable ? [{ label: 'Ajouter une étape', onClick: handleAddStage }] : []),
        ...(trip.status === 'PUBLISHED' ? [{ label: 'Repasser en brouillon', onClick: handleUnpublish }] : []),
        ...(trip.status === 'CLOSED' ? [{ label: 'Réouvrir', onClick: handleReopen }] : []),
        { label: 'Supprimer', onClick: () => setConfirmDelete(true), danger: true },
      ]
    : [];

  const detailPanelCommon = {
    stage: selectedStage,
    day: selectedDay,
    open: detailOpen,
    onClose: handleDetailClose,
    onDayClick: setSelectedDay,
    onBackToStage: handleBackToStage,
  };

  return (
    <>
    <div className={`${styles.page} ${detailOpen ? styles.detailOpen : ''}`}>
      {/* ── Panneau gauche ── */}
      <aside className={styles.panel}>
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
          {isAdmin && trip.status === 'DRAFT' && (
            <button className={styles.primaryCta} onClick={handlePublish}>
              Publier le voyage
            </button>
          )}
          {isAdmin && trip.status === 'PUBLISHED' && canCloseTrip && (
            <button className={styles.primaryCta} onClick={handleCloseTripAction}>
              Clôturer le voyage
            </button>
          )}
        </div>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${view === 'timeline' ? styles.active : ''}`}
            onClick={() => setView('timeline')}
          >
            Timeline
          </button>
          <button
            className={`${styles.viewBtn} ${view === 'stages' ? styles.active : ''}`}
            onClick={() => setView('stages')}
          >
            Étapes
          </button>
        </div>

        <div className={styles.content}>
          {stagesFetching ? (
            <p style={{ padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Chargement des étapes…</p>
          ) : stages.length === 0 ? (
            <p className={styles.emptyStages}>
              {isAdmin && isModifiable
                ? 'Aucune étape pour l\u2019instant. Cliquez sur la carte ou utilisez le menu ⋮ pour en ajouter une.'
                : 'Aucune étape pour ce voyage.'}
            </p>
          ) : (
            <>
              {view === 'timeline' && (
                <div className={styles.timeline}>
                  {stages.map((stage, i) => (
                    <StageSection
                      key={stage.id}
                      stage={stage}
                      index={i}
                      view="timeline"
                      active={selectedStageId === stage.id}
                      onStageClick={handleStageClick}
                      onDayClick={handleDayClickFromTimeline}
                      onDaysLoaded={handleDaysLoaded}
                    />
                  ))}
                </div>
              )}

              {view === 'stages' && (
                <div className={styles.stageList}>
                  {stages.map((stage, i) => (
                    <StageSection
                      key={stage.id}
                      stage={stage}
                      index={i}
                      view="stages"
                      active={selectedStageId === stage.id}
                      onStageClick={handleStageClick}
                      onDaysLoaded={handleDaysLoaded}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ── Panneau détail ── */}
      {isAdmin && isModifiable ? (
        <DetailPanel
          {...detailPanelCommon}
          canEdit
          onEditStage={handleEditStage}
          onAddDay={handleAddDay}
          onEditDay={handleEditDay}
        />
      ) : (
        <DetailPanel {...detailPanelCommon} canEdit={false} />
      )}

      {/* ── Carte droite ── */}
      <div className={styles.mapArea}>
        {stages.length > 0 || canEditMarkers ? (
          <TripMapWithActiveDays
            stages={stages}
            activeStageId={selectedStageId}
            stageDateRanges={liveStageDateRanges}
            onStageClick={handleStageClick}
            onDayClick={handleDayClickFromTimeline}
            placementMode={placementMode}
            pendingCoords={pendingMapCoords}
            onMapClick={handleMapClick}
            canEditMarkers={canEditMarkers}
            onStageDragEnd={canEditMarkers ? handleStageDragEnd : undefined}
            onDayDragEnd={canEditMarkers ? handleDayDragEnd : undefined}
            daysRefetchRef={daysRefetchRef}
            panTarget={panTarget}
          />
        ) : (
          !stagesFetching && <div className={styles.emptyMap}>Aucune étape pour ce voyage.</div>
        )}
      </div>

    </div>

    {isAdmin && (
      <>
        <TripForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          trip={trip}
        />
        <StageForm
          key={editingStage?.id ?? 'new-stage'}
          open={stageFormOpen}
          onClose={closeStageForm}
          tripID={id!}
          stage={editingStage}
          pendingCoords={pendingStageCoords}
          noBackdrop
        />
        {dayFormStageId && (
          <DayForm
            key={`${dayFormStageId}-${editingDay?.id ?? 'new-day'}`}
            open={dayFormOpen}
            onClose={closeDayForm}
            tripID={id!}
            stageID={dayFormStageId}
            day={editingDay}
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
  index: number;
  view: View;
  active: boolean;
  onStageClick: (stageId: string) => void;
  onDayClick?: (stageId: string, day: Day) => void;
  onDaysLoaded: (stageId: string, start: string, end: string) => void;
}

function StageSection({ stage, index, view, active, onStageClick, onDayClick, onDaysLoaded }: StageSectionProps) {
  const [{ data }] = useDays(stage.id);
  const days = data?.days ?? [];

  useEffect(() => {
    if (data?.days && data.days.length > 0) {
      onDaysLoaded(stage.id, data.days[0].date, data.days[data.days.length - 1].date);
    }
  }, [stage.id, data, onDaysLoaded]);

  // COR-008 : un jour multi-étapes n'est affiché que dans son étape principale (premier stageID)
  const primaryDays = days.filter((day) => day.stageIDs[0] === stage.id);

  if (view === 'timeline') {
    return (
      <div id={`stage-${stage.id}`} className={styles.timelineGroup}>
        <div
          className={`${styles.stageDivider} ${active ? styles.stageDividerActive : ''}`}
          onClick={() => onStageClick(stage.id)}
        >
          <span>{stage.displayName}</span>
        </div>
        {primaryDays.map((day) => (
          <DayRow key={day.id} day={day} onClick={() => onDayClick?.(stage.id, day)} />
        ))}
      </div>
    );
  }

  return (
    <button
      className={`${styles.stageRow} ${active ? styles.stageRowActive : ''}`}
      onClick={() => onStageClick(stage.id)}
    >
      <span className={styles.stageIndex}>{index + 1}</span>
      <div className={styles.stageInfo}>
        <p className={styles.stageName}>{stage.displayName}</p>
        <p className={styles.stageMeta}>{stage.city} · {primaryDays.length} jour{primaryDays.length > 1 ? 's' : ''}</p>
      </div>
    </button>
  );
}

interface TripMapWithActiveDaysProps {
  stages: Stage[];
  activeStageId: string | null;
  stageDateRanges: StageDateRangeMap;
  onStageClick: (stageId: string) => void;
  onDayClick: (stageId: string, day: Day) => void;
  placementMode: PlacementMode;
  pendingCoords: { lat: number; lng: number } | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  canEditMarkers: boolean;
  onStageDragEnd?: (stage: Stage, coords: { lat: number; lng: number }, revert: () => void) => void;
  onDayDragEnd?: (day: Day, coords: { lat: number; lng: number }, revert: () => void) => void;
  daysRefetchRef: React.MutableRefObject<(() => void) | null>;
  panTarget: PanTarget;
}

function TripMapWithActiveDays({
  stages,
  activeStageId,
  stageDateRanges,
  onStageClick,
  onDayClick,
  placementMode,
  pendingCoords,
  onMapClick,
  canEditMarkers,
  onStageDragEnd,
  onDayDragEnd,
  daysRefetchRef,
  panTarget,
}: TripMapWithActiveDaysProps) {
  // Only fetch days when a stage is active; pause the query otherwise.
  const [{ data: activeStageData }, reexecuteDays] = useDays(activeStageId ?? '', { pause: !activeStageId });
  const activeStageDays = activeStageId
    ? (activeStageData?.days ?? []).filter((d) => d.stageIDs[0] === activeStageId)
    : [];

  // Share the refetch handle upward via ref (no re-render on identity change).
  useEffect(() => {
    daysRefetchRef.current = () => reexecuteDays({ requestPolicy: 'network-only' });
    return () => {
      daysRefetchRef.current = null;
    };
  }, [daysRefetchRef, reexecuteDays]);

  return (
    <TripMap
      stages={stages}
      activeStageId={activeStageId}
      activeStageDays={activeStageDays}
      stageDateRanges={stageDateRanges}
      onStageClick={onStageClick}
      onDayClick={onDayClick}
      placementMode={placementMode}
      pendingCoords={pendingCoords}
      onMapClick={onMapClick}
      canEditMarkers={canEditMarkers}
      onStageDragEnd={onStageDragEnd}
      onDayDragEnd={onDayDragEnd}
      panTarget={panTarget}
    />
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
