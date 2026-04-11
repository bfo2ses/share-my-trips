import { useMutation } from 'urql';
import { gql } from '../../../graphql/generated';

const ADD_DAY = gql(`
  mutation AddDay($input: AddDayInput!) {
    addDay(input: $input) {
      day {
        id
        tripID
        stageIDs
        date
        title
        description
        lat
        lng
      }
      errors {
        field
        message
      }
    }
  }
`);

const UPDATE_DAY = gql(`
  mutation UpdateDay($id: ID!, $input: UpdateDayInput!) {
    updateDay(id: $id, input: $input) {
      day {
        id
        tripID
        stageIDs
        date
        title
        description
        lat
        lng
      }
      errors {
        field
        message
      }
    }
  }
`);

const DELETE_DAY = gql(`
  mutation DeleteDay($id: ID!) {
    deleteDay(id: $id) {
      success
      errors {
        field
        message
      }
    }
  }
`);

export function useAddDay() {
  return useMutation(ADD_DAY);
}

export function useUpdateDay() {
  return useMutation(UPDATE_DAY);
}

export function useDeleteDay() {
  return useMutation(DELETE_DAY);
}
