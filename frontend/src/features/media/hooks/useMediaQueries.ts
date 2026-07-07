import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

const DAY_MEDIA_QUERY = gql(`
  query DayMedia($dayID: ID!) {
    dayMedia(dayID: $dayID) {
      id
      dayID
      tripID
      filename
      contentType
      caption
      url
      thumbUrl
      position
      createdAt
    }
  }
`);

export function useDayMedia(dayID: string) {
  return useQuery({ query: DAY_MEDIA_QUERY, variables: { dayID } });
}

const TRIP_MEDIA_QUERY = gql(`
  query TripMedia($tripID: ID!) {
    tripMedia(tripID: $tripID) {
      id
      dayID
      contentType
      thumbUrl
    }
  }
`);

// Pass null/undefined to pause the query (e.g. outside edit mode).
export function useTripMedia(tripID: string | null | undefined) {
  return useQuery({ query: TRIP_MEDIA_QUERY, variables: { tripID: tripID ?? '' }, pause: !tripID });
}
