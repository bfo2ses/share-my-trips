import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TravelLegForm } from './TravelLegForm';
import { useCalculateTravelLegDistance, useCreateTravelLeg, useUpdateTravelLeg } from '../hooks/useTravelLegMutations';

vi.mock('../hooks/useTravelLegMutations', () => ({
  useCalculateTravelLegDistance: vi.fn(),
  useCreateTravelLeg: vi.fn(),
  useUpdateTravelLeg: vi.fn(),
}));

vi.mock('../../media/hooks/useMediaQueries', () => ({
  useTravelLegMedia: vi.fn(() => [{ data: { travelLegMedia: [] } }, vi.fn()]),
}));

vi.mock('../../media/components/MediaGallery', () => ({
  MediaGallery: () => <div>Galerie média</div>,
}));

vi.mock('../../media/components/MediaUploader', () => ({
  MediaUploader: () => <div>Ajout média</div>,
}));

const createLeg = vi.fn();
const updateLeg = vi.fn();
const calculate = vi.fn();

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function renderForm() {
  return render(
    <TravelLegForm
      open
      tripID="trip-1"
      fromStageID="stage-1"
      toStageID="stage-2"
      onClose={vi.fn()}
    />,
  );
}

describe('TravelLegForm', () => {
  beforeEach(() => {
    createLeg.mockReset();
    updateLeg.mockReset();
    calculate.mockReset();
    vi.mocked(useCreateTravelLeg).mockReturnValue([{ fetching: false }, createLeg] as unknown as ReturnType<typeof useCreateTravelLeg>);
    vi.mocked(useUpdateTravelLeg).mockReturnValue([{ fetching: false }, updateLeg] as unknown as ReturnType<typeof useUpdateTravelLeg>);
    vi.mocked(useCalculateTravelLegDistance).mockReturnValue([{ fetching: false }, calculate] as unknown as ReturnType<typeof useCalculateTravelLegDistance>);
  });

  it('keeps a manual distance entered while a calculation is pending', async () => {
    const pending = deferred<{ data: { calculateTravelLegDistance: { distanceKm: number; errors: [] } } }>();
    calculate.mockReturnValue(pending.promise);
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Calculer la distance' }));
    fireEvent.change(screen.getByLabelText('Distance (km)'), { target: { value: '999' } });
    pending.resolve({ data: { calculateTravelLegDistance: { distanceKm: 42.4, errors: [] } } });

    await waitFor(() => expect(screen.getByLabelText('Distance (km)')).toHaveValue(999));
    expect(calculate).toHaveBeenCalledWith({ fromStageID: 'stage-1', toStageID: 'stage-2', transport: 'CAR' });
  });

  it('allows saving a manually entered distance after a failed calculation', async () => {
    calculate.mockResolvedValue({ data: { calculateTravelLegDistance: { distanceKm: null, errors: [{ message: 'Service indisponible' }] } } });
    createLeg.mockResolvedValue({ data: { createTravelLeg: { travelLeg: { id: 'leg-1' }, errors: [] } } });
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Calculer la distance' }));
    await screen.findByText('Service indisponible');
    fireEvent.change(screen.getByLabelText('Distance (km)'), { target: { value: '450.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le trajet' }));

    await waitFor(() => expect(createLeg).toHaveBeenCalledWith({
      input: expect.objectContaining({ distanceKm: 450.5, transport: 'CAR' }),
    }, expect.anything()));
  });

  it('cancels without creating a travel leg or exposing media controls', () => {
    const onClose = vi.fn();
    render(
      <TravelLegForm
        open
        tripID="trip-1"
        fromStageID="stage-1"
        toStageID="stage-2"
        onClose={onClose}
      />,
    );

    expect(screen.queryByText('Galerie média')).not.toBeInTheDocument();
    expect(screen.queryByText('Ajout média')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(createLeg).not.toHaveBeenCalled();
  });

  it('lets an editor cancel an unsaved panel form', () => {
    const onClose = vi.fn();
    render(
      <TravelLegForm
        open
        panel
        tripID="trip-1"
        fromStageID="stage-1"
        toStageID="stage-2"
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Annuler le trajet' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(createLeg).not.toHaveBeenCalled();
  });

  it('does not apply a calculation made for a transport that changed', async () => {
    const pending = deferred<{ data: { calculateTravelLegDistance: { distanceKm: number; errors: [] } } }>();
    calculate.mockReturnValue(pending.promise);
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Calculer la distance' }));
    fireEvent.change(screen.getByLabelText('Moyen de transport'), { target: { value: 'PLANE' } });
    pending.resolve({ data: { calculateTravelLegDistance: { distanceKm: 42.4, errors: [] } } });

    await screen.findByText('Le moyen de transport a changé. Lancez un nouveau calcul si nécessaire.');
    expect(screen.getByLabelText('Distance (km)')).toHaveValue(null);
  });

  it('accepts a zero distance', async () => {
    createLeg.mockResolvedValue({ data: { createTravelLeg: { travelLeg: { id: 'leg-1' }, errors: [] } } });
    renderForm();

    fireEvent.change(screen.getByLabelText('Distance (km)'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le trajet' }));

    await waitFor(() => expect(createLeg).toHaveBeenCalledWith({
      input: expect.objectContaining({ distanceKm: 0 }),
    }, expect.anything()));
  });

  it('prevents duplicate calculations while one is pending', () => {
    const pending = deferred<{ data: { calculateTravelLegDistance: { distanceKm: number; errors: [] } } }>();
    calculate.mockReturnValue(pending.promise);
    renderForm();

    const calculateButton = screen.getByRole('button', { name: 'Calculer la distance' });
    fireEvent.click(calculateButton);
    fireEvent.click(calculateButton);

    expect(calculate).toHaveBeenCalledOnce();
  });
});
