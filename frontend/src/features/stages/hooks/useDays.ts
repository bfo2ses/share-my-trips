import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

export const DAYS_QUERY = gql(`
  query Days($stageID: ID!) {
    days(stageID: $stageID) {
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

export function useDays(stageID: string) {
  const [result] = useQuery({ query: DAYS_QUERY, variables: { stageID } });
  return result;
}
