import { useMutation } from 'urql';
import { gql } from '../../../graphql/generated';

const MOVE_MEDIA = gql(`
  mutation MoveMedia($input: MoveMediaInput!) {
    moveMedia(input: $input) {
      media {
        id
        visitID
        travelLegID
        position
      }
      errors {
        field
        message
      }
    }
  }
`);

const UPDATE_MEDIA_CAPTION = gql(`
  mutation UpdateMediaCaption($id: ID!, $caption: String) {
    updateMediaCaption(id: $id, caption: $caption) {
      media {
        id
        caption
      }
      errors {
        field
        message
      }
    }
  }
`);

const REORDER_MEDIA = gql(`
  mutation ReorderMedia($visitID: ID!, $mediaIDs: [ID!]!) {
    reorderMedia(visitID: $visitID, mediaIDs: $mediaIDs) {
      media {
        id
        position
      }
      errors {
        field
        message
      }
    }
  }
`);

const DELETE_MEDIA = gql(`
  mutation DeleteMedia($id: ID!) {
    deleteMedia(id: $id) {
      success
      errors {
        field
        message
      }
    }
  }
`);

export function useUpdateMediaCaption() {
  return useMutation(UPDATE_MEDIA_CAPTION);
}

export function useMoveMedia() {
  return useMutation(MOVE_MEDIA);
}

export function useReorderMedia() {
  return useMutation(REORDER_MEDIA);
}

const REORDER_TRAVEL_LEG_MEDIA = gql(`
  mutation ReorderTravelLegMedia($travelLegID: ID!, $mediaIDs: [ID!]!) {
    reorderTravelLegMedia(travelLegID: $travelLegID, mediaIDs: $mediaIDs) {
      media {
        id
        position
      }
      errors {
        field
        message
      }
    }
  }
`);

export function useReorderTravelLegMedia() {
  return useMutation(REORDER_TRAVEL_LEG_MEDIA);
}

export function useDeleteMedia() {
  return useMutation(DELETE_MEDIA);
}
