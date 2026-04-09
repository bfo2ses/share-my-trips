import { useNavigate } from 'react-router-dom';
import type { Trip } from '../mockData';
import styles from './TripCard.module.css';

interface TripCardProps {
  trip: Trip;
  index: number;
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${startDate.toLocaleDateString('fr-FR', opts)} — ${endDate.toLocaleDateString('fr-FR', opts)}`;
}

export function TripCard({ trip, index }: TripCardProps) {
  const navigate = useNavigate();
  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => navigate(`/trips/${trip.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/trips/${trip.id}`)}
    >
      <div
        className={styles.cover}
        style={{ background: `linear-gradient(160deg, ${trip.coverColor}cc 0%, ${trip.coverColor} 100%)` }}
      >
        <span className={styles.country}>{trip.country}</span>
        {trip.status === 'closed' && (
          <span className={styles.statusBadge}>Terminé</span>
        )}
      </div>
      <div className={styles.body}>
        <h2 className={styles.title}>{trip.title}</h2>
        <p className={styles.dates}>{formatDateRange(trip.startDate, trip.endDate)}</p>
      </div>
    </article>
  );
}
