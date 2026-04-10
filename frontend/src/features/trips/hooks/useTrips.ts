import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';
import type { TripStatus } from '../../../graphql/generated/graphql';

export const TRIPS_QUERY = gql(`
  query Trips($status: [TripStatus!]) {
    trips(status: $status) {
      id
      title
      country
      lat
      lng
      startDate
      endDate
      status
      coverPhoto
    }
  }
`);

export function useTrips(status?: TripStatus[]) {
  const [result] = useQuery({
    query: TRIPS_QUERY,
    variables: status ? { status } : {},
  });
  return result;
}
