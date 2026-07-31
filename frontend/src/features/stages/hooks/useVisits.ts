import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

export const VISITS_QUERY = gql(`
  query Visits($stageID: ID!) {
    visits(stageID: $stageID) {
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

export function useVisits(stageID: string, options?: { pause?: boolean }) {
  return useQuery({
    query: VISITS_QUERY,
    variables: { stageID },
    pause: options?.pause ?? false,
  });
}
