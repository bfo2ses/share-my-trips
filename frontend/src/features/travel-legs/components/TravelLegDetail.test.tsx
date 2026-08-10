import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TravelLegDetail } from './TravelLegDetail';
import { useDeleteTravelLeg } from '../hooks/useTravelLegMutations';

vi.mock('../hooks/useTravelLegMutations', () => ({
  useDeleteTravelLeg: vi.fn(),
}));

vi.mock('../../media/hooks/useMediaQueries', () => ({
  useTravelLegMedia: vi.fn(() => [{ data: { travelLegMedia: [] } }, vi.fn()]),
}));

vi.mock('../../media/components/MediaGallery', () => ({
  MediaGallery: () => null,
}));

vi.mock('../../media/components/MediaUploader', () => ({
  MediaUploader: () => null,
}));

const deleteLeg = vi.fn();

describe('TravelLegDetail', () => {
  beforeEach(() => {
    deleteLeg.mockReset();
    vi.mocked(useDeleteTravelLeg).mockReturnValue([{ fetching: false }, deleteLeg] as unknown as ReturnType<typeof useDeleteTravelLeg>);
  });

  it('returns to the timeline after deletion', async () => {
    const onBack = vi.fn();
    deleteLeg.mockResolvedValue({ data: { deleteTravelLeg: { success: true, errors: [] } } });
    render(
      <TravelLegDetail
        travelLeg={{ id: 'leg-1', tripID: 'trip-1', fromStageID: 'stage-1', toStageID: 'stage-2', transport: 'CAR', description: null, distanceKm: null }}
        canEdit
        onClose={vi.fn()}
        onBack={onBack}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Actions sur le trajet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
  });
});
