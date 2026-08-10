export type MediaOwner =
  | { type: 'visit'; id: string }
  | { type: 'travelLeg'; id: string };

export interface MediaTarget {
  owner: MediaOwner;
  label: string;
}

export function mediaOwnerFormField(owner: MediaOwner) {
  return owner.type === 'visit' ? 'visitID' : 'travelLegID';
}
