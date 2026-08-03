import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { makeClient } from '../../../graphql/client';
import { useAuth } from '../hooks/useAuth';
import { AuthProvider } from './AuthProvider';

vi.mock('../../../graphql/client', () => ({
  makeClient: vi.fn(() => ({})),
}));

vi.mock('urql', () => ({
  Provider: ({ children }: { children: ReactNode }) => children,
}));

function AuthProbe() {
  const { token, login, logout } = useAuth();

  return (
    <>
      <output data-testid="token">{token ?? 'anonymous'}</output>
      <button type="button" onClick={() => login('token-a')}>Log in A</button>
      <button type="button" onClick={() => login('token-b')}>Log in B</button>
      <button type="button" onClick={logout}>Log out</button>
    </>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  it('initializes the auth state and client from sessionStorage', () => {
    sessionStorage.setItem('smt_token', 'stored-token');

    renderProvider();

    expect(screen.getByTestId('token')).toHaveTextContent('stored-token');
    expect(makeClient).toHaveBeenLastCalledWith('stored-token', expect.any(Function));
  });

  it('keeps storage coherent and replaces the client across auth states', () => {
    renderProvider();
    const anonymousClient = vi.mocked(makeClient).mock.results.at(-1)?.value;

    act(() => screen.getByRole('button', { name: 'Log in A' }).click());
    const userAClient = vi.mocked(makeClient).mock.results.at(-1)?.value;
    expect(sessionStorage.getItem('smt_token')).toBe('token-a');
    expect(screen.getByTestId('token')).toHaveTextContent('token-a');

    act(() => screen.getByRole('button', { name: 'Log out' }).click());
    const loggedOutClient = vi.mocked(makeClient).mock.results.at(-1)?.value;
    expect(sessionStorage.getItem('smt_token')).toBeNull();
    expect(screen.getByTestId('token')).toHaveTextContent('anonymous');

    act(() => screen.getByRole('button', { name: 'Log in B' }).click());
    const userBClient = vi.mocked(makeClient).mock.results.at(-1)?.value;

    expect(new Set([anonymousClient, userAClient, loggedOutClient, userBClient]).size).toBe(4);
    expect(sessionStorage.getItem('smt_token')).toBe('token-b');
    expect(screen.getByTestId('token')).toHaveTextContent('token-b');
  });

  it('turns the unauthorized callback into a coherent anonymous state', () => {
    renderProvider();
    act(() => screen.getByRole('button', { name: 'Log in A' }).click());
    const authenticatedClient = vi.mocked(makeClient).mock.results.at(-1)?.value;
    const authenticatedUnauthorized = vi.mocked(makeClient).mock.calls.at(-1)?.[1];

    act(() => authenticatedUnauthorized?.());

    expect(sessionStorage.getItem('smt_token')).toBeNull();
    expect(screen.getByTestId('token')).toHaveTextContent('anonymous');
    expect(vi.mocked(makeClient).mock.results.at(-1)?.value).not.toBe(authenticatedClient);
    expect(makeClient).toHaveBeenLastCalledWith(null, expect.any(Function));
  });
});
