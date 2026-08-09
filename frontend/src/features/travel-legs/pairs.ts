export interface TravelLegStage {
  id: string;
  lat: number;
  lng: number;
  displayName: string;
}

export interface TravelLegPair {
  id: string;
  fromStageID: string;
  toStageID: string;
}

export interface TravelLegBoundary {
  fromStageID: string;
  toStageID: string;
  legID: string | null;
  midpoint: { lat: number; lng: number };
}

// The map intentionally uses the same straight-line geometry as the existing
// stage overview polyline. Route geometry is outside this first version.
export function travelLegBoundaries(
  stages: readonly TravelLegStage[],
  travelLegs: readonly TravelLegPair[],
): TravelLegBoundary[] {
  const legsByPair = new Map(travelLegs.map((leg) => [`${leg.fromStageID}:${leg.toStageID}`, leg]));

  return stages.slice(0, -1).map((fromStage, index) => {
    const toStage = stages[index + 1];
    const leg = legsByPair.get(`${fromStage.id}:${toStage.id}`);
    return {
      fromStageID: fromStage.id,
      toStageID: toStage.id,
      legID: leg?.id ?? null,
      midpoint: {
        lat: (fromStage.lat + toStage.lat) / 2,
        lng: (fromStage.lng + toStage.lng) / 2,
      },
    };
  });
}
