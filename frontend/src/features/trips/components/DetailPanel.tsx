import { useDays } from '../../stages/hooks/useDays';
import type { StagesQuery, DaysQuery } from '../../../graphql/generated/graphql';
import styles from './DetailPanel.module.css';

type Stage = StagesQuery['stages'][number];
type Day = DaysQuery['days'][number];

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatFullDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface DetailPanelProps {
  stage: Stage | null;
  day: Day | null;
  open: boolean;
  onClose: () => void;
  onDayClick: (day: Day) => void;
  onBackToStage: () => void;
}

export function DetailPanel({ stage, day, open, onClose, onDayClick, onBackToStage }: DetailPanelProps) {
  return (
    <div className={`${styles.panelWrapper} ${open ? styles.open : ''}`}>
      <aside className={styles.panel}>
        {day ? (
          <DayDetail day={day} onClose={onClose} onBack={stage ? onBackToStage : undefined} />
        ) : stage ? (
          <StageDetail stage={stage} onClose={onClose} onDayClick={onDayClick} />
        ) : null}
      </aside>
    </div>
  );
}

function StageDetail({ stage, onClose, onDayClick }: { stage: Stage; onClose: () => void; onDayClick: (day: Day) => void }) {
  const { data, fetching } = useDays(stage.id);
  const days = data?.days ?? [];

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.label}>{stage.city}</p>
          <h3 className={styles.title}>{stage.displayName}</h3>
        </div>
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
      </div>
      <div className={styles.body}>
        {stage.description && (
          <p className={styles.description}>{stage.description}</p>
        )}
        {fetching ? (
          <p className={styles.muted}>Chargement…</p>
        ) : days.length === 0 ? (
          <p className={styles.muted}>Aucun jour pour cette étape.</p>
        ) : (
          <div className={styles.dayList}>
            {days.map((day) => (
              <button key={day.id} className={styles.dayItem} onClick={() => onDayClick(day)}>
                <span className={styles.dayDate}>{formatShortDate(day.date)}</span>
                <span className={styles.dayTitle}>{day.title ?? day.date}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DayDetail({ day, onClose, onBack }: { day: Day; onClose: () => void; onBack?: () => void }) {
  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          {onBack && (
            <button className={styles.back} onClick={onBack}>← Retour à l'étape</button>
          )}
          <p className={styles.label}>{formatFullDate(day.date)}</p>
          <h3 className={styles.title}>{day.title ?? day.date}</h3>
        </div>
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
      </div>
      <div className={styles.body}>
        {day.description ? (
          <p className={styles.description}>{day.description}</p>
        ) : (
          <p className={styles.muted} style={{ fontStyle: 'italic' }}>Aucune description pour ce jour.</p>
        )}
      </div>
    </>
  );
}
