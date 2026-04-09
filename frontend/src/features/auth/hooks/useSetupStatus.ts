import { useQuery } from 'urql';
import { gql } from '../../../graphql/generated';

const SETUP_STATUS_QUERY = gql(`
  query SetupStatus {
    setupStatus {
      done
    }
  }
`);

export function useSetupStatus() {
  const [{ data, fetching }] = useQuery({ query: SETUP_STATUS_QUERY });
  return { done: data?.setupStatus.done, fetching };
}
