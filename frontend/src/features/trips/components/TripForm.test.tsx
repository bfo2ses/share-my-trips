import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCreateTrip, useUpdateTrip } from '../hooks/useTripMutations';
import { TripForm } from './TripForm';

vi.mock('../hooks/useTripMutations', () => ({
  useCreateTrip: vi.fn(),
  useUpdateTrip: vi.fn(),
}));

const trip = {
  id: 'trip-1',
  title: 'Voyage test',
  country: 'France',
  lat: 44.8,
  lng: -0.5,
  startDate: null,
  endDate: null,
};

describe('TripForm lifecycle actions', () => {
  it('displays errors returned by an async action and keeps the form open', async () => {
    vi.mocked(useCreateTrip).mockReturnValue([{}, vi.fn()] as never);
    vi.mocked(useUpdateTrip).mockReturnValue([{}, vi.fn()] as never);
    const action = vi.fn().mockResolvedValue(['La date de début est obligatoire.']);

    render(<TripForm open onClose={vi.fn()} trip={trip} actions={[{ label: 'Publier le voyage', onClick: action }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Publier le voyage' }));

    expect(await screen.findByText('La date de début est obligatoire.')).toBeVisible();
    expect(screen.getByDisplayValue('Voyage test')).toBeVisible();
  });

  it('disables saving while a lifecycle action is pending', async () => {
    vi.mocked(useCreateTrip).mockReturnValue([{}, vi.fn()] as never);
    vi.mocked(useUpdateTrip).mockReturnValue([{}, vi.fn()] as never);
    let resolveAction!: (errors: string[]) => void;
    const action = vi.fn(() => new Promise<string[]>((resolve) => { resolveAction = resolve; }));

    render(<TripForm open onClose={vi.fn()} trip={trip} actions={[{ label: 'Publier le voyage', onClick: action }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Publier le voyage' }));
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();

    resolveAction([]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled());
  });

  it('starts globe repositioning from the edit form', () => {
    vi.mocked(useCreateTrip).mockReturnValue([{}, vi.fn()] as never);
    vi.mocked(useUpdateTrip).mockReturnValue([{}, vi.fn()] as never);
    const onReposition = vi.fn();

    render(<TripForm open onClose={vi.fn()} trip={trip} onReposition={onReposition} />);

    fireEvent.click(screen.getByRole('button', { name: 'Repositionner sur le globe' }));

    expect(onReposition).toHaveBeenCalledOnce();
  });

  it('shows an error when a lifecycle action rejects', async () => {
    vi.mocked(useCreateTrip).mockReturnValue([{}, vi.fn()] as never);
    vi.mocked(useUpdateTrip).mockReturnValue([{}, vi.fn()] as never);
    const action = vi.fn().mockRejectedValue(new Error('network failure'));

    render(<TripForm open onClose={vi.fn()} trip={trip} actions={[{ label: 'Publier le voyage', onClick: action }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Publier le voyage' }));

    expect(await screen.findByText('Une erreur est survenue.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });

  it('disables repositioning while saving', async () => {
    let resolveUpdate!: (result: unknown) => void;
    const updateTrip = vi.fn(() => new Promise((resolve) => { resolveUpdate = resolve; }));
    vi.mocked(useCreateTrip).mockReturnValue([{}, vi.fn()] as never);
    vi.mocked(useUpdateTrip).mockReturnValue([{}, updateTrip] as never);
    const onReposition = vi.fn();

    render(<TripForm open onClose={vi.fn()} trip={trip} onReposition={onReposition} />);

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(screen.getByRole('button', { name: 'Repositionner sur le globe' })).toBeDisabled();
    resolveUpdate({ data: { updateTrip: { errors: [] } } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Repositionner sur le globe' })).toBeEnabled());
  });
});
