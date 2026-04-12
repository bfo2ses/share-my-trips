import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'urql';
import { RouterProvider } from 'react-router-dom';
import { client } from './graphql/client';
import { AuthProvider } from './features/auth/components/AuthProvider';
import { router } from './router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider value={client}>
      <AuthProvider>
        <Suspense>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </Provider>
  </StrictMode>,
);
