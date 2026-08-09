import { useMutation } from 'urql';
import { gql } from '../../../graphql/generated';

const ADD_STAGE = gql(`
  mutation AddStage($input: AddStageInput!) {
    addStage(input: $input) {
      stage {
        id
        tripID
        city
        displayName
        lat
        lng
        description
      }
      errors {
        field
        message
      }
      recalculationWarnings {
        travelLegID
        message
      }
    }
  }
`);

const UPDATE_STAGE = gql(`
  mutation UpdateStage($id: ID!, $input: UpdateStageInput!) {
    updateStage(id: $id, input: $input) {
      stage {
        id
        tripID
        city
        displayName
        lat
        lng
        description
      }
      errors {
        field
        message
      }
      recalculationWarnings {
        travelLegID
        message
      }
    }
  }
`);

const DELETE_STAGE = gql(`
  mutation DeleteStage($id: ID!, $resolutionPlan: [TravelLegResolutionInput!]) {
    deleteStage(id: $id, resolutionPlan: $resolutionPlan) {
      success
      errors {
        field
        message
      }
      recalculationWarnings {
        travelLegID
        message
      }
    }
  }
`);

export function useAddStage() {
  return useMutation(ADD_STAGE);
}

export function useUpdateStage() {
  return useMutation(UPDATE_STAGE);
}

export function useDeleteStage() {
  return useMutation(DELETE_STAGE);
}
