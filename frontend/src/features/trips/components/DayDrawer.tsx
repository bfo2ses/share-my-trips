import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import type { Day } from '../mockData';
import styles from './DayDrawer.module.css';

interface DayDrawerProps {
  day: Day;
  open: boolean;
  onClose: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function DayDrawer({ day, open, onClose }: DayDrawerProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}
      <aside className={`${styles.drawer} ${open ? styles.open : ''}`}>
        <div className={styles.header}>
          <div>
            <p className={styles.date}>{formatDate(day.date)}</p>
            <h3 className={styles.title}>{day.title}</h3>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>{day.description}</p>

          {day.photos.length > 0 && (
            <div className={styles.gallery}>
              {day.photos.map((photo, i) => (
                <button
                  key={i}
                  className={styles.thumb}
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Voir ${photo.alt}`}
                >
                  <img src={photo.thumb} alt={photo.alt} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={day.photos.map((p) => ({ src: p.src, alt: p.alt }))}
      />
    </>
  );
}
