import { useCallback, useState } from 'react';
import { ActionMenu, type ActionMenuItem } from '../../../components/ActionMenu/ActionMenu';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import { MediaGallery } from '../../media/components/MediaGallery';
import { MediaUploader } from '../../media/components/MediaUploader';
import { useTravelLegMedia } from '../../media/hooks/useMediaQueries';
import { useDeleteTravelLeg } from '../hooks/useTravelLegMutations';
import { formatDistanceKm, transportLabel } from '../transport';
import { TransportIcon } from './TransportIcon';
import type { MediaTarget } from '../../media/mediaOwner';
import type { TravelLegData } from './TravelLegForm';
import styles from '../../trips/components/DetailView.module.css';

interface TravelLegDetailProps {
  travelLeg: TravelLegData;
  canEdit: boolean;
  onClose: () => void;
  onBack: () => void;
  onEdit?: () => void;
  mediaTargets?: MediaTarget[];
}

export function TravelLegDetail({ travelLeg, canEdit, onClose, onBack, onEdit, mediaTargets }: TravelLegDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, deleteTravelLeg] = useDeleteTravelLeg();
  const [{ data: mediaData }, reexecuteMedia] = useTravelLegMedia(travelLeg.id);
  const refetchMedia = useCallback(() => reexecuteMedia({ requestPolicy: 'network-only' }), [reexecuteMedia]);
  const distance = formatDistanceKm(travelLeg.distanceKm);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteTravelLeg({ id: travelLeg.id }, { additionalTypenames: ['TravelLeg'] });
    const errors = result.data?.deleteTravelLeg.errors ?? [];
    if (result.error || !result.data?.deleteTravelLeg.success || errors.length > 0) {
      setDeleting(false);
      setDeleteError(errors.map((error) => error.message).join(' ') || 'Impossible de supprimer ce trajet. Réessayez.');
      return;
    }
    onBack();
  }

  const menuItems: ActionMenuItem[] = canEdit
    ? [
      ...(onEdit ? [{ label: 'Modifier', onClick: onEdit }] : []),
      { label: 'Supprimer', onClick: () => setConfirmDelete(true), danger: true },
    ]
    : [];

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <button type="button" className={styles.back} onClick={onBack}>← Retour à la timeline</button>
          <p className={styles.label}><TransportIcon transport={travelLeg.transport} /> {transportLabel(travelLeg.transport)}</p>
          <h3 className={styles.title}>Trajet</h3>
        </div>
        {menuItems.length > 0 && <ActionMenu items={menuItems} ariaLabel="Actions sur le trajet" />}
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      <div className={styles.body}>
        {distance && <p className={styles.description}>{distance}</p>}
        {travelLeg.description && <p className={styles.description}>{travelLeg.description}</p>}
        <MediaGallery media={mediaData?.travelLegMedia ?? []} owner={{ type: 'travelLeg', id: travelLeg.id }} isAdmin={canEdit} onDeleted={refetchMedia} mediaTargets={mediaTargets} />
        {canEdit && <MediaUploader owner={{ type: 'travelLeg', id: travelLeg.id }} tripID={travelLeg.tripID} onUploadComplete={refetchMedia} />}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer ce trajet ?"
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
