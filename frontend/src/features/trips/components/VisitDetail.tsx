import { useState, useCallback } from 'react';
import { useDeleteVisit } from '../../stages/hooks/useVisitMutations';
import { useVisitMedia } from '../../media/hooks/useMediaQueries';
import { MediaGallery } from '../../media/components/MediaGallery';
import { MediaUploader } from '../../media/components/MediaUploader';
import { ActionMenu, type ActionMenuItem } from '../../../components/ActionMenu/ActionMenu';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import type { VisitsQuery } from '../../../graphql/generated/graphql';
import type { MediaTarget } from '../../media/mediaOwner';
import styles from './DetailView.module.css';

type Visit = VisitsQuery['visits'][number];

function formatFullDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface VisitDetailProps {
  visit: Visit;
  canEdit: boolean;
  onClose: () => void;
  onBack: () => void;
  onRequestDelete?: (visit: Visit) => void;
  mediaTargets?: MediaTarget[];
}

export function VisitDetail({ visit, canEdit, onClose, onBack, onRequestDelete, mediaTargets }: VisitDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, deleteVisit] = useDeleteVisit();
  const [{ data: mediaData }, reexecuteMedia] = useVisitMedia(visit.id);
  const media = mediaData?.visitMedia ?? [];
  const refetchMedia = useCallback(() => reexecuteMedia({ requestPolicy: 'network-only' }), [reexecuteMedia]);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteVisit({ id: visit.id }, { additionalTypenames: ['Visit'] });
    if (result.error || !result.data?.deleteVisit.success) {
      setDeleting(false);
      setDeleteError('Impossible de supprimer cette visite. Réessayez.');
      return;
    }
    // Parent slides back to the stage, no need to reset local state.
    onBack();
  }

  const menuItems: ActionMenuItem[] = canEdit
    ? [
        { label: 'Supprimer', onClick: () => onRequestDelete ? onRequestDelete(visit) : setConfirmDelete(true), danger: true },
      ]
    : [];

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <button className={styles.back} onClick={onBack}>← Retour à la timeline</button>
          <p className={styles.label}>{formatFullDate(visit.date)}</p>
          <h3 className={styles.title}>{visit.title ?? visit.date}</h3>
        </div>
        {menuItems.length > 0 && (
          <ActionMenu items={menuItems} ariaLabel="Actions sur la visite" />
        )}
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      <div className={styles.body}>
        {visit.description && (
          <p className={styles.description}>{visit.description}</p>
        )}

        <MediaGallery media={media} owner={{ type: 'visit', id: visit.id }} isAdmin={canEdit} onDeleted={refetchMedia} mediaTargets={mediaTargets} />

        {canEdit && (
          <MediaUploader owner={{ type: 'visit', id: visit.id }} tripID={visit.tripID} onUploadComplete={refetchMedia} />
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer cette visite ?"
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
