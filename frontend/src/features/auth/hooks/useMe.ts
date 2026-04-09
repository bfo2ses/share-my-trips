import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

export const ME_QUERY = gql(`
  query Me {
    me {
      id
      name
      email
      role
    }
  }
`);

export function useMe() {
  const [result] = useQuery({ query: ME_QUERY });
  return result;
}
