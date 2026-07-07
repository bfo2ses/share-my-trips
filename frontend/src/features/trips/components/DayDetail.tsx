import { useState, useCallback } from 'react';
import { useDeleteDay } from '../../stages/hooks/useDayMutations';
import { useDayMedia } from '../../media/hooks/useMediaQueries';
import { MediaGallery } from '../../media/components/MediaGallery';
import { MediaUploader } from '../../media/components/MediaUploader';
import { ActionMenu, type ActionMenuItem } from '../../../components/ActionMenu/ActionMenu';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import type { DaysQuery } from '../../../graphql/generated/graphql';
import styles from './DetailView.module.css';

type Day = DaysQuery['days'][number];

function formatFullDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface DayDetailProps {
  day: Day;
  canEdit: boolean;
  onClose: () => void;
  onBack: () => void;
}

export function DayDetail({ day, canEdit, onClose, onBack }: DayDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, deleteDay] = useDeleteDay();
  const [{ data: mediaData }, reexecuteMedia] = useDayMedia(day.id);
  const media = mediaData?.dayMedia ?? [];
  const refetchMedia = useCallback(() => reexecuteMedia({ requestPolicy: 'network-only' }), [reexecuteMedia]);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteDay({ id: day.id }, { additionalTypenames: ['Day'] });
    if (result.error || !result.data?.deleteDay.success) {
      setDeleting(false);
      setDeleteError('Impossible de supprimer ce jour. Réessayez.');
      return;
    }
    // Parent slides back to the stage, no need to reset local state.
    onBack();
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
          <button className={styles.back} onClick={onBack}>← Retour à la timeline</button>
          <p className={styles.label}>{formatFullDate(day.date)}</p>
          <h3 className={styles.title}>{day.title ?? day.date}</h3>
        </div>
        {menuItems.length > 0 && (
          <ActionMenu items={menuItems} ariaLabel="Actions sur le jour" />
        )}
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      <div className={styles.body}>
        {day.description ? (
          <p className={styles.description}>{day.description}</p>
        ) : (
          <p className={styles.muted} style={{ fontStyle: 'italic' }}>Aucune description pour ce jour.</p>
        )}

        <MediaGallery media={media} isAdmin={canEdit} onDeleted={refetchMedia} />

        {canEdit && (
          <MediaUploader dayID={day.id} tripID={day.tripID} onUploadComplete={refetchMedia} />
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer ce jour ?"
        message={deleteError ?? undefined}
        confirmLabel="Supprimer"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDelete(false); setDeleteError(null); }}
      />
    </>
  );
}
