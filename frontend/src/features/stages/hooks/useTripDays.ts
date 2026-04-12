import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

const TRIP_DAYS_QUERY = gql(`
  query TripDays($tripID: ID!) {
    tripDays(tripID: $tripID) {
      id
      tripID
      stageIDs
      date
      title
      description
      lat
      lng
    }
  }
`);

export function useTripDays(tripID: string) {
  return useQuery({
    query: TRIP_DAYS_QUERY,
    variables: { tripID },
  });
}
