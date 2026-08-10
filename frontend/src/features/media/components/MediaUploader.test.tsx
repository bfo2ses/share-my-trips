import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaUploader } from './MediaUploader';
import { useAuth } from '../../auth/hooks/useAuth';

vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }));

class FakeXMLHttpRequest {
  static sent: FormData[] = [];
  upload = { addEventListener: vi.fn() };
  status = 201;
  private readonly listeners = new Map<string, () => void>();

  addEventListener(event: string, handler: () => void) {
    this.listeners.set(event, handler);
  }

  open() {}
  setRequestHeader() {}

  send(data: FormData) {
    FakeXMLHttpRequest.sent.push(data);
    this.listeners.get('load')?.();
  }
}

describe('MediaUploader', () => {
  beforeEach(() => {
    FakeXMLHttpRequest.sent = [];
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
    vi.mocked(useAuth).mockReturnValue({ token: 'token', login: vi.fn(), logout: vi.fn() });
  });

  it('uploads a travel leg media item with its travelLegID owner field', () => {
    const { container } = render(
      <MediaUploader owner={{ type: 'travelLeg', id: 'leg-1' }} tripID="trip-1" onUploadComplete={vi.fn()} />,
    );
    const file = new File(['image'], 'roadtrip.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]')!;

    fireEvent.change(input, { target: { files: [file] } });

    expect(FakeXMLHttpRequest.sent).toHaveLength(1);
    expect(FakeXMLHttpRequest.sent[0].get('travelLegID')).toBe('leg-1');
    expect(FakeXMLHttpRequest.sent[0].get('visitID')).toBeNull();
    expect(FakeXMLHttpRequest.sent[0].get('tripID')).toBe('trip-1');
  });

  it('keeps the existing visit owner upload contract', () => {
    const { container } = render(
      <MediaUploader owner={{ type: 'visit', id: 'visit-1' }} tripID="trip-1" onUploadComplete={vi.fn()} />,
    );
    const file = new File(['image'], 'visit.jpg', { type: 'image/jpeg' });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });

    expect(FakeXMLHttpRequest.sent[0].get('visitID')).toBe('visit-1');
    expect(FakeXMLHttpRequest.sent[0].get('travelLegID')).toBeNull();
  });
});
