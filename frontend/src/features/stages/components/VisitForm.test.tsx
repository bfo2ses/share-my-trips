import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisitForm, type VisitFormSubmission } from './VisitForm';

vi.mock('../hooks/useVisitMutations', () => ({
  useAddVisit: vi.fn(() => [{ fetching: false }, vi.fn()]),
  useUpdateVisit: vi.fn(() => [{ fetching: false }, vi.fn()]),
}));

vi.mock('../../media/hooks/useMediaQueries', () => ({
  useVisitMedia: vi.fn(() => [{ data: { visitMedia: [] } }, vi.fn()]),
}));

vi.mock('../../media/components/MediaGallery', () => ({ MediaGallery: () => null }));
vi.mock('../../media/components/MediaUploader', () => ({ MediaUploader: () => null }));

describe('VisitForm', () => {
  it('delegates a new visit to the itinerary-resolution flow', async () => {
    const onSubmitWithResolution = vi.fn<(submission: VisitFormSubmission) => Promise<{ completed: boolean }>>()
      .mockResolvedValue({ completed: false });

    render(
      <VisitForm
        open
        tripID="trip-1"
        stageID="stage-1"
        pendingCoords={{ lat: 48.8, lng: 2.3 }}
        onClose={vi.fn()}
        onSubmitWithResolution={onSubmitWithResolution}
      />,
    );

    fireEvent.change(screen.getByLabelText('Date *'), { target: { value: '2025-05-12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la visite' }));

    await waitFor(() => expect(onSubmitWithResolution).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'create', date: '2025-05-12', stageID: 'stage-1', tripID: 'trip-1', lat: 48.8, lng: 2.3,
    })));
  });

  it('delegates a changed visit date to the itinerary-resolution flow', async () => {
    const onClose = vi.fn();
    const onSubmitWithResolution = vi.fn<(submission: VisitFormSubmission) => Promise<{ completed: boolean }>>()
      .mockResolvedValue({ completed: false });

    render(
      <VisitForm
        open
        panel
        tripID="trip-1"
        stageID="stage-1"
        visit={{ id: 'visit-1', date: '2025-05-10', title: 'Arrivée', lat: 48.8, lng: 2.3 }}
        onClose={onClose}
        onSubmitWithResolution={onSubmitWithResolution}
      />,
    );

    fireEvent.change(screen.getByLabelText('Date *'), { target: { value: '2025-05-12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(onSubmitWithResolution).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'update', visitID: 'visit-1', date: '2025-05-12', stageID: 'stage-1', tripID: 'trip-1',
    })));
    expect(onClose).not.toHaveBeenCalled();
  });
});
