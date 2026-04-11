import { useState, useCallback, useEffect } from 'react';
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
import { tripColor } from '../utils/tripColor';
import type { StagesQuery, DaysQuery } from '../../../graphql/generated/graphql';
import styles from './TripDetailPage.module.css';

type Stage = StagesQuery['stages'][number];
type Day = DaysQuery['days'][number];

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
  const [stageDateRanges, setStageDateRanges] = useState<Record<string, { start: string; end: string }>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [dayFormOpen, setDayFormOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Day | null>(null);
  const [dayFormStageId, setDayFormStageId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [, publishTrip] = usePublishTrip();
  const [, unpublishTrip] = useUnpublishTrip();
  const [, closeTrip] = useCloseTrip();
  const [, deleteTrip] = useDeleteTrip();
  const [, reopenTrip] = useReopenTrip();

  const refetchContext = { additionalTypenames: ['Trip'] };

  async function handlePublish() {
    await publishTrip({ id: id! }, refetchContext);
  }

  async function handleUnpublish() {
    await unpublishTrip({ id: id! }, refetchContext);
  }

  async function handleClose() {
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
    const result = await deleteTrip({ id: id! }, refetchContext);
    if (!result.error && result.data?.deleteTrip.success) {
      navigate('/');
    }
  }

  const isModifiable = tripData?.trip?.status !== 'CLOSED';

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

  const trip = tripData?.trip;
  const stages = stagesData?.stages ?? [];

  const handleDaysLoaded = useCallback((stageId: string, start: string, end: string) => {
    setStageDateRanges((prev) => {
      if (prev[stageId]) return prev;
      return { ...prev, [stageId]: { start, end } };
    });
  }, []);

  function handleStageClick(stageId: string) {
    setSelectedStageId(stageId);
    setSelectedDay(null);
    document.getElementById(`stage-${stageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleDayClickFromTimeline(stageId: string, day: Day) {
    setSelectedStageId(stageId);
    setSelectedDay(day);
  }

  function handleDetailClose() {
    setSelectedStageId(null);
    setSelectedDay(null);
  }

  if (!tripFetching && !trip) {
    return <div className={styles.notFound}>Voyage introuvable.</div>;
  }

  if (tripFetching) {
    return <div className={styles.notFound} style={{ color: 'var(--color-text-muted)' }}>Chargement…</div>;
  }

  const color = tripColor(trip!.id);
  const detailOpen = selectedStageId !== null;
  const selectedStage = selectedStageId ? (stages.find((s) => s.id === selectedStageId) ?? null) : null;

  return (
    <>
    <div className={`${styles.page} ${detailOpen ? styles.detailOpen : ''}`}>
      {/* ── Panneau gauche ── */}
      <aside className={styles.panel}>
        <div className={styles.tripHeader} style={{ borderColor: color }}>
          <Link to="/" viewTransition className={styles.backLink}>← Tous les voyages</Link>
          <p className={styles.country}>{trip!.country}</p>
          <h1 className={styles.tripTitle}>{trip!.title}</h1>
          <p className={styles.tripDates}>{formatDateRange(trip!.startDate, trip!.endDate)}</p>
          {isAdmin && (
            <div className={styles.adminActions}>
              <button className={styles.adminBtn} onClick={() => setFormOpen(true)}>
                Modifier
              </button>
              {trip!.status === 'DRAFT' && (
                <button className={`${styles.adminBtn} ${styles.adminBtnPrimary}`} onClick={handlePublish}>
                  Publier
                </button>
              )}
              {trip!.status === 'PUBLISHED' && (
                <>
                  <button className={styles.adminBtn} onClick={handleUnpublish}>
                    Brouillon
                  </button>
                  {Object.keys(stageDateRanges).length > 0 && (
                    <button className={styles.adminBtn} onClick={handleClose}>
                      Clôturer
                    </button>
                  )}
                </>
              )}
              {trip!.status === 'CLOSED' && (
                <button className={styles.adminBtn} onClick={handleReopen}>
                  Réouvrir
                </button>
              )}
              <button className={`${styles.adminBtn} ${styles.adminBtnDanger}`} onClick={() => setConfirmDelete(true)}>
                Supprimer
              </button>
            </div>
          )}
          {confirmDelete && (
            <div className={styles.confirmBar}>
              <span>Supprimer ce voyage ?</span>
              <button className={styles.adminBtn} onClick={() => setConfirmDelete(false)}>Annuler</button>
              <button className={`${styles.adminBtn} ${styles.adminBtnDanger}`} onClick={handleDelete}>Confirmer</button>
            </div>
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
          ) : (
            <>
              {isAdmin && isModifiable && (
                <div className={styles.addStageBar}>
                  <button className={styles.addStageBtn} onClick={handleAddStage}>
                    + Ajouter une étape
                  </button>
                </div>
              )}

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
      <DetailPanel
        stage={selectedStage}
        day={selectedDay}
        open={detailOpen}
        onClose={handleDetailClose}
        onDayClick={setSelectedDay}
        onBackToStage={() => setSelectedDay(null)}
        isAdmin={isAdmin}
        isModifiable={isModifiable}
        onEditStage={handleEditStage}
        onAddDay={handleAddDay}
        onEditDay={handleEditDay}
      />

      {/* ── Carte droite ── */}
      <div className={styles.mapArea}>
        {stages.length > 0 ? (
          <TripMapWithActiveDays
            stages={stages}
            activeStageId={selectedStageId}
            stageDateRanges={stageDateRanges}
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
  }, [stage.id, data]); // eslint-disable-line react-hooks/exhaustive-deps

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
  stageDateRanges: Record<string, { start: string; end: string }>;
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
