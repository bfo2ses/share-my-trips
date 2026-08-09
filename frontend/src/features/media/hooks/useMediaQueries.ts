import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

const VISIT_MEDIA_QUERY = gql(`
  query VisitMedia($visitID: ID!) {
    visitMedia(visitID: $visitID) {
      id
      visitID
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

export function useVisitMedia(visitID: string) {
  return useQuery({ query: VISIT_MEDIA_QUERY, variables: { visitID } });
}

const TRAVEL_LEG_MEDIA_QUERY = gql(`
  query TravelLegMedia($travelLegID: ID!) {
    travelLegMedia(travelLegID: $travelLegID) {
      id
      visitID
      travelLegID
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

export function useTravelLegMedia(travelLegID: string) {
  return useQuery({ query: TRAVEL_LEG_MEDIA_QUERY, variables: { travelLegID } });
}

const TRIP_MEDIA_QUERY = gql(`
  query TripMedia($tripID: ID!) {
    tripMedia(tripID: $tripID) {
      id
      visitID
      tripID
      contentType
      thumbUrl
    }
  }
`);

// Pass null/undefined to pause the query (e.g. outside edit mode).
// cache-and-network: each unpause/variable change refetches, so cover choices
// pick up photos uploaded since the last fetch. Callers must still filter the
// result by tripID — urql keeps the previous data while paused or refetching.
export function useTripMedia(tripID: string | null | undefined) {
  return useQuery({
    query: TRIP_MEDIA_QUERY,
    variables: { tripID: tripID ?? '' },
    pause: !tripID,
    requestPolicy: 'cache-and-network',
  });
}
