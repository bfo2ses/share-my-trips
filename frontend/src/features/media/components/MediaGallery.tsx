import { useState, useRef } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { useDeleteMedia, useReorderMedia, useUpdateMediaCaption } from '../hooks/useMediaMutations';
import { MediaLightbox } from './MediaLightbox';
import type { VisitMediaQuery } from '../../../graphql/generated/graphql';
import styles from './MediaGallery.module.css';

type Media = VisitMediaQuery['visitMedia'][number];

interface MediaGalleryProps {
  media: Media[];
  isAdmin: boolean;
  onDeleted: () => void;
}

export function MediaGallery({ media, isAdmin, onDeleted }: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [localMedia, setLocalMedia] = useState<Media[] | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState('');

  const [, deleteMedia] = useDeleteMedia();
  const [, reorderMedia] = useReorderMedia();
  const [, updateCaption] = useUpdateMediaCaption();

  const items = localMedia ?? media;
  // Nothing to reorder against with a single item.
  const canDrag = isAdmin && items.length > 1;

  // Reset local state when props change (after refetch).
  const prevMediaRef = useRef(media);
  if (media !== prevMediaRef.current) { // eslint-disable-line react-hooks/refs
    prevMediaRef.current = media; // eslint-disable-line react-hooks/refs
    setLocalMedia(null);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await deleteMedia({ id }, { additionalTypenames: ['Media'] });
    onDeleted();
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

    const visitID = items[0]?.visitID;
    if (visitID) {
      const result = await reorderMedia(
        { visitID, mediaIDs: reordered.map((m) => m.id) },
        { additionalTypenames: ['Media'] },
      );
      if (result.error) {
        setLocalMedia(null); // Revert on error.
      }
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
    await updateCaption({ id, caption: captionValue || null }, { additionalTypenames: ['Media'] });
    onDeleted(); // Refetch to sync.
  }

  if (items.length === 0) {
    return null;
  }

  function renderThumb(m: Media, i: number) {
    return (
      <>
        <button className={styles.thumb} onClick={() => setLightboxIndex(i)}>
          <img src={m.thumbUrl} alt={m.caption ?? m.filename} loading="lazy" />
          {m.contentType.startsWith('video/') && (
            <span className={styles.playBadge}>▶</span>
          )}
        </button>
        {isAdmin && (
          <button
            className={styles.deleteBtn}
            onClick={(e) => handleDelete(e, m.id)}
            aria-label="Supprimer"
          >
            ✕
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

  return (
    <>
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

      <MediaLightbox
        media={items}
        index={lightboxIndex}
        open={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
      />
    </>
  );
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
