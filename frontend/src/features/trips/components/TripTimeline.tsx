import type { TripsQuery } from '../../../graphql/generated/graphql';
import { TripCard } from './TripCard';
import styles from './TripTimeline.module.css';

type TripSummary = TripsQuery['trips'][number];

interface TripTimelineProps {
  datedTrips: TripSummary[];
  undatedTrips: TripSummary[];
  isAdmin: boolean;
  onTripSelect: (trip: TripSummary) => void;
}

export function TripTimeline({ datedTrips, undatedTrips, isAdmin, onTripSelect }: TripTimelineProps) {
  if (datedTrips.length === 0 && undatedTrips.length === 0) {
    return (
      <section className={styles.timeline} aria-label="Timeline des voyages">
        <p className={styles.empty}>Aucun voyage pour le moment.</p>
      </section>
    );
  }

  return (
    <section className={styles.timeline} aria-label="Timeline des voyages">
      {datedTrips.length > 0 && (
        <TimelineSection title="Mes voyages" trips={datedTrips} isAdmin={isAdmin} onTripSelect={onTripSelect} startIndex={0} />
      )}
      {undatedTrips.length > 0 && (
        <TimelineSection
          title="À planifier"
          trips={undatedTrips}
          isAdmin={isAdmin}
          onTripSelect={onTripSelect}
          startIndex={datedTrips.length}
        />
      )}
    </section>
  );
}

function TimelineSection({
  title,
  trips,
  isAdmin,
  onTripSelect,
  startIndex,
}: {
  title: string;
  trips: TripSummary[];
  isAdmin: boolean;
  onTripSelect: (trip: TripSummary) => void;
  startIndex: number;
}) {
  const sectionId = `timeline-${title.replaceAll(' ', '-').toLowerCase()}`;

  return (
    <section className={styles.section} aria-labelledby={sectionId}>
      <h2 id={sectionId} className={styles.heading}>
        <span className={styles.headingRule} aria-hidden="true" />
        {title}
      </h2>
      <div className={styles.cards}>
        {trips.map((trip, index) => (
          <div className={styles.entry} key={trip.id}>
            <span className={styles.year}>{trip.startDate?.slice(0, 4) ?? '—'}</span>
            <span className={styles.dot} aria-hidden="true" />
            <TripCard trip={trip} index={startIndex + index} isAdmin={isAdmin} onEdit={onTripSelect} />
          </div>
        ))}
      </div>
    </section>
  );
}
