import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMe } from '../hooks/useMe';
import { Header } from '../../../components/Header/Header';
import { EditModeProvider } from '../../../components/EditMode/EditModeProvider';

export function ProtectedLayout() {
  const { token, logout } = useAuth();
  const { data, fetching, error } = useMe();

  // The backend answers `me: null` (no HTTP error) when the session token is
  // no longer valid — treat it as an expired session, not as a logged-in
  // user without data.
  const sessionExpired = Boolean(token) && !fetching && !error && data != null && data.me == null;

  useEffect(() => {
    if (sessionExpired) logout();
  }, [sessionExpired, logout]);

  if (!token) return <Navigate to="/login" replace />;

  // On the expired frame, keep the placeholder up: mounting the protected
  // children would fire their queries with the dead token before the logout
  // effect swaps the client.
  if (fetching || sessionExpired) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
          Chargement…
        </span>
      </div>
    );
  }

  return (
    <EditModeProvider>
      <Header user={data?.me ?? null} />
      <Outlet />
    </EditModeProvider>
  );
}
