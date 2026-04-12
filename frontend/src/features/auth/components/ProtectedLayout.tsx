import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMe } from '../hooks/useMe';
import { Header } from '../../../components/Header/Header';

export function ProtectedLayout() {
  const { token } = useAuth();
  const { data, fetching } = useMe();

  if (!token) return <Navigate to="/login" replace />;

  if (fetching) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
          Chargement…
        </span>
      </div>
    );
  }

  return (
    <>
      <Header user={data?.me ?? null} />
      <Outlet />
    </>
  );
}
