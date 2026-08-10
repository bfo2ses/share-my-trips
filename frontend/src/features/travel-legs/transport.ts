import type { TravelLegTransport } from '../../graphql/generated/graphql';

export const transportOptions: ReadonlyArray<{ value: TravelLegTransport; label: string; icon: string }> = [
  { value: 'CAR', label: 'Voiture', icon: '' },
  { value: 'TRAIN', label: 'Train', icon: '' },
  { value: 'PLANE', label: 'Avion', icon: '' },
  { value: 'BOAT', label: 'Bateau', icon: '' },
];

export function transportLabel(transport: TravelLegTransport) {
  return transportOptions.find((option) => option.value === transport)?.label ?? transport;
}

export function transportIconSVG(transport: TravelLegTransport) {
  const paths: Record<TravelLegTransport, string> = {
    CAR: '<path d="m21 8-2 3-1.5-4.5A2 2 0 0 0 15.6 5H8.4a2 2 0 0 0-1.9 1.5L5 11 3 8"/><rect x="3" y="11" width="18" height="8" rx="2"/><path d="M7 14h.01M17 14h.01M5 19v2M19 19v2"/>',
    TRAIN: '<rect x="6" y="3" width="12" height="15" rx="2"/><path d="M9 7h6M9 11h.01M15 11h.01M8 21l2-3m6 3-2-3"/>',
    PLANE: '<path d="m21 16-8-4V4l-2-1-2 1v8l-8 4v2l8-1v4l-2 1v1h8v-1l-2-1v-4l8 1v-2Z"/>',
    BOAT: '<path d="M4 15h16l-2 4H6l-2-4Z"/><path d="M12 4v11M12 5l5 6h-5M10 7 7 11h5M4 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1"/>',
  };
  return `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[transport]}</svg>`;
}

export function formatDistanceKm(distanceKm: number | null | undefined) {
  if (distanceKm == null) return null;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(distanceKm)} km`;
}
