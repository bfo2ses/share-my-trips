import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaLightbox } from './MediaLightbox';

const lightbox = vi.fn((props: unknown) => {
  void props;
  return null;
});

vi.mock('yet-another-react-lightbox', () => ({
  default: (props: unknown) => {
    lightbox(props);
    return null;
  },
}));
vi.mock('yet-another-react-lightbox/plugins/captions', () => ({ default: 'captions' }));
vi.mock('yet-another-react-lightbox/plugins/download', () => ({ default: 'download' }));

const media = [{
  id: 'media-1',
  tripID: 'trip-1',
  travelLegID: null,
  visitID: 'visit-1',
  filename: 'eglise.jpg',
  contentType: 'image/jpeg',
  caption: 'Une église',
  url: '/media/eglise.jpg',
  thumbUrl: '/media/eglise-thumb.jpg',
  position: 0,
  createdAt: '2026-08-09T12:00:00Z',
}];

describe('MediaLightbox', () => {
  beforeEach(() => lightbox.mockClear());

  it('adds a download action for image slides', () => {
    render(<MediaLightbox media={media} index={0} open onClose={vi.fn()} />);

    const props = lightbox.mock.calls[0]?.[0] as unknown as { plugins: unknown[]; labels: { Download: string }; slides: Array<{ download: { url: string; filename: string } }> };
    expect(props.plugins).toEqual(['captions', 'download']);
    expect(props.labels.Download).toBe('Télécharger');
    expect(props.slides[0].download).toEqual({ url: '/media/eglise.jpg', filename: 'eglise.jpg' });
  });
});
