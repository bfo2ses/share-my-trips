import { useState, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTripDetail } from '../hooks/useTripDetail';
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
import type { TripDetailQuery } from '../../../graphql/generated/graphql';
import styles from './TripDetailPage.module.css';

type Stage = TripDetailQuery['stages'][number];
type Day = TripDetailQuery['tripDays'][number];
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
  const [{ data, fetching: detailFetching }, reexecuteDetail] = useTripDetail(id!);
  const { data: meData } = useMe();
  const role = meData?.me?.role;
  const isAdmin = role === 'ADMIN' || role === 'EDITOR';

  const [searchParams, setSearchParams] = useSearchParams();

  const [view, setView] = useState<View>('timeline');
  const selectedStageId = searchParams.get('stage');
  const selectedDayId = searchParams.get('day');
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
  const [, updateDay] = useUpdateDay();

  const refetchContext = { additionalTypenames: ['Trip', 'Stage', 'Day'] };

  const trip = data?.trip ?? null;
  const stages = useMemo(() => data?.stages ?? [], [data?.stages]);
  const allDays = useMemo(() => data?.tripDays ?? [], [data?.tripDays]);

  const selectedDay = useMemo(
    () => (selectedDayId ? allDays.find((d) => d.id === selectedDayId) ?? null : null),
    [selectedDayId, allDays],
  );

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

  const handleStageClick = useCallback((stageId: string) => {
    setSearchParams({ stage: stageId }, { replace: true });
    document.getElementById(`stage-${stageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [setSearchParams]);

  const handleDayClickFromTimeline = useCallback((stageId: string, day: Day) => {
    setSearchParams({ stage: stageId, day: day.id }, { replace: true });
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
          refetchAll();
          return;
        }
        setPanTarget({ lat: coords.lat, lng: coords.lng, seq: Date.now() });
      } finally {
        savingStagesRef.current.delete(stage.id);
      }
    },
    [stageFormOpen, editingStage, updateStage, refetchAll],
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
          refetchAll();
          return;
        }
        setPanTarget({ lat: coords.lat, lng: coords.lng, seq: Date.now() });
      } finally {
        savingDaysRef.current.delete(day.id);
      }
    },
    [dayFormOpen, editingDay, updateDay, refetchAll],
  );

  if (detailFetching) {
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
    stages.length > 0 && Object.keys(stageDateRanges).length === stages.length;

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
    stageDays: selectedStageId ? (daysByStage.get(selectedStageId) ?? []) : [],
    day: selectedDay,
    open: detailOpen,
    onClose: handleDetailClose,
    onDayClick: (day: Day) => setSearchParams({ stage: selectedStageId!, day: day.id }, { replace: true }),
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
          {detailFetching ? (
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
                      days={daysByStage.get(stage.id) ?? []}
                      index={i}
                      view="timeline"
                      active={selectedStageId === stage.id}
                      onStageClick={handleStageClick}
                      onDayClick={handleDayClickFromTimeline}
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
                      days={daysByStage.get(stage.id) ?? []}
                      index={i}
                      view="stages"
                      active={selectedStageId === stage.id}
                      onStageClick={handleStageClick}
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
          />
        ) : (
          !detailFetching && <div className={styles.emptyMap}>Aucune étape pour ce voyage.</div>
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
  days: Day[];
  index: number;
  view: View;
  active: boolean;
  onStageClick: (stageId: string) => void;
  onDayClick?: (stageId: string, day: Day) => void;
}

function StageSection({ stage, days, index, view, active, onStageClick, onDayClick }: StageSectionProps) {
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
