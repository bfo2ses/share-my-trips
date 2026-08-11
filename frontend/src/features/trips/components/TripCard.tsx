import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { formatDateOnly } from '../../../lib/date';
import { tripColor } from '../utils/tripColor';
import styles from './TripCard.module.css';

type TripSummary = TripsQuery['trips'][number];

interface TripCardProps {
  trip: TripSummary;
  index: number;
  isAdmin?: boolean;
  onEdit?: (trip: TripSummary) => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  CLOSED: 'Terminé',
};

function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  if (!start) return 'Date à définir';
  if (!end) return `À partir du ${formatDateOnly(start, opts)}`;
  return `${formatDateOnly(start, opts)} — ${formatDateOnly(end, opts)}`;
}

export function TripCard({ trip, index, isAdmin, onEdit }: TripCardProps) {
  const navigate = useNavigate();
  // Fallback to the gradient when the cover URL is dead (media deleted, or
  // legacy marker values). Keyed by URL so a new cover retries the load.
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const showCover = !!trip.coverPhoto && trip.coverPhoto !== brokenUrl;

  // In edit mode the card opens the trip form, which carries all lifecycle
  // actions (publish, close, delete…) — the card itself has no menu.
  function handleCardClick() {
    if (isAdmin && onEdit) {
      onEdit(trip);
      return;
    }
    navigate(`/trips/${trip.id}`);
  }

  const badgeClass =
    trip.status === 'DRAFT' ? styles.statusDraft :
    trip.status === 'CLOSED' ? styles.statusClosed :
    styles.statusPublished;

  return (
    <button
      type="button"
      className={styles.card}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={handleCardClick}
    >
      <div
        className={styles.cover}
        style={{ background: `linear-gradient(160deg, ${tripColor(trip.id)}cc 0%, ${tripColor(trip.id)} 100%)` }}
      >
        {showCover && (
          <>
            <img
              className={styles.coverImg}
              src={trip.coverPhoto}
              alt=""
              loading="lazy"
              onError={() => setBrokenUrl(trip.coverPhoto)}
            />
            <div className={styles.coverScrim} aria-hidden="true" />
          </>
        )}
        <span className={styles.country}>{trip.country}</span>
        <span className={`${styles.statusBadge} ${badgeClass}`}>
          {STATUS_LABELS[trip.status]}
        </span>
      </div>

      <div className={styles.body}>
        <h2 className={styles.title}>{trip.title}</h2>
        <p className={styles.dates}>{formatDateRange(trip.startDate, trip.endDate)}</p>
      </div>
    </button>
  );
}
