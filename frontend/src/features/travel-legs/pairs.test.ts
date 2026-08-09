import { describe, expect, it } from 'vitest';
import { travelLegBoundaries } from './pairs';

describe('travelLegBoundaries', () => {
  const stages = [
    { id: 'stage-a', lat: 40, lng: -74, displayName: 'New York' },
    { id: 'stage-b', lat: 39, lng: -77, displayName: 'Washington' },
    { id: 'stage-c', lat: 38, lng: -76, displayName: 'Annapolis' },
  ];

  it('returns every consecutive pair and binds an existing leg to its pair', () => {
    expect(travelLegBoundaries(stages, [
      { id: 'leg-1', fromStageID: 'stage-a', toStageID: 'stage-b' },
    ])).toEqual([
      expect.objectContaining({ fromStageID: 'stage-a', toStageID: 'stage-b', legID: 'leg-1', midpoint: { lat: 39.5, lng: -75.5 } }),
      expect.objectContaining({ fromStageID: 'stage-b', toStageID: 'stage-c', legID: null, midpoint: { lat: 38.5, lng: -76.5 } }),
    ]);
  });

  it('has no boundary with fewer than two stages', () => {
    expect(travelLegBoundaries(stages.slice(0, 1), [])).toEqual([]);
  });
});
