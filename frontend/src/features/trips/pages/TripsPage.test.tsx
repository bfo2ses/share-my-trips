import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { useMe } from '../../auth/hooks/useMe';
import { useEditMode } from '../../../components/EditMode/useEditMode';
import { useTripMedia } from '../../media/hooks/useMediaQueries';
import { useTripCloseData } from '../hooks/useTripCloseData';
import { useTrips } from '../hooks/useTrips';
import { TripsPage } from './TripsPage';

vi.mock('../hooks/useTrips', () => ({ useTrips: vi.fn() }));
vi.mock('../../auth/hooks/useMe', () => ({ useMe: vi.fn() }));
vi.mock('../../../components/EditMode/useEditMode', () => ({ useEditMode: vi.fn() }));
vi.mock('../../media/hooks/useMediaQueries', () => ({ useTripMedia: vi.fn() }));
vi.mock('../hooks/useTripCloseData', () => ({ useTripCloseData: vi.fn() }));
vi.mock('../hooks/useTripMutations', () => ({
  usePublishTrip: () => [{}, vi.fn()],
  useUnpublishTrip: () => [{}, vi.fn()],
  useDeleteTrip: () => [{}, vi.fn()],
  useReopenTrip: () => [{}, vi.fn()],
  useCloseTrip: () => [{}, vi.fn()],
}));
vi.mock('../components/TravelGlobe', () => ({
  TravelGlobe: ({ trips, onTripSelect, onFocusComplete, onLocationSelect, pendingCoords, focusTripId }: {
    trips: TripSummary[];
    onTripSelect: (trip: TripSummary) => void;
    onFocusComplete?: (trip: TripSummary) => void;
    onLocationSelect?: (coords: { lat: number; lng: number }) => void;
    pendingCoords?: { lat: number; lng: number } | null;
    focusTripId?: string | null;
  }) => (
    <div data-testid="travel-globe">
      <button type="button" data-testid="globe-marker" onClick={() => onTripSelect({
        id: 'old', title: 'Voyage ancien', country: 'France', lat: 44.8, lng: -0.5,
        startDate: '2024-01-01', endDate: '2024-08-01', status: 'PUBLISHED', coverPhoto: '',
      })}>marker</button>
      <button type="button" data-testid="globe-empty" onClick={() => onLocationSelect?.({ lat: 1, lng: 2 })}>empty</button>
      <span data-testid="focus-trip-id">{focusTripId ?? ''}</span>
      <button
        type="button"
        data-testid="focus-complete"
        onClick={() => {
          const selectedTrip = trips.find((trip) => trip.id === focusTripId);
          if (selectedTrip) onFocusComplete?.(selectedTrip);
        }}
      >complete focus</button>
      <span data-testid="pending-coords">{pendingCoords ? `${pendingCoords.lat},${pendingCoords.lng}` : ''}</span>
    </div>
  ),
}));
vi.mock('../components/TripForm', () => ({
  TripForm: ({ open, trip: editingTrip, pendingCoords, onReposition }: {
    open: boolean;
    trip?: { id: string } | null;
    pendingCoords?: { lat: number; lng: number } | null;
    onReposition?: () => void;
  }) => open ? (
    <div data-testid="trip-form">
      <span data-testid="edited-trip">{editingTrip?.id ?? 'new'}</span>
      <span data-testid="form-coords">{pendingCoords ? `${pendingCoords.lat},${pendingCoords.lng}` : ''}</span>
      <button type="button" onClick={onReposition}>Repositionner sur le globe</button>
    </div>
  ) : null,
}));
vi.mock('../../../components/ConfirmModal/ConfirmModal', () => ({ ConfirmModal: () => null }));

type TripSummary = TripsQuery['trips'][number];

function trip(id: string, title: string, startDate: string | null): TripSummary {
  return {
    id,
    title,
    country: 'France',
    lat: 44.8,
    lng: -0.5,
    startDate,
    endDate: startDate ? `${startDate.slice(0, 4)}-08-01` : null,
    status: 'PUBLISHED',
    coverPhoto: '',
  };
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe('TripsPage', () => {
  beforeEach(() => {
    vi.mocked(useMe).mockReturnValue({
      data: { me: { role: 'VIEWER' } }, fetching: false, stale: false, hasNext: false,
    } as unknown as ReturnType<typeof useMe>);
    vi.mocked(useEditMode).mockReturnValue({ editMode: false } as ReturnType<typeof useEditMode>);
    vi.mocked(useTrips).mockReturnValue({
      data: {
        trips: [
          trip('old', 'Voyage ancien', '2024-01-01'),
          trip('undated', 'Voyage à planifier', null),
          trip('new', 'Voyage récent', '2025-01-01'),
        ],
      },
      fetching: false,
      error: undefined,
    } as unknown as ReturnType<typeof useTrips>);
    vi.mocked(useTripMedia).mockReturnValue([{ data: undefined }, vi.fn()] as unknown as ReturnType<typeof useTripMedia>);
    vi.mocked(useTripCloseData).mockReturnValue([{ data: undefined }, vi.fn()] as unknown as ReturnType<typeof useTripCloseData>);
  });

  it('renders the globe and keeps dated trips ordered before planning trips', async () => {
    render(
      <MemoryRouter>
        <LocationProbe />
        <TripsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('travel-globe')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Mes voyages' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'À planifier' })).toBeVisible();

    const cards = screen.getAllByRole('button');
    expect(cards.findIndex((card) => card.textContent?.includes('Voyage récent')))
      .toBeLessThan(cards.findIndex((card) => card.textContent?.includes('Voyage ancien')));
    expect(screen.getByRole('button', { name: /Voyage à planifier/ })).toBeVisible();
    expect(useTrips).toHaveBeenCalledWith(['PUBLISHED', 'CLOSED']);
  });

  it('focuses the globe before navigating from a timeline card', async () => {
    render(
      <MemoryRouter>
        <LocationProbe />
        <TripsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Voyage récent/ }));

    expect(screen.getByTestId('focus-trip-id')).toHaveTextContent('new');
    expect(screen.getByTestId('location')).toHaveTextContent('/');

    fireEvent.click(screen.getByTestId('focus-complete'));

    expect(screen.getByTestId('location')).toHaveTextContent('/trips/new');
    expect(screen.getByTestId('focus-trip-id')).toHaveTextContent('');
  });

  it('shows an empty timeline without hiding the globe', async () => {
    vi.mocked(useTrips).mockReturnValue({
      data: { trips: [] }, fetching: false, stale: false, hasNext: false, error: undefined,
    } as unknown as ReturnType<typeof useTrips>);

    render(
      <MemoryRouter>
        <TripsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('travel-globe')).toBeVisible();
    expect(screen.getByText('Aucun voyage pour le moment.')).toBeVisible();
  });

  it('keeps the edited trip when repositioning on the globe', async () => {
    vi.mocked(useMe).mockReturnValue({
      data: { me: { role: 'ADMIN' } }, fetching: false, stale: false, hasNext: false,
    } as unknown as ReturnType<typeof useMe>);
    vi.mocked(useEditMode).mockReturnValue({ editMode: true } as ReturnType<typeof useEditMode>);

    render(
      <MemoryRouter>
        <TripsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('globe-marker'));
    expect(await screen.findByTestId('edited-trip')).toHaveTextContent('old');

    fireEvent.click(screen.getByTestId('globe-empty'));
    expect(screen.getByTestId('edited-trip')).toHaveTextContent('old');

    fireEvent.click(screen.getByRole('button', { name: 'Repositionner sur le globe' }));
    expect(screen.getByText('Cliquez sur le globe pour choisir le nouvel emplacement.')).toBeVisible();
    fireEvent.click(screen.getByTestId('globe-empty'));

    expect(screen.getByTestId('edited-trip')).toHaveTextContent('old');
    expect(screen.getByTestId('form-coords')).toHaveTextContent('1,2');
    expect(screen.queryByText('Cliquez sur le globe pour choisir le nouvel emplacement.')).not.toBeInTheDocument();
  });
});
