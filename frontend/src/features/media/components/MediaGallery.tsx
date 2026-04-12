import { useState } from 'react';
import { useDeleteMedia } from '../hooks/useMediaMutations';
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
  const [, deleteMedia] = useDeleteMedia();

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await deleteMedia({ id }, { additionalTypenames: ['Media'] });
    onDeleted();
  }

  if (media.length === 0) {
    return (
      <p className={styles.empty}>Aucun média pour ce jour.</p>
    );
  }

  return (
    <>
      <div className={styles.gallery}>
        {media.map((m, i) => (
          <button
            key={m.id}
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
            {m.caption && <span className={styles.caption}>{m.caption}</span>}
          </button>
        ))}
      </div>

      <MediaLightbox
        media={media}
        index={lightboxIndex}
        open={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
      />
    </>
  );
}
