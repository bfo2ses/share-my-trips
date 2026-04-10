import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

export const TRIP_QUERY = gql(`
  query Trip($id: ID!) {
    trip(id: $id) {
      id
      title
      country
      description
      lat
      lng
      startDate
      endDate
      status
      coverPhoto
    }
  }
`);

export function useTrip(id: string) {
  const [result] = useQuery({ query: TRIP_QUERY, variables: { id } });
  return result;
}
