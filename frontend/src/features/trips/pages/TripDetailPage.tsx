import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTrip } from '../hooks/useTrip';
import { useStages } from '../../stages/hooks/useStages';
import { useDays } from '../../stages/hooks/useDays';
import { TripMap } from '../components/TripMap';
import { DayDrawer } from '../components/DayDrawer';
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
  const { data: tripData, fetching: tripFetching } = useTrip(id!);
  const { data: stagesData, fetching: stagesFetching } = useStages(id!);

  const [view, setView] = useState<View>('timeline');
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);

  const trip = tripData?.trip;
  const stages = stagesData?.stages ?? [];

  if (!tripFetching && !trip) {
    return <div className={styles.notFound}>Voyage introuvable.</div>;
  }

  if (tripFetching) {
    return <div className={styles.notFound} style={{ color: 'var(--color-text-muted)' }}>Chargement…</div>;
  }

  const color = tripColor(trip!.id);

  function handleStageClick(stageId: string) {
    setActiveStageId(stageId);
    document.getElementById(`stage-${stageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className={styles.page}>
      {/* ── Panneau gauche ── */}
      <aside className={styles.panel}>
        {/* En-tête voyage */}
        <div className={styles.tripHeader} style={{ borderColor: color }}>
          <Link to="/" className={styles.backLink}>← Tous les voyages</Link>
          <p className={styles.country}>{trip!.country}</p>
          <h1 className={styles.tripTitle}>{trip!.title}</h1>
          <p className={styles.tripDates}>{formatDateRange(trip!.startDate, trip!.endDate)}</p>
        </div>

        {/* Toggle vue */}
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

        {/* Contenu */}
        <div className={styles.content}>
          {stagesFetching ? (
            <p style={{ padding: '20px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Chargement des étapes…</p>
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
                      active={activeStageId === stage.id}
                      onDayClick={setSelectedDay}
                      onStageClick={handleStageClick}
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
                      active={activeStageId === stage.id}
                      onDayClick={setSelectedDay}
                      onStageClick={handleStageClick}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ── Carte droite ── */}
      <div className={styles.mapArea}>
        {stages.length > 0 ? (
          <TripMap
            stages={stages}
            activeStageId={activeStageId}
            onStageClick={handleStageClick}
          />
        ) : (
          !stagesFetching && <div className={styles.emptyMap}>Aucune étape pour ce voyage.</div>
        )}
      </div>

      {/* ── Drawer jour ── */}
      {selectedDay && (
        <DayDrawer
          day={selectedDay}
          open={!!selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

interface StageSectionProps {
  stage: Stage;
  index: number;
  view: View;
  active: boolean;
  onDayClick: (day: Day) => void;
  onStageClick: (stageId: string) => void;
}

function StageSection({ stage, index, view, active, onDayClick, onStageClick }: StageSectionProps) {
  const { data } = useDays(stage.id);
  const days = data?.days ?? [];

  if (view === 'timeline') {
    return (
      <div id={`stage-${stage.id}`} className={styles.timelineGroup}>
        <div
          className={`${styles.stageDivider} ${active ? styles.stageDividerActive : ''}`}
          onClick={() => onStageClick(stage.id)}
        >
          <span>{stage.displayName}</span>
        </div>
        {days.map((day) => (
          <DayRow key={day.id} day={day} onClick={() => onDayClick(day)} />
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
        <p className={styles.stageMeta}>{stage.city} · {days.length} jour{days.length > 1 ? 's' : ''}</p>
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
