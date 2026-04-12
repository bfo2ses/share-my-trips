import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedLayout } from './features/auth/components/ProtectedLayout';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SetupPage = lazy(() => import('./features/auth/pages/SetupPage').then((m) => ({ default: m.SetupPage })));
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const TripsPage = lazy(() => import('./features/trips/pages/TripsPage').then((m) => ({ default: m.TripsPage })));
const TripDetailPage = lazy(() => import('./features/trips/pages/TripDetailPage').then((m) => ({ default: m.TripDetailPage })));

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
