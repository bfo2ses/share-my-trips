import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../../../components/Header/Header';

function getNameFromToken(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.name ?? payload.sub ?? '';
  } catch {
    return '';
  }
}

export function ProtectedLayout() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <>
      <Header userName={getNameFromToken(token)} />
      <Outlet />
    </>
  );
}
