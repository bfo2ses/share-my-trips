import { useState } from 'react';
import { useDeleteStage } from '../../stages/hooks/useStageMutations';
import { ActionMenu, type ActionMenuItem } from '../../../components/ActionMenu/ActionMenu';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import type { StagesQuery, DaysQuery } from '../../../graphql/generated/graphql';
import styles from './DetailView.module.css';

type Stage = StagesQuery['stages'][number];
type Day = DaysQuery['days'][number];

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface StageDetailProps {
  stage: Stage;
  days: Day[];
  canEdit: boolean;
  onClose: () => void;
  onDayClick: (day: Day) => void;
}

export function StageDetail({ stage, days, canEdit, onClose, onDayClick }: StageDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, deleteStage] = useDeleteStage();

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteStage({ id: stage.id }, { additionalTypenames: ['Stage', 'Day'] });
    if (result.error || !result.data?.deleteStage.success) {
      setDeleting(false);
      setDeleteError('Impossible de supprimer l’étape. Réessayez.');
      return;
    }
    // Parent slides back to the timeline, no need to reset local state.
    onClose();
  }

  const menuItems: ActionMenuItem[] = canEdit
    ? [
        { label: 'Supprimer', onClick: () => setConfirmDelete(true), danger: true },
      ]
    : [];

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.label}>{stage.city}</p>
          <h3 className={styles.title}>{stage.displayName}</h3>
        </div>
        {menuItems.length > 0 && (
          <ActionMenu items={menuItems} ariaLabel="Actions sur l’étape" />
        )}
        <button className={styles.close} onClick={onClose} aria-label="Retour à la timeline">✕</button>
      </div>

      <div className={styles.body}>
        {stage.description && (
          <p className={styles.description}>{stage.description}</p>
        )}

        {days.length === 0 ? (
          <p className={styles.muted}>
            {canEdit
              ? 'Aucun jour pour cette étape. Utilisez le menu ⋮ pour en ajouter un.'
              : 'Aucun jour pour cette étape.'}
          </p>
        ) : (
          <div className={styles.dayList}>
            {days.map((day) => (
              <button
                key={day.id}
                className={styles.dayItem}
                onClick={() => onDayClick(day)}
              >
                <span className={styles.dayDate}>{formatShortDate(day.date)}</span>
                <span className={styles.dayTitle}>{day.title ?? day.date}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer cette étape ?"
        message={deleteError ?? 'Les jours rattachés à cette étape seront également supprimés.'}
        confirmLabel="Supprimer"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDelete(false); setDeleteError(null); }}
      />
    </>
  );
}
