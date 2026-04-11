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

export function useDays(stageID: string, options?: { pause?: boolean }) {
  const [result] = useQuery({
    query: DAYS_QUERY,
    variables: { stageID },
    pause: options?.pause ?? false,
  });
  return result;
}
