import type { TripsQuery } from '../../../graphql/generated/graphql';
import { TripCard } from './TripCard';
import styles from './TripsDrawer.module.css';

type TripSummary = TripsQuery['trips'][number];

interface TripsDrawerProps {
  trips: TripSummary[];
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onEdit?: (trip: TripSummary) => void;
  onCreate?: () => void;
}

export function TripsDrawer({ trips, open, onClose, isAdmin, onEdit, onCreate }: TripsDrawerProps) {
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
          <div className={styles.headerActions}>
            {isAdmin && onCreate && (
              <button className={styles.addBtn} onClick={onCreate} aria-label="Créer un voyage">
                +
              </button>
            )}
            <button className={styles.close} onClick={onClose} aria-label="Fermer">
              ✕
            </button>
          </div>
        </div>
        <div className={styles.list}>
          {trips.map((trip, index) => (
            <TripCard
              key={trip.id}
              trip={trip}
              index={index}
              isAdmin={isAdmin}
              onEdit={onEdit}
            />
          ))}
          {trips.length === 0 && (
            <p className={styles.empty}>Aucun voyage pour le moment.</p>
          )}
        </div>
      </aside>
    </>
  );
}
