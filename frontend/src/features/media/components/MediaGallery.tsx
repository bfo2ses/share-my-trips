import { useState, useRef } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { useDeleteMedia, useMoveMedia, useReorderMedia, useReorderTravelLegMedia, useUpdateMediaCaption } from '../hooks/useMediaMutations';
import { MediaLightbox } from './MediaLightbox';
import { MediaUploader } from './MediaUploader';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import type { Media } from '../../../graphql/generated/graphql';
import type { MediaOwner, MediaTarget } from '../mediaOwner';
import styles from './MediaGallery.module.css';

interface MediaGalleryProps {
  media: Media[];
  owner: MediaOwner;
  tripID: string;
  isAdmin: boolean;
  onDeleted: () => void;
  mediaTargets?: MediaTarget[];
}

export function MediaGallery({ media, owner, tripID, isAdmin, onDeleted, mediaTargets = [] }: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [localMedia, setLocalMedia] = useState<Media[] | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedIDs, setSelectedIDs] = useState<string[]>([]);
  const [destinationKey, setDestinationKey] = useState('');
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [{ fetching: deleting }, deleteMedia] = useDeleteMedia();
  const [, reorderMedia] = useReorderMedia();
  const [, reorderTravelLegMedia] = useReorderTravelLegMedia();
  const [, updateCaption] = useUpdateMediaCaption();
  const [{ fetching: moving }, moveMedia] = useMoveMedia();

  const items = localMedia ?? media;
  // Nothing to reorder against with a single item.
  const canDrag = isAdmin && items.length > 1;
  const destinations = mediaTargets.filter((target) => target.owner.type !== owner.type || target.owner.id !== owner.id);

  // Reset local state when props change (after refetch).
  const prevMediaRef = useRef(media);
  if (media !== prevMediaRef.current) { // eslint-disable-line react-hooks/refs
    prevMediaRef.current = media; // eslint-disable-line react-hooks/refs
    setLocalMedia(null);
  }

  // Require a small movement before a press counts as a drag, so a plain
  // click still opens the lightbox instead of being swallowed.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceIndex = items.findIndex((m) => m.id === active.id);
    const targetIndex = items.findIndex((m) => m.id === over.id);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = arrayMove(items, sourceIndex, targetIndex);

    // Optimistic update.
    setLocalMedia(reordered);

    if (owner.type === 'visit') {
      const result = await reorderMedia(
        { visitID: owner.id, mediaIDs: reordered.map((m) => m.id) },
        { additionalTypenames: ['Media'] },
      );
      const errors = result.data?.reorderMedia.errors ?? [];
      if (result.error || errors.length > 0) {
        setLocalMedia(null); // Revert on error.
        setActionError(errors.map((error) => error.message).join(' ') || 'Impossible de réorganiser les médias.');
      }
      return;
    }

    const result = await reorderTravelLegMedia(
      { travelLegID: owner.id, mediaIDs: reordered.map((m) => m.id) },
      { additionalTypenames: ['Media'] },
    );
    const errors = result.data?.reorderTravelLegMedia.errors ?? [];
    if (result.error || errors.length > 0) {
      setLocalMedia(null); // Revert on error.
      setActionError(errors.map((error) => error.message).join(' ') || 'Impossible de réorganiser les médias.');
    }
  }

  // --- Caption editing ---
  function handleCaptionClick(e: React.MouseEvent, m: Media) {
    e.stopPropagation();
    setEditingCaption(m.id);
    setCaptionValue(m.caption ?? '');
  }

  async function handleCaptionSave(id: string) {
    setEditingCaption(null);
    const result = await updateCaption({ id, caption: captionValue || null }, { additionalTypenames: ['Media'] });
    const errors = result.data?.updateMediaCaption.errors ?? [];
    if (result.error || errors.length > 0) {
      setActionError(errors.map((error) => error.message).join(' ') || 'Impossible de modifier la légende.');
      return;
    }
    onDeleted(); // Refetch to sync.
  }

  function toggleSelected(id: string) {
    setSelectedIDs((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function handleMove() {
    const destination = destinations.find((target) => ownerKey(target.owner) === destinationKey);
    if (!destination || selectedIDs.length === 0) return;
    setMoveError(null);
    const result = await moveMedia({
      input: {
        mediaIDs: selectedIDs,
        visitID: destination.owner.type === 'visit' ? destination.owner.id : null,
        travelLegID: destination.owner.type === 'travelLeg' ? destination.owner.id : null,
      },
    }, { additionalTypenames: ['Media'] });
    const errors = result.data?.moveMedia.errors ?? [];
    if (result.error || errors.length > 0) {
      setMoveError(errors.map((error) => error.message).join(' ') || result.error?.message || 'Impossible de déplacer les médias.');
      return;
    }
    setSelectedIDs([]);
    setDestinationKey('');
    setMoveModalOpen(false);
    onDeleted();
  }

  async function handleBulkDelete() {
    if (selectedIDs.length === 0) return;
    setDeleteError(null);
    const deletedIDs: string[] = [];

    for (const id of selectedIDs) {
      const result = await deleteMedia({ id }, { additionalTypenames: ['Media'] });
      const errors = result.data?.deleteMedia.errors ?? [];
      if (result.error || !result.data?.deleteMedia.success || errors.length > 0) {
        setSelectedIDs((current) => current.filter((mediaID) => !deletedIDs.includes(mediaID)));
        if (deletedIDs.length > 0) onDeleted();
        setDeleteError(errors.map((error) => error.message).join(' ') || result.error?.message || 'Impossible de supprimer les médias.');
        return;
      }
      deletedIDs.push(id);
    }

    setSelectedIDs([]);
    setDeleteModalOpen(false);
    onDeleted();
  }

  function openMoveModal() {
    setMoveError(null);
    setDestinationKey('');
    setMoveModalOpen(true);
  }

  function closeMoveModal() {
    if (moving) return;
    setMoveError(null);
    setMoveModalOpen(false);
  }

  function openDeleteModal() {
    setDeleteError(null);
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteError(null);
    setDeleteModalOpen(false);
  }

  if (items.length === 0 && !isAdmin) {
    return null;
  }

  function renderThumb(m: Media, i: number) {
    return (
      <>
        {isAdmin && (
          <label className={styles.selectBox} onPointerDown={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedIDs.includes(m.id)}
              onChange={() => toggleSelected(m.id)}
              aria-label={`Sélectionner ${m.filename}`}
            />
          </label>
        )}
        {isAdmin ? (
          <div className={`${styles.thumb} ${styles.thumbDisabled}`}>
            {thumbnailContent(m)}
          </div>
        ) : (
          <button className={styles.thumb} onClick={() => setLightboxIndex(i)}>
            {thumbnailContent(m)}
          </button>
        )}
        {isAdmin && editingCaption === m.id ? (
          <input
            className={styles.captionInput}
            value={captionValue}
            onChange={(e) => setCaptionValue(e.target.value)}
            onBlur={() => handleCaptionSave(m.id)}
            onKeyDown={(e) => e.key === 'Enter' && handleCaptionSave(m.id)}
            autoFocus
            placeholder="Légende..."
          />
        ) : (
          <span
            className={`${styles.captionText} ${isAdmin ? styles.captionEditable : ''}`}
            onClick={isAdmin ? (e) => handleCaptionClick(e, m) : undefined}
          >
            {m.caption || (isAdmin ? 'Ajouter une légende' : '')}
          </span>
        )}
      </>
    );
  }

  function thumbnailContent(m: Media) {
    return (
      <>
        <img src={m.thumbUrl} alt={m.caption ?? m.filename} loading="lazy" />
        {m.contentType.startsWith('video/') && (
          <span className={styles.playBadge}>▶</span>
        )}
      </>
    );
  }

  return (
    <>
      {actionError && <p role="alert" className={styles.errorMessage}>{actionError}</p>}
      <div className={styles.galleryFrame}>
        <div className={styles.gallery}>
          {canDrag ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map((m) => m.id)} strategy={rectSortingStrategy}>
                {items.map((m, i) => (
                  <SortableThumb key={m.id} id={m.id}>
                    {renderThumb(m, i)}
                  </SortableThumb>
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            items.map((m, i) => (
              <div key={m.id} className={styles.thumbWrapper}>
                {renderThumb(m, i)}
              </div>
            ))
          )}
        </div>
      </div>
      {isAdmin && (
        <div className={styles.mediaActionsSlot}>
          {selectedIDs.length > 0 ? (
            <div className={styles.selectionBar} role="toolbar" aria-label="Actions sur la sélection">
              <span className={styles.selectionCount}>
                <strong>{selectedIDs.length}</strong>
                <span>média{selectedIDs.length > 1 ? 's' : ''} sélectionné{selectedIDs.length > 1 ? 's' : ''}</span>
              </span>
              <div className={styles.selectionActions}>
                <button type="button" className={styles.clearSelection} onClick={() => setSelectedIDs([])} aria-label="Annuler la sélection" data-tooltip="Annuler la sélection">
                  <span className={styles.actionIcon} aria-hidden="true">×</span>
                  <span className={styles.actionLabel}>Annuler</span>
                </button>
                <button type="button" className={styles.moveButton} onClick={openMoveModal} aria-label="Déplacer vers…" data-tooltip="Déplacer vers…">
                  <span className={styles.actionIcon} aria-hidden="true">↗</span>
                  <span className={styles.actionLabel}>Déplacer vers…</span>
                </button>
                <button type="button" className={styles.deleteSelectionButton} onClick={openDeleteModal} aria-label="Supprimer la sélection" data-tooltip="Supprimer la sélection">
                  <span className={styles.actionIcon} aria-hidden="true">⌫</span>
                  <span className={styles.actionLabel}>Supprimer</span>
                </button>
              </div>
            </div>
          ) : (
            <MediaUploader owner={owner} tripID={tripID} onUploadComplete={onDeleted} />
          )}
        </div>
      )}

      <MediaLightbox
        media={items}
        index={lightboxIndex}
        open={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
      />
      <ConfirmModal
        open={moveModalOpen}
        title="Déplacer les médias"
        message={moveError ?? undefined}
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        busy={moving}
        confirmDisabled={!destinationKey || destinations.length === 0}
        onConfirm={handleMove}
        onCancel={closeMoveModal}
      >
        <label className={styles.moveDestination}>
          Destination
          <select
            aria-label="Destination du déplacement"
            value={destinationKey}
            onChange={(e) => {
              setMoveError(null);
              setDestinationKey(e.target.value);
            }}
            disabled={destinations.length === 0}
          >
            <option value="">Choisir une destination…</option>
            {destinations.map((target) => (
              <option key={ownerKey(target.owner)} value={ownerKey(target.owner)}>{target.label}</option>
            ))}
          </select>
          {destinations.length === 0 && <span>Aucune autre visite ou trajet disponible dans ce voyage.</span>}
        </label>
      </ConfirmModal>
      <ConfirmModal
        open={deleteModalOpen}
        title="Supprimer les médias"
        message={deleteError ?? (selectedIDs.length > 1
          ? `${selectedIDs.length} médias seront définitivement supprimés.`
          : '1 média sera définitivement supprimé.')}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger
        busy={deleting}
        onConfirm={handleBulkDelete}
        onCancel={closeDeleteModal}
      />
    </>
  );
}

function ownerKey(owner: MediaOwner) {
  return `${owner.type}:${owner.id}`;
}

function SortableThumb({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${styles.thumbWrapper} ${styles.sortable}`} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
