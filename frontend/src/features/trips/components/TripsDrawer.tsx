import type { Trip } from '../mockData';
import { TripCard } from './TripCard';
import styles from './TripsDrawer.module.css';

interface TripsDrawerProps {
  trips: Trip[];
  open: boolean;
  onClose: () => void;
}

export function TripsDrawer({ trips, open, onClose }: TripsDrawerProps) {
  return (
    <>
      {open && (
        <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`${styles.drawer} ${open ? styles.open : ''}`}
        aria-label="Liste des voyages"
      >
        <div className={styles.header}>
          <span className={styles.title}>Tous les voyages</span>
          <button className={styles.close} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className={styles.list}>
          {trips.map((trip, index) => (
            <TripCard key={trip.id} trip={trip} index={index} />
          ))}
        </div>
      </aside>
    </>
  );
}
