import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaGallery } from './MediaGallery';
import { useDeleteMedia, useMoveMedia, useReorderMedia, useReorderTravelLegMedia, useUpdateMediaCaption } from '../hooks/useMediaMutations';

vi.mock('../hooks/useMediaMutations', () => ({
  useDeleteMedia: vi.fn(),
  useMoveMedia: vi.fn(),
  useReorderMedia: vi.fn(),
  useReorderTravelLegMedia: vi.fn(),
  useUpdateMediaCaption: vi.fn(),
}));

vi.mock('./MediaLightbox', () => ({ MediaLightbox: () => null }));

const deleteMedia = vi.fn();
const reorderVisitMedia = vi.fn();
const reorderTravelLegMedia = vi.fn();
const updateCaption = vi.fn();
const moveMedia = vi.fn();

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
    moveMedia.mockReset();
    vi.mocked(useDeleteMedia).mockReturnValue([{ fetching: false }, deleteMedia] as unknown as ReturnType<typeof useDeleteMedia>);
    vi.mocked(useReorderMedia).mockReturnValue([{ fetching: false }, reorderVisitMedia] as unknown as ReturnType<typeof useReorderMedia>);
    vi.mocked(useReorderTravelLegMedia).mockReturnValue([{ fetching: false }, reorderTravelLegMedia] as unknown as ReturnType<typeof useReorderTravelLegMedia>);
    vi.mocked(useUpdateMediaCaption).mockReturnValue([{ fetching: false }, updateCaption] as unknown as ReturnType<typeof useUpdateMediaCaption>);
    vi.mocked(useMoveMedia).mockReturnValue([{ fetching: false }, moveMedia] as unknown as ReturnType<typeof useMoveMedia>);
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

  it('moves selected media to another owner', async () => {
    moveMedia.mockResolvedValue({ data: { moveMedia: { media: [], errors: [] } } });
    const onDeleted = vi.fn();
    render(
      <MediaGallery
        media={media}
        owner={{ type: 'travelLeg', id: 'leg-1' }}
        mediaTargets={[{ owner: { type: 'visit', id: 'visit-1' }, label: 'Visite · 2025-07-01' }]}
        isAdmin
        onDeleted={onDeleted}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner roadtrip.jpg' }));
    expect(screen.getByRole('button', { name: 'Déplacer vers…' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Déplacer vers…' }));
    const dialog = screen.getByRole('dialog', { name: 'Déplacer les médias' });
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Destination du déplacement' }), { target: { value: 'visit:visit-1' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmer' }));

    await waitFor(() => expect(moveMedia).toHaveBeenCalledWith({
      input: { mediaIDs: ['media-1'], visitID: 'visit-1', travelLegID: null },
    }, expect.anything()));
    expect(onDeleted).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the move modal without sending a request when cancelled', () => {
    const onDeleted = vi.fn();
    render(
      <MediaGallery
        media={media}
        owner={{ type: 'travelLeg', id: 'leg-1' }}
        mediaTargets={[{ owner: { type: 'visit', id: 'visit-1' }, label: 'Visite · 2025-07-01' }]}
        isAdmin
        onDeleted={onDeleted}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner roadtrip.jpg' }));
    fireEvent.click(screen.getByRole('button', { name: 'Déplacer vers…' }));
    const dialog = screen.getByRole('dialog', { name: 'Déplacer les médias' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(moveMedia).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('keeps the move modal open and shows the server error', async () => {
    moveMedia.mockResolvedValue({ data: { moveMedia: { media: [], errors: [{ message: 'Accès refusé' }] } } });
    render(
      <MediaGallery
        media={media}
        owner={{ type: 'travelLeg', id: 'leg-1' }}
        mediaTargets={[{ owner: { type: 'visit', id: 'visit-1' }, label: 'Visite · 2025-07-01' }]}
        isAdmin
        onDeleted={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner roadtrip.jpg' }));
    fireEvent.click(screen.getByRole('button', { name: 'Déplacer vers…' }));
    const dialog = screen.getByRole('dialog', { name: 'Déplacer les médias' });
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Destination du déplacement' }), { target: { value: 'visit:visit-1' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé');
    expect(screen.getByRole('dialog', { name: 'Déplacer les médias' })).toBeInTheDocument();
  });
});
