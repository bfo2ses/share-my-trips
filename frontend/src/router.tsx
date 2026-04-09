import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { SetupPage } from './features/auth/pages/SetupPage';
import { ProtectedLayout } from './features/auth/components/ProtectedLayout';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage';
import { TripsPage } from './features/trips/pages/TripsPage';
import { TripDetailPage } from './features/trips/pages/TripDetailPage';

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
        element: <TripsPage />,
      },
      {
        path: '/trips/:id',
        element: <TripDetailPage />,
      },
    ],
  },
]);
