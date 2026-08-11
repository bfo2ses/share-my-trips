import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
  TravelGlobe: () => <div data-testid="travel-globe" />,
}));
vi.mock('../components/TripForm', () => ({ TripForm: () => null }));
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
        <TripsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('travel-globe')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Mes voyages' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Mes voyages' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'À planifier' })).toBeVisible();

    const cards = screen.getAllByRole('button');
    expect(cards.findIndex((card) => card.textContent?.includes('Voyage récent')))
      .toBeLessThan(cards.findIndex((card) => card.textContent?.includes('Voyage ancien')));
    expect(screen.getByRole('button', { name: /Voyage à planifier/ })).toBeVisible();
    expect(useTrips).toHaveBeenCalledWith(['PUBLISHED', 'CLOSED']);
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
});
