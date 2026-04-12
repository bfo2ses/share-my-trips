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
