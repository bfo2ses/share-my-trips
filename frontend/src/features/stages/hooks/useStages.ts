import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

export const STAGES_QUERY = gql(`
  query Stages($tripID: ID!) {
    stages(tripID: $tripID) {
      id
      tripID
      city
      displayName
      lat
      lng
      description
    }
  }
`);

export function useStages(tripID: string) {
  const [result] = useQuery({ query: STAGES_QUERY, variables: { tripID } });
  return result;
}
