import type { TravelLegTransport } from '../../graphql/generated/graphql';

export const transportOptions: ReadonlyArray<{ value: TravelLegTransport; label: string; icon: string }> = [
  { value: 'CAR', label: 'Voiture', icon: '🚗' },
  { value: 'TRAIN', label: 'Train', icon: '🚆' },
  { value: 'PLANE', label: 'Avion', icon: '✈️' },
  { value: 'BOAT', label: 'Bateau', icon: '⛵' },
];

export function transportLabel(transport: TravelLegTransport) {
  return transportOptions.find((option) => option.value === transport)?.label ?? transport;
}

export function transportIcon(transport: TravelLegTransport) {
  return transportOptions.find((option) => option.value === transport)?.icon ?? '↔';
}

export function formatDistanceKm(distanceKm: number | null | undefined) {
  if (distanceKm == null) return null;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(distanceKm)} km`;
}
