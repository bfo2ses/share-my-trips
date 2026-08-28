import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenFreeMapLayer } from './OpenFreeMapLayer';

const { map, layer, maplibreGL, getReceivedOptions } = vi.hoisted(() => {
  type LayerOptions = {
    style: string;
    attributionControl: { customAttribution: string };
  };
  const layer = { addTo: vi.fn(), remove: vi.fn() };
  const map = {};
  let receivedOptions: LayerOptions | undefined;
  const maplibreGL = vi.fn((options: LayerOptions) => {
    receivedOptions = options;
    return layer;
  });
  layer.addTo.mockReturnValue(layer);
  return { map, layer, maplibreGL, getReceivedOptions: () => receivedOptions };
});

const { setWorkerUrl } = vi.hoisted(() => ({ setWorkerUrl: vi.fn() }));

vi.mock('react-leaflet', () => ({
  useMap: () => map,
}));

vi.mock('@maplibre/maplibre-gl-leaflet', () => ({
  maplibreGL,
}));

vi.mock('maplibre-gl', () => ({
  setWorkerUrl,
}));

describe('OpenFreeMapLayer', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('adds the no-key dark vector style to the Leaflet map', () => {
    const { unmount } = render(<OpenFreeMapLayer />);

    expect(setWorkerUrl).toHaveBeenCalledWith(expect.stringContaining('maplibre-gl-worker'));
    expect(maplibreGL).toHaveBeenCalledWith(expect.objectContaining({
      style: 'https://tiles.openfreemap.org/styles/dark',
      attributionControl: expect.objectContaining({
        customAttribution: expect.stringContaining('OpenFreeMap'),
      }),
    }));
    const options = getReceivedOptions();
    if (!options) throw new Error('MapLibre options were not captured');
    expect(options.style).not.toContain('?key=');
    expect(options.attributionControl.customAttribution).toContain('OpenStreetMap');
    expect(layer.addTo).toHaveBeenCalledWith(map);

    unmount();
    expect(layer.remove).toHaveBeenCalledOnce();
  });
});
