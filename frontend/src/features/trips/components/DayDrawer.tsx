import { useDayMedia } from '../../media/hooks/useMediaQueries';
import { MediaGallery } from '../../media/components/MediaGallery';
import { MediaUploader } from '../../media/components/MediaUploader';
import type { DaysQuery } from '../../../graphql/generated/graphql';
import styles from './DayDrawer.module.css';

type Day = DaysQuery['days'][number];

interface DayDrawerProps {
  day: Day;
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function DayDrawer({ day, open, onClose, isAdmin = false }: DayDrawerProps) {
  const [{ data: mediaData }, reexecuteMedia] = useDayMedia(day.id);
  const media = mediaData?.dayMedia ?? [];

  const refetchMedia = () => reexecuteMedia({ requestPolicy: 'network-only' });

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}
      <aside className={`${styles.drawer} ${open ? styles.open : ''}`}>
        <div className={styles.header}>
          <div>
            <p className={styles.date}>{formatDate(day.date)}</p>
            <h3 className={styles.title}>{day.title ?? day.date}</h3>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div className={styles.body}>
          {day.description ? (
            <p className={styles.description}>{day.description}</p>
          ) : (
            <p className={styles.description} style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Aucune description pour ce jour.
            </p>
          )}

          <MediaGallery media={media} isAdmin={isAdmin} onDeleted={refetchMedia} />

          {isAdmin && (
            <MediaUploader dayID={day.id} tripID={day.tripID} onUploadComplete={refetchMedia} />
          )}
        </div>
      </aside>
    </>
  );
}
