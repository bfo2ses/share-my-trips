import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { tripColor } from '../utils/tripColor';
import { usePublishTrip, useUnpublishTrip, useDeleteTrip, useReopenTrip } from '../hooks/useTripMutations';
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
  if (!start || !end) return '';
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${new Date(start).toLocaleDateString('fr-FR', opts)} — ${new Date(end).toLocaleDateString('fr-FR', opts)}`;
}

export function TripCard({ trip, index, isAdmin, onEdit }: TripCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [, publishTrip] = usePublishTrip();
  const [, unpublishTrip] = useUnpublishTrip();
  const [, deleteTrip] = useDeleteTrip();
  const [, reopenTrip] = useReopenTrip();

  function handleCardClick() {
    if (menuOpen || confirmDelete) return;
    if (isAdmin && onEdit) {
      onEdit(trip);
      return;
    }
    navigate(`/trips/${trip.id}`);
  }

  function stopAndRun(e: React.MouseEvent, fn: () => void) {
    e.stopPropagation();
    fn();
    setMenuOpen(false);
  }

  const refetchTrips = { additionalTypenames: ['Trip'] };

  async function handlePublish() {
    await publishTrip({ id: trip.id }, { ...refetchTrips });
  }

  async function handleUnpublish() {
    await unpublishTrip({ id: trip.id }, { ...refetchTrips });
  }

  async function handleReopen() {
    await reopenTrip({ id: trip.id }, { ...refetchTrips });
  }

  async function handleDelete() {
    await deleteTrip({ id: trip.id }, { ...refetchTrips });
    setConfirmDelete(false);
  }

  const badgeClass =
    trip.status === 'DRAFT' ? styles.statusDraft :
    trip.status === 'CLOSED' ? styles.statusClosed :
    styles.statusPublished;

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
    >
      <div
        className={styles.cover}
        style={{ background: `linear-gradient(160deg, ${tripColor(trip.id)}cc 0%, ${tripColor(trip.id)} 100%)` }}
      >
        <span className={styles.country}>{trip.country}</span>
        <span className={`${styles.statusBadge} ${badgeClass}`}>
          {STATUS_LABELS[trip.status]}
        </span>

        {isAdmin && (
          <button
            className={styles.menuBtn}
            onClick={(e) => stopAndRun(e, () => setMenuOpen(!menuOpen))}
            aria-label="Actions"
          >
            ···
          </button>
        )}

        {isAdmin && menuOpen && (
          <div className={styles.actionMenu} onClick={(e) => e.stopPropagation()}>
            {trip.status === 'DRAFT' && (
              <button className={styles.actionItem} onClick={(e) => stopAndRun(e, handlePublish)}>
                Publier
              </button>
            )}
            {trip.status === 'PUBLISHED' && (
              <button className={styles.actionItem} onClick={(e) => stopAndRun(e, handleUnpublish)}>
                Repasser en brouillon
              </button>
            )}
            {trip.status === 'CLOSED' && (
              <button className={styles.actionItem} onClick={(e) => stopAndRun(e, handleReopen)}>
                Réouvrir
              </button>
            )}
            <div className={styles.actionDivider} />
            <button
              className={`${styles.actionItem} ${styles.actionDanger}`}
              onClick={(e) => stopAndRun(e, () => setConfirmDelete(true))}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <h2 className={styles.title}>{trip.title}</h2>
        <p className={styles.dates}>{formatDateRange(trip.startDate, trip.endDate)}</p>
      </div>

      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={(e) => e.stopPropagation()}>
          <p>Supprimer ce voyage ?</p>
          <div className={styles.confirmActions}>
            <button className={styles.confirmCancel} onClick={(e) => stopAndRun(e, () => setConfirmDelete(false))}>
              Annuler
            </button>
            <button className={styles.confirmDelete} onClick={(e) => stopAndRun(e, handleDelete)}>
              Supprimer
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
