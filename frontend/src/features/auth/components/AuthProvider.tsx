import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Provider } from 'urql';
import { AuthContext } from '../hooks/useAuth';
import { makeClient } from '../../../graphql/client';

const SESSION_KEY = 'smt_token';

function readToken(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken);

  const login = useCallback((newToken: string) => {
    sessionStorage.setItem(SESSION_KEY, newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
  }, []);

  // The client is derived from the token: any auth transition (login, logout,
  // server-side session invalidation) swaps in a fresh client and cache.
  const client = useMemo(() => makeClient(token, logout), [token, logout]);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      <Provider value={client}>{children}</Provider>
    </AuthContext.Provider>
  );
}
