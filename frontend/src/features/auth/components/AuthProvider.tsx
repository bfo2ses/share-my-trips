import { useState, type ReactNode } from 'react';
import { Provider } from 'urql';
import { AuthContext } from '../hooks/useAuth';
import { makeClient, setAuthToken } from '../../../graphql/client';

const SESSION_KEY = 'smt_token';

function readToken(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = readToken();
    if (stored) setAuthToken(stored);
    return stored;
  });
  // A fresh client per auth state: queries cached while logged out (or as
  // another user) must never be served after login.
  const [client, setClient] = useState(() => makeClient());

  function login(newToken: string) {
    sessionStorage.setItem(SESSION_KEY, newToken);
    setToken(newToken);
    setAuthToken(newToken);
    setClient(makeClient());
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
    setAuthToken(null);
    setClient(makeClient());
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      <Provider value={client}>{children}</Provider>
    </AuthContext.Provider>
  );
}
