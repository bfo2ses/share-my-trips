import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTrip } from '../hooks/useTrip';
import { useStages } from '../../stages/hooks/useStages';
import { useDays } from '../../stages/hooks/useDays';
import { useMe } from '../../auth/hooks/useMe';
import { usePublishTrip, useUnpublishTrip, useDeleteTrip, useReopenTrip, useCloseTrip } from '../hooks/useTripMutations';
import { TripMap } from '../components/TripMap';
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
  const { data: stagesData, fetching: stagesFetching } = useStages(id!);
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

  const [, publishTrip] = usePublishTrip();
  const [, unpublishTrip] = useUnpublishTrip();
  const [, closeTrip] = useCloseTrip();
  const [, deleteTrip] = useDeleteTrip();
  const [, reopenTrip] = useReopenTrip();

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

  function handleAddStage() {
    setEditingStage(null);
    setStageFormOpen(true);
  }

  function handleEditStage(stage: Stage) {
    setEditingStage(stage);
    setStageFormOpen(true);
  }

  function handleAddDay(stageId: string) {
    setEditingDay(null);
    setDayFormStageId(stageId);
    setDayFormOpen(true);
  }

  function handleEditDay(stageId: string, day: Day) {
    setEditingDay(day);
    setDayFormStageId(stageId);
    setDayFormOpen(true);
  }

  if (tripFetching) {
    return <div className={styles.notFound} style={{ color: 'var(--color-text-muted)' }}>Chargement…</div>;
  }

  if (!trip) {
    return <div className={styles.notFound}>Voyage introuvable.</div>;
  }

  const isModifiable = trip.status !== 'CLOSED';
  const color = tripColor(trip.id);
  const detailOpen = selectedStageId !== null;
  const selectedStage = selectedStageId ? (stages.find((s) => s.id === selectedStageId) ?? null) : null;
  // Only allow closing once every stage has reported its day range, otherwise
  // handleCloseTripAction would compute firstDay/lastDay from a partial set.
  const canCloseTrip =
    stages.length > 0 && Object.keys(liveStageDateRanges).length === stages.length;

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
                ? 'Aucune étape pour l\u2019instant. Utilisez le menu ⋮ pour en ajouter une.'
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
        {stages.length > 0 ? (
          <TripMapWithActiveDays
            stages={stages}
            activeStageId={selectedStageId}
            stageDateRanges={liveStageDateRanges}
            onStageClick={handleStageClick}
            onDayClick={handleDayClickFromTimeline}
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
          open={stageFormOpen}
          onClose={() => { setStageFormOpen(false); setEditingStage(null); }}
          tripID={id!}
          stage={editingStage}
        />
        {dayFormStageId && (
          <DayForm
            open={dayFormOpen}
            onClose={() => { setDayFormOpen(false); setEditingDay(null); setDayFormStageId(null); }}
            tripID={id!}
            stageID={dayFormStageId}
            day={editingDay}
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
  const { data } = useDays(stage.id);
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
}

function TripMapWithActiveDays({
  stages,
  activeStageId,
  stageDateRanges,
  onStageClick,
  onDayClick,
}: TripMapWithActiveDaysProps) {
  // Only fetch days when a stage is active; pause the query otherwise.
  const { data: activeStageData } = useDays(activeStageId ?? '', { pause: !activeStageId });
  const activeStageDays = activeStageId
    ? (activeStageData?.days ?? []).filter((d) => d.stageIDs[0] === activeStageId)
    : [];

  return (
    <TripMap
      stages={stages}
      activeStageId={activeStageId}
      activeStageDays={activeStageDays}
      stageDateRanges={stageDateRanges}
      onStageClick={onStageClick}
      onDayClick={onDayClick}
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
