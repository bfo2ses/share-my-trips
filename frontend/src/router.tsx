import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { SetupPage } from './features/auth/pages/SetupPage';
import { ProtectedLayout } from './features/auth/components/ProtectedLayout';
import { LogoutButton } from './features/auth/components/LogoutButton';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/setup',
    element: <SetupPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: '/',
        element: <div>Accueil (à venir) <LogoutButton /></div>,
      },
    ],
  },
]);
