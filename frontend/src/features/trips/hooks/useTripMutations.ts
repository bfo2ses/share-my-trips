import { useMutation } from 'urql';
import { gql } from '../../../graphql/generated';

const CREATE_TRIP = gql(`
  mutation CreateTrip($input: CreateTripInput!) {
    createTrip(input: $input) {
      trip {
        id
        title
        country
        description
        startDate
        endDate
        status
        coverPhoto
      }
      errors {
        field
        message
      }
    }
  }
`);

const UPDATE_TRIP = gql(`
  mutation UpdateTrip($id: ID!, $input: UpdateTripInput!) {
    updateTrip(id: $id, input: $input) {
      trip {
        id
        title
        country
        description
        startDate
        endDate
        status
        coverPhoto
      }
      errors {
        field
        message
      }
    }
  }
`);

const DELETE_TRIP = gql(`
  mutation DeleteTrip($id: ID!) {
    deleteTrip(id: $id) {
      success
      errors {
        field
        message
      }
    }
  }
`);

const PUBLISH_TRIP = gql(`
  mutation PublishTrip($id: ID!) {
    publishTrip(id: $id) {
      trip {
        id
        status
      }
      errors {
        field
        message
      }
    }
  }
`);

const UNPUBLISH_TRIP = gql(`
  mutation UnpublishTrip($id: ID!) {
    unpublishTrip(id: $id) {
      trip {
        id
        status
      }
      errors {
        field
        message
      }
    }
  }
`);

const CLOSE_TRIP = gql(`
  mutation CloseTrip($id: ID!, $input: CloseTripInput!) {
    closeTrip(id: $id, input: $input) {
      trip {
        id
        status
        startDate
        endDate
      }
      errors {
        field
        message
      }
    }
  }
`);

const REOPEN_TRIP = gql(`
  mutation ReopenTrip($id: ID!) {
    reopenTrip(id: $id) {
      trip {
        id
        status
      }
      errors {
        field
        message
      }
    }
  }
`);

export function useCreateTrip() {
  return useMutation(CREATE_TRIP);
}

export function useUpdateTrip() {
  return useMutation(UPDATE_TRIP);
}

export function useDeleteTrip() {
  return useMutation(DELETE_TRIP);
}

export function usePublishTrip() {
  return useMutation(PUBLISH_TRIP);
}

export function useUnpublishTrip() {
  return useMutation(UNPUBLISH_TRIP);
}

export function useCloseTrip() {
  return useMutation(CLOSE_TRIP);
}

export function useReopenTrip() {
  return useMutation(REOPEN_TRIP);
}
