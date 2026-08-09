import { useMutation } from 'urql';
import { gql } from '../../../graphql/generated';

const ADD_VISIT = gql(`
  mutation AddVisit($input: AddVisitInput!) {
    addVisit(input: $input) {
      visit {
        id
        tripID
        stageIDs
        date
        title
        description
        lat
        lng
        position
      }
      errors {
        field
        message
      }
    }
  }
`);

const UPDATE_VISIT = gql(`
  mutation UpdateVisit($id: ID!, $input: UpdateVisitInput!) {
    updateVisit(id: $id, input: $input) {
      visit {
        id
        tripID
        stageIDs
        date
        title
        description
        lat
        lng
        position
      }
      errors {
        field
        message
      }
    }
  }
`);

const DELETE_VISIT = gql(`
  mutation DeleteVisit($id: ID!, $resolutionPlan: [TravelLegResolutionInput!]) {
    deleteVisit(id: $id, resolutionPlan: $resolutionPlan) {
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

const REORDER_VISITS = gql(`
  mutation ReorderVisits($stageID: ID!, $date: String!, $visitIDs: [ID!]!) {
    reorderVisits(stageID: $stageID, date: $date, visitIDs: $visitIDs) {
      visits {
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

export function useAddVisit() {
  return useMutation(ADD_VISIT);
}

export function useUpdateVisit() {
  return useMutation(UPDATE_VISIT);
}

export function useDeleteVisit() {
  return useMutation(DELETE_VISIT);
}

export function useReorderVisits() {
  return useMutation(REORDER_VISITS);
}
