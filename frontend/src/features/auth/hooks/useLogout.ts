import { useCallback } from 'react';
import { useMutation } from 'urql';
import { useNavigate } from 'react-router-dom';
import { gql } from '../../../graphql/generated';
import { useAuth } from './useAuth';

const LOGOUT_MUTATION = gql(`
  mutation Logout {
    logout
  }
`);

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [, executeLogout] = useMutation(LOGOUT_MUTATION);

  return useCallback(async () => {
    await executeLogout({});
    logout();
    navigate('/login', { replace: true });
  }, [executeLogout, logout, navigate]);
}
