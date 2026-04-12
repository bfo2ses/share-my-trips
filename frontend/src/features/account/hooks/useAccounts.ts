import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

const ACCOUNTS_QUERY = gql(`
  query Accounts {
    accounts {
      id
      name
      email
      role
      createdAt
    }
  }
`);

export function useAccounts() {
  return useQuery({ query: ACCOUNTS_QUERY });
}
