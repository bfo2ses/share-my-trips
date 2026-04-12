import { useMutation } from 'urql';
import { gql } from '../../../graphql/generated';

const CREATE_ACCOUNT = gql(`
  mutation CreateAccount($input: CreateAccountInput!) {
    createAccount(input: $input) {
      account {
        id
        name
        email
        role
      }
      errors {
        field
        message
      }
    }
  }
`);

const DELETE_ACCOUNT = gql(`
  mutation DeleteAccount($id: ID!) {
    deleteAccount(id: $id) {
      success
      errors {
        field
        message
      }
    }
  }
`);

const CHANGE_PASSWORD = gql(`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      account {
        id
      }
      errors {
        field
        message
      }
    }
  }
`);

export function useCreateAccount() {
  return useMutation(CREATE_ACCOUNT);
}

export function useDeleteAccount() {
  return useMutation(DELETE_ACCOUNT);
}

export function useChangePassword() {
  return useMutation(CHANGE_PASSWORD);
}
