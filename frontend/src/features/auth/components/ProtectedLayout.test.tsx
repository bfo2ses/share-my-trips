import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../hooks/useAuth';
import { useMe } from '../hooks/useMe';
import { ProtectedLayout } from './ProtectedLayout';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useMe', () => ({ useMe: vi.fn() }));
vi.mock('../../../components/Header/Header', () => ({ Header: () => <div>Header</div> }));
vi.mock('../../../components/EditMode/EditModeProvider', () => ({
  EditModeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const logout = vi.fn();

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{location.pathname}</output>
      <button type="button" onClick={() => navigate(-1)}>Back</button>
    </>
  );
}

function renderLayout(initialEntries = ['/private']) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <LocationProbe />
      <Routes>
        <Route path="/before" element={<div>Previous page</div>} />
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<ProtectedLayout />}>
          <Route path="/private" element={<div>Protected content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function setMeResult(result: { data?: unknown; fetching: boolean; error?: unknown }) {
  vi.mocked(useMe).mockReturnValue(result as ReturnType<typeof useMe>);
}

describe('ProtectedLayout', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ token: 'token-a', login: vi.fn(), logout });
    setMeResult({ data: { me: { id: '1', name: 'Alice', email: 'a@example.com', role: 'ADMIN' } }, fetching: false });
  });

  it('replaces the protected location when redirecting an unauthenticated visitor', async () => {
    vi.mocked(useAuth).mockReturnValue({ token: null, login: vi.fn(), logout });

    renderLayout(['/before', '/private']);

    expect(screen.getByTestId('location')).toHaveTextContent('/login');
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();

    screen.getByRole('button', { name: 'Back' }).click();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/before'));
    expect(screen.getByText('Previous page')).toBeInTheDocument();
  });

  it('keeps protected content unmounted while the current user is loading', () => {
    setMeResult({ fetching: true });

    renderLayout();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it('logs out a confirmed expired session without mounting protected content', async () => {
    setMeResult({ data: { me: null }, fetching: false });

    renderLayout();

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
  });

  it.each([
    ['transport error', { fetching: false, error: new Error('offline') }],
    ['missing data', { fetching: false }],
  ])('does not classify %s as session expiry', (_label, result) => {
    setMeResult(result);

    renderLayout();

    expect(logout).not.toHaveBeenCalled();
  });

  it('mounts protected content for a valid session', () => {
    renderLayout();

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });
});
