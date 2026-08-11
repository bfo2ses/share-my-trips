import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { TripsQuery } from '../../../graphql/generated/graphql';
import { TripTimeline } from './TripTimeline';

type TripSummary = TripsQuery['trips'][number];

function trip(id: string, title: string, startDate: string | null): TripSummary {
  return {
    id, title, country: 'France', lat: 44.8, lng: -0.5,
    startDate, endDate: startDate ? `${startDate.slice(0, 4)}-08-01` : null,
    status: 'DRAFT', coverPhoto: '',
  };
}

describe('TripTimeline', () => {
  it('renders dated trips before a separate planning section', () => {
    render(
      <MemoryRouter>
        <TripTimeline
          datedTrips={[trip('new', 'Voyage récent', '2025-01-01'), trip('new-2', 'Second voyage récent', '2025-06-01'), trip('old', 'Voyage ancien', '2024-01-01')]}
          undatedTrips={[trip('todo', 'Voyage à planifier', null)]}
          isAdmin={false}
          onTripSelect={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Mes voyages' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'À planifier' })).toBeVisible();
    expect(screen.getByText('2025')).toBeVisible();
    expect(screen.getAllByText('2025')).toHaveLength(1);
    expect(screen.getByText('2024')).toBeVisible();
    expect(screen.getByText('—')).toBeVisible();
    expect(screen.getByRole('button', { name: /Voyage récent/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /Voyage à planifier/ })).toBeVisible();
  });

  it('shows an empty state when there are no trips', () => {
    render(
      <MemoryRouter>
        <TripTimeline datedTrips={[]} undatedTrips={[]} isAdmin={false} onTripSelect={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Aucun voyage pour le moment.')).toBeVisible();
  });
});
