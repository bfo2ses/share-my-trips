import { useState, type ReactNode } from 'react';
import { AuthContext } from '../hooks/useAuth';
import { setAuthToken } from '../../../graphql/client';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  function login(newToken: string) {
    setToken(newToken);
    setAuthToken(newToken);
  }

  function logout() {
    setToken(null);
    setAuthToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
