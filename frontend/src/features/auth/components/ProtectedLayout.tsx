import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMe } from '../hooks/useMe';
import { Header } from '../../../components/Header/Header';

export function ProtectedLayout() {
  const { token } = useAuth();
  const { data } = useMe();

  if (!token) return <Navigate to="/login" replace />;
  return (
    <>
      <Header user={data?.me ?? null} />
      <Outlet />
    </>
  );
}
