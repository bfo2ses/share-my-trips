import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

// Lean fetch for the home page's "Clôturer" action: closing a trip needs its
// stages (each must carry at least one day) and the days' date range.
const TRIP_CLOSE_DATA_QUERY = gql(`
  query TripCloseData($tripID: ID!) {
    stages(tripID: $tripID) {
      id
      tripID
    }
    tripDays(tripID: $tripID) {
      id
      tripID
      date
      stageIDs
    }
  }
`);

// Pass null/undefined to pause the query (e.g. no published trip being
// edited). Callers must filter the result by tripID — urql keeps the previous
// data while paused or refetching.
export function useTripCloseData(tripID: string | null | undefined) {
  return useQuery({
    query: TRIP_CLOSE_DATA_QUERY,
    variables: { tripID: tripID ?? '' },
    pause: !tripID,
    requestPolicy: 'cache-and-network',
  });
}
