import { useState, type ReactNode } from 'react';
import { AuthContext } from '../hooks/useAuth';
import { setAuthToken } from '../../../graphql/client';

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

  function login(newToken: string) {
    sessionStorage.setItem(SESSION_KEY, newToken);
    setToken(newToken);
    setAuthToken(newToken);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
    setAuthToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
