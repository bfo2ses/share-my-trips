import { useMutation } from 'urql';
import { gql } from '../../../graphql/generated';

const CREATE_TRAVEL_LEG = gql(`
  mutation CreateTravelLeg($input: CreateTravelLegInput!) {
    createTravelLeg(input: $input) {
      travelLeg {
        id
        tripID
        fromStageID
        toStageID
        transport
        description
        distanceKm
        createdAt
        updatedAt
      }
      errors { field message }
    }
  }
`);

const UPDATE_TRAVEL_LEG = gql(`
  mutation UpdateTravelLeg($id: ID!, $input: UpdateTravelLegInput!) {
    updateTravelLeg(id: $id, input: $input) {
      travelLeg {
        id
        tripID
        fromStageID
        toStageID
        transport
        description
        distanceKm
        createdAt
        updatedAt
      }
      errors { field message }
    }
  }
`);

const MOVE_TRAVEL_LEG = gql(`
  mutation MoveTravelLeg($id: ID!, $input: MoveTravelLegInput!) {
    moveTravelLeg(id: $id, input: $input) {
      travelLeg {
        id
        tripID
        fromStageID
        toStageID
        transport
        description
        distanceKm
        createdAt
        updatedAt
      }
      errors { field message }
    }
  }
`);

const DELETE_TRAVEL_LEG = gql(`
  mutation DeleteTravelLeg($id: ID!) {
    deleteTravelLeg(id: $id) {
      success
      errors { field message }
    }
  }
`);

const CALCULATE_TRAVEL_LEG_DISTANCE = gql(`
  mutation CalculateTravelLegDistance($fromStageID: ID!, $toStageID: ID!, $transport: TravelLegTransport!) {
    calculateTravelLegDistance(fromStageID: $fromStageID, toStageID: $toStageID, transport: $transport) {
      distanceKm
      errors { field message }
    }
  }
`);

export function useCreateTravelLeg() {
  return useMutation(CREATE_TRAVEL_LEG);
}

export function useUpdateTravelLeg() {
  return useMutation(UPDATE_TRAVEL_LEG);
}

export function useMoveTravelLeg() {
  return useMutation(MOVE_TRAVEL_LEG);
}

export function useDeleteTravelLeg() {
  return useMutation(DELETE_TRAVEL_LEG);
}

export function useCalculateTravelLegDistance() {
  return useMutation(CALCULATE_TRAVEL_LEG_DISTANCE);
}
