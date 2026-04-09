import { Header } from './components/Header/Header';
import { TripsPage } from './features/trips/pages/TripsPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { SetupPage } from './features/auth/pages/SetupPage';
import { MOCK_USER } from './features/trips/mockData';

// Sélecteur de page pour la maquette — ?page=login | ?page=setup | (défaut) home
function useMockPage() {
  const params = new URLSearchParams(window.location.search);
  return params.get('page') ?? 'home';
}

function App() {
  const page = useMockPage();

  if (page === 'login') return <LoginPage />;
  if (page === 'setup') return <SetupPage />;

  return (
    <>
      <Header user={{ id: '0', name: MOCK_USER.name, email: '', role: 'ADMIN' }} />
      <TripsPage />
    </>
  );
}

export default App;
