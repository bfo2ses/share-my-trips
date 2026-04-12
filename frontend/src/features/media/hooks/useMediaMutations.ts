import { useMutation } from 'urql';
import { gql } from '../../../graphql/generated';

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
  mutation ReorderMedia($dayID: ID!, $mediaIDs: [ID!]!) {
    reorderMedia(dayID: $dayID, mediaIDs: $mediaIDs) {
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

export function useReorderMedia() {
  return useMutation(REORDER_MEDIA);
}

export function useDeleteMedia() {
  return useMutation(DELETE_MEDIA);
}
