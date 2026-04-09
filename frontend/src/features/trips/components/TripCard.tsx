import { useNavigate } from 'react-router-dom';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { tripColor } from '../utils/tripColor';
import styles from './TripCard.module.css';

type TripSummary = TripsQuery['trips'][number];

interface TripCardProps {
  trip: TripSummary;
  index: number;
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '';
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${new Date(start).toLocaleDateString('fr-FR', opts)} — ${new Date(end).toLocaleDateString('fr-FR', opts)}`;
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
        style={{ background: `linear-gradient(160deg, ${tripColor(trip.id)}cc 0%, ${tripColor(trip.id)} 100%)` }}
      >
        <span className={styles.country}>{trip.country}</span>
        {trip.status === 'CLOSED' && (
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
