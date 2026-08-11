import type { TripsQuery } from '../../../graphql/generated/graphql';
import { TripCard } from './TripCard';
import styles from './TripTimeline.module.css';

type TripSummary = TripsQuery['trips'][number];

type TripGroup = {
  year: string | null;
  trips: TripSummary[];
};

function groupTripsByYear(trips: TripSummary[]): TripGroup[] {
  const groups: TripGroup[] = [];
  const datedGroups = new Map<string, TripGroup>();

  for (const trip of trips) {
    const year = trip.startDate?.slice(0, 4) ?? null;
    if (!year) {
      groups.push({ year: null, trips: [trip] });
      continue;
    }

    let group = datedGroups.get(year);
    if (!group) {
      group = { year, trips: [] };
      datedGroups.set(year, group);
      groups.push(group);
    }
    group.trips.push(trip);
  }

  return groups;
}

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
        <TimelineSection title="Mes voyages" groups={groupTripsByYear(datedTrips)} isAdmin={isAdmin} onTripSelect={onTripSelect} startIndex={0} />
      )}
      {undatedTrips.length > 0 && (
        <TimelineSection
          title="À planifier"
          groups={groupTripsByYear(undatedTrips)}
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
  groups,
  isAdmin,
  onTripSelect,
  startIndex,
}: {
  title: string;
  groups: TripGroup[];
  isAdmin: boolean;
  onTripSelect: (trip: TripSummary) => void;
  startIndex: number;
}) {
  const sectionId = `timeline-${title.replaceAll(' ', '-').toLowerCase()}`;
  const indexedGroups = groups.map((group, groupIndex) => ({
    group,
    groupStartIndex: startIndex + groups
      .slice(0, groupIndex)
      .reduce((total, previousGroup) => total + previousGroup.trips.length, 0),
  }));

  return (
    <section className={styles.section} aria-labelledby={sectionId}>
      <h2 id={sectionId} className={styles.heading}>
        <span className={styles.headingRule} aria-hidden="true" />
        {title}
      </h2>
      <div className={styles.groups}>
        {indexedGroups.map(({ group, groupStartIndex }, groupIndex) => {
          return (
            <div className={styles.group} key={group.year ?? `undated-${groupIndex}`}>
              <span className={styles.year}>{group.year ?? '—'}</span>
              <span className={styles.dot} aria-hidden="true" />
              <div className={styles.cards}>
                {group.trips.map((trip, tripIndex) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    index={groupStartIndex + tripIndex}
                    isAdmin={isAdmin}
                    onEdit={onTripSelect}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
