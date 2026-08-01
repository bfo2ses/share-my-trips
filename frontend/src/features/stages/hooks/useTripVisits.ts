import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

const TRIP_VISITS_QUERY = gql(`
  query TripVisits($tripID: ID!) {
    tripVisits(tripID: $tripID) {
      id
      tripID
      stageIDs
      date
      title
      description
      lat
      lng
      position
    }
  }
`);

export function useTripVisits(tripID: string) {
  return useQuery({
    query: TRIP_VISITS_QUERY,
    variables: { tripID },
  });
}
