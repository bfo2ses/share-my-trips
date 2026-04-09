import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_TRIPS } from '../mockData';
import type { Day, Stage } from '../mockData';
import { TripMap } from '../components/TripMap';
import { DayDrawer } from '../components/DayDrawer';
import styles from './TripDetailPage.module.css';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatDateRange(start: string, end: string) {
  return `${formatDate(start)} — ${new Date(end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

type View = 'timeline' | 'stages';

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const trip = MOCK_TRIPS.find((t) => t.id === id);

  const [view, setView] = useState<View>('timeline');
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);

  if (!trip) {
    return <div className={styles.notFound}>Voyage introuvable.</div>;
  }

  const stages = trip.stages ?? [];

  function handleStageClick(stageId: string) {
    setActiveStageId(stageId);
    document.getElementById(`stage-${stageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleDayClick(day: Day) {
    setSelectedDay(day);
  }

  return (
    <div className={styles.page}>
      {/* ── Panneau gauche ── */}
      <aside className={styles.panel}>
        {/* En-tête voyage */}
        <div className={styles.tripHeader} style={{ borderColor: trip.coverColor }}>
          <Link to="/" className={styles.backLink}>← Tous les voyages</Link>
          <p className={styles.country}>{trip.country}</p>
          <h1 className={styles.tripTitle}>{trip.title}</h1>
          <p className={styles.tripDates}>{formatDateRange(trip.startDate, trip.endDate)}</p>
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
          {view === 'timeline' && (
            <div className={styles.timeline}>
              {stages.map((stage) => (
                <div key={stage.id} id={`stage-${stage.id}`} className={styles.timelineGroup}>
                  <div
                    className={`${styles.stageDivider} ${activeStageId === stage.id ? styles.stageDividerActive : ''}`}
                    onClick={() => setActiveStageId(activeStageId === stage.id ? null : stage.id)}
                  >
                    <span>{stage.name}</span>
                  </div>
                  {stage.days.map((day) => (
                    <DayRow key={day.id} day={day} onClick={() => handleDayClick(day)} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {view === 'stages' && (
            <div className={styles.stageList}>
              {stages.map((stage, i) => (
                <StageRow
                  key={stage.id}
                  stage={stage}
                  index={i + 1}
                  active={activeStageId === stage.id}
                  onClick={() => handleStageClick(stage.id)}
                />
              ))}
            </div>
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
          <div className={styles.emptyMap}>Aucune étape pour ce voyage.</div>
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

function DayRow({ day, onClick }: { day: Day; onClick: () => void }) {
  return (
    <button className={styles.dayRow} onClick={onClick}>
      <div className={styles.dayMeta}>
        <span className={styles.dayLabel}>Jour</span>
        <span className={styles.dayDate}>{formatDate(day.date)}</span>
      </div>
      <div className={styles.dayInfo}>
        <p className={styles.dayTitle}>{day.title}</p>
        {day.photos.length > 0 && (
          <div className={styles.dayThumbs}>
            {day.photos.slice(0, 3).map((p, i) => (
              <img key={i} src={p.thumb} alt={p.alt} className={styles.dayThumb} />
            ))}
            {day.photos.length > 3 && (
              <span className={styles.morePhotos}>+{day.photos.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function StageRow({ stage, index, active, onClick }: { stage: Stage; index: number; active: boolean; onClick: () => void }) {
  const totalDays = stage.days.length;
  return (
    <button className={`${styles.stageRow} ${active ? styles.stageRowActive : ''}`} onClick={onClick}>
      <span className={styles.stageIndex}>{index}</span>
      <div className={styles.stageInfo}>
        <p className={styles.stageName}>{stage.name}</p>
        <p className={styles.stageMeta}>{stage.city} · {totalDays} jour{totalDays > 1 ? 's' : ''}</p>
      </div>
    </button>
  );
}
