import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaGallery } from './MediaGallery';
import { useDeleteMedia, useReorderMedia, useReorderTravelLegMedia, useUpdateMediaCaption } from '../hooks/useMediaMutations';

vi.mock('../hooks/useMediaMutations', () => ({
  useDeleteMedia: vi.fn(),
  useReorderMedia: vi.fn(),
  useReorderTravelLegMedia: vi.fn(),
  useUpdateMediaCaption: vi.fn(),
}));

vi.mock('./MediaLightbox', () => ({ MediaLightbox: () => null }));

const deleteMedia = vi.fn();
const reorderVisitMedia = vi.fn();
const reorderTravelLegMedia = vi.fn();
const updateCaption = vi.fn();

const media = [{
  id: 'media-1',
  tripID: 'trip-1',
  travelLegID: 'leg-1',
  visitID: null,
  filename: 'roadtrip.jpg',
  contentType: 'image/jpeg',
  caption: null,
  url: '/media/original.jpg',
  thumbUrl: '/media/thumb.jpg',
  position: 0,
  createdAt: '2026-08-09T12:00:00Z',
}];

describe('MediaGallery', () => {
  beforeEach(() => {
    deleteMedia.mockReset();
    reorderVisitMedia.mockReset();
    reorderTravelLegMedia.mockReset();
    updateCaption.mockReset();
    vi.mocked(useDeleteMedia).mockReturnValue([{ fetching: false }, deleteMedia] as unknown as ReturnType<typeof useDeleteMedia>);
    vi.mocked(useReorderMedia).mockReturnValue([{ fetching: false }, reorderVisitMedia] as unknown as ReturnType<typeof useReorderMedia>);
    vi.mocked(useReorderTravelLegMedia).mockReturnValue([{ fetching: false }, reorderTravelLegMedia] as unknown as ReturnType<typeof useReorderTravelLegMedia>);
    vi.mocked(useUpdateMediaCaption).mockReturnValue([{ fetching: false }, updateCaption] as unknown as ReturnType<typeof useUpdateMediaCaption>);
  });

  it('deletes media attached to a travel leg through the shared gallery', async () => {
    deleteMedia.mockResolvedValue({ data: { deleteMedia: { success: true, errors: [] } } });
    const onDeleted = vi.fn();
    render(<MediaGallery media={media} owner={{ type: 'travelLeg', id: 'leg-1' }} isAdmin onDeleted={onDeleted} />);

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => expect(deleteMedia).toHaveBeenCalledWith({ id: 'media-1' }, expect.anything()));
    expect(onDeleted).toHaveBeenCalledOnce();
  });

  it('surfaces a failed media deletion instead of silently refreshing', async () => {
    deleteMedia.mockResolvedValue({ data: { deleteMedia: { success: false, errors: [{ message: 'Accès refusé' }] } } });
    const onDeleted = vi.fn();
    render(<MediaGallery media={media} owner={{ type: 'visit', id: 'visit-1' }} isAdmin onDeleted={onDeleted} />);

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé');
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
