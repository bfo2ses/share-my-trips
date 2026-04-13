import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedLayout } from './features/auth/components/ProtectedLayout';

/* eslint-disable react-refresh/only-export-components */
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SetupPage = lazy(() => import('./features/auth/pages/SetupPage').then((m) => ({ default: m.SetupPage })));
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const TripsPage = lazy(() => import('./features/trips/pages/TripsPage').then((m) => ({ default: m.TripsPage })));
const TripDetailPage = lazy(() => import('./features/trips/pages/TripDetailPage').then((m) => ({ default: m.TripDetailPage })));
const AccountPage = lazy(() => import('./features/account/pages/AccountPage').then((m) => ({ default: m.AccountPage })));
/* eslint-enable react-refresh/only-export-components */

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
      {
        path: '/account',
        element: <AccountPage />,
      },
    ],
  },
]);
