import { useState } from 'react';
import { useDays } from '../../stages/hooks/useDays';
import { useDeleteStage } from '../../stages/hooks/useStageMutations';
import { useDeleteDay } from '../../stages/hooks/useDayMutations';
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
  isAdmin?: boolean;
  isModifiable?: boolean;
  onEditStage?: (stage: Stage) => void;
  onAddDay?: (stageId: string) => void;
  onEditDay?: (stageId: string, day: Day) => void;
}

export function DetailPanel({ stage, day, open, onClose, onDayClick, onBackToStage, isAdmin, isModifiable, onEditStage, onAddDay, onEditDay }: DetailPanelProps) {
  const canEdit = isAdmin && isModifiable;

  return (
    <div className={`${styles.panelWrapper} ${open ? styles.open : ''}`}>
      <aside className={styles.panel}>
        {day ? (
          <DayDetail
            day={day}
            stageId={stage?.id ?? ''}
            onClose={onClose}
            onBack={stage ? onBackToStage : undefined}
            canEdit={canEdit}
            onEdit={onEditDay}
          />
        ) : stage ? (
          <StageDetail
            stage={stage}
            onClose={onClose}
            onDayClick={onDayClick}
            canEdit={canEdit}
            onEditStage={onEditStage}
            onAddDay={onAddDay}
            onEditDay={onEditDay}
          />
        ) : null}
      </aside>
    </div>
  );
}

interface StageDetailProps {
  stage: Stage;
  onClose: () => void;
  onDayClick: (day: Day) => void;
  canEdit?: boolean;
  onEditStage?: (stage: Stage) => void;
  onAddDay?: (stageId: string) => void;
  onEditDay?: (stageId: string, day: Day) => void;
}

function StageDetail({ stage, onClose, onDayClick, canEdit, onEditStage, onAddDay, onEditDay }: StageDetailProps) {
  const { data, fetching } = useDays(stage.id);
  const days = data?.days ?? [];
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, deleteStage] = useDeleteStage();

  async function handleDelete() {
    const result = await deleteStage({ id: stage.id }, { additionalTypenames: ['Stage', 'Day'] });
    if (!result.error && result.data?.deleteStage.success) {
      onClose();
    }
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.label}>{stage.city}</p>
          <h3 className={styles.title}>{stage.displayName}</h3>
        </div>
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      {canEdit && (
        <div className={styles.adminBar}>
          <button className={styles.adminBtn} onClick={() => onEditStage?.(stage)}>Modifier</button>
          <button className={`${styles.adminBtn} ${styles.adminBtnDanger}`} onClick={() => setConfirmDelete(true)}>Supprimer</button>
        </div>
      )}

      {confirmDelete && (
        <div className={styles.confirmBar}>
          <span>Supprimer cette étape ?</span>
          <button className={styles.adminBtn} onClick={() => setConfirmDelete(false)}>Annuler</button>
          <button className={`${styles.adminBtn} ${styles.adminBtnDanger}`} onClick={handleDelete}>Confirmer</button>
        </div>
      )}

      <div className={styles.body}>
        {stage.description && (
          <p className={styles.description}>{stage.description}</p>
        )}

        {canEdit && (
          <button className={styles.addDayBtn} onClick={() => onAddDay?.(stage.id)}>
            + Ajouter un jour
          </button>
        )}

        {fetching ? (
          <p className={styles.muted}>Chargement…</p>
        ) : days.length === 0 ? (
          <p className={styles.muted}>Aucun jour pour cette étape.</p>
        ) : (
          <div className={styles.dayList}>
            {days.map((day) => (
              <div key={day.id} className={styles.dayRow}>
                <button className={styles.dayItem} onClick={() => onDayClick(day)}>
                  <span className={styles.dayDate}>{formatShortDate(day.date)}</span>
                  <span className={styles.dayTitle}>{day.title ?? day.date}</span>
                </button>
                {canEdit && (
                  <button
                    className={styles.dayEditBtn}
                    onClick={() => onEditDay?.(stage.id, day)}
                    aria-label="Modifier ce jour"
                  >
                    ✎
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

interface DayDetailProps {
  day: Day;
  stageId: string;
  onClose: () => void;
  onBack?: () => void;
  canEdit?: boolean;
  onEdit?: (stageId: string, day: Day) => void;
}

function DayDetail({ day, stageId, onClose, onBack, canEdit, onEdit }: DayDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, deleteDay] = useDeleteDay();

  async function handleDelete() {
    const result = await deleteDay({ id: day.id }, { additionalTypenames: ['Day'] });
    if (!result.error && result.data?.deleteDay.success) {
      if (onBack) { onBack(); } else { onClose(); }
    }
  }

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

      {canEdit && (
        <div className={styles.adminBar}>
          <button className={styles.adminBtn} onClick={() => onEdit?.(stageId, day)}>Modifier</button>
          <button className={`${styles.adminBtn} ${styles.adminBtnDanger}`} onClick={() => setConfirmDelete(true)}>Supprimer</button>
        </div>
      )}

      {confirmDelete && (
        <div className={styles.confirmBar}>
          <span>Supprimer ce jour ?</span>
          <button className={styles.adminBtn} onClick={() => setConfirmDelete(false)}>Annuler</button>
          <button className={`${styles.adminBtn} ${styles.adminBtnDanger}`} onClick={handleDelete}>Confirmer</button>
        </div>
      )}

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
