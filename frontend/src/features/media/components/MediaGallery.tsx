import { useState, useRef, useCallback } from 'react';
import { useDeleteMedia, useReorderMedia, useUpdateMediaCaption } from '../hooks/useMediaMutations';
import { MediaLightbox } from './MediaLightbox';
import type { DayMediaQuery } from '../../../graphql/generated/graphql';
import styles from './MediaGallery.module.css';

type Media = DayMediaQuery['dayMedia'][number];

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
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const [, deleteMedia] = useDeleteMedia();
  const [, reorderMedia] = useReorderMedia();
  const [, updateCaption] = useUpdateMediaCaption();

  const items = localMedia ?? media;

  // Reset local state when props change (after refetch).
  const prevMediaRef = useRef(media);
  if (media !== prevMediaRef.current) {
    prevMediaRef.current = media;
    setLocalMedia(null);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await deleteMedia({ id }, { additionalTypenames: ['Media'] });
    onDeleted();
  }

  // --- Drag and drop ---
  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  }, []);

  const handleDrop = useCallback(async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...items];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, moved);

    // Optimistic update.
    setLocalMedia(reordered);

    const newOrder = reordered.map((m) => m.id);
    const dayID = items[0]?.dayID;
    if (dayID) {
      const result = await reorderMedia({ dayID, mediaIDs: newOrder }, { additionalTypenames: ['Media'] });
      if (result.error) {
        setLocalMedia(null); // Revert on error.
      }
    }

    dragItem.current = null;
    dragOverItem.current = null;
  }, [items, reorderMedia]);

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
    return <p className={styles.empty}>Aucun média pour ce jour.</p>;
  }

  return (
    <>
      <div className={styles.gallery}>
        {items.map((m, i) => (
          <div
            key={m.id}
            className={styles.thumbWrapper}
            draggable={isAdmin}
            onDragStart={isAdmin ? () => handleDragStart(i) : undefined}
            onDragOver={isAdmin ? (e) => handleDragOver(e, i) : undefined}
            onDrop={isAdmin ? handleDrop : undefined}
          >
            <button
              className={styles.thumb}
              onClick={() => setLightboxIndex(i)}
            >
              <img src={m.thumbUrl} alt={m.caption ?? m.filename} loading="lazy" />
              {m.contentType.startsWith('video/') && (
                <span className={styles.playBadge}>▶</span>
              )}
              {isAdmin && (
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => handleDelete(e, m.id)}
                  aria-label="Supprimer"
                >
                  ✕
                </button>
              )}
            </button>
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
          </div>
        ))}
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
