import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

const TRIP_DETAIL_QUERY = gql(`
  query TripDetail($id: ID!) {
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
    stages(tripID: $id) {
      id
      tripID
      city
      displayName
      lat
      lng
      description
    }
    tripDays(tripID: $id) {
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

export function useTripDetail(id: string) {
  return useQuery({ query: TRIP_DETAIL_QUERY, variables: { id } });
}
