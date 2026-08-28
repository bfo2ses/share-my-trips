import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
const OPENFREEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org/">OpenFreeMap</a> · <a href="https://openmaptiles.org/">© OpenMapTiles</a> · Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function OpenFreeMapLayer() {
  const map = useMap();

  useEffect(() => {
    setWorkerUrl(workerUrl);
    const layer = maplibreGL({
      style: OPENFREEMAP_STYLE_URL,
      attributionControl: { customAttribution: OPENFREEMAP_ATTRIBUTION },
    }).addTo(map);

    return () => {
      layer.remove();
    };
  }, [map]);

  return null;
}

export default OpenFreeMapLayer;
