CREATE TABLE travel_legs (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  from_stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE RESTRICT,
  to_stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE RESTRICT,
  transport TEXT NOT NULL CHECK (transport IN ('CAR', 'TRAIN', 'PLANE', 'BOAT')),
  description TEXT NOT NULL DEFAULT '',
  distance_km DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT travel_legs_distinct_endpoints CHECK (from_stage_id <> to_stage_id),
  CONSTRAINT travel_legs_non_negative_distance CHECK (distance_km IS NULL OR distance_km >= 0),
  CONSTRAINT travel_legs_unique_stage_pair UNIQUE (from_stage_id, to_stage_id)
);

CREATE INDEX travel_legs_trip_id_idx ON travel_legs (trip_id);

ALTER TABLE media ALTER COLUMN visit_id DROP NOT NULL;
ALTER TABLE media ADD COLUMN travel_leg_id TEXT REFERENCES travel_legs(id) ON DELETE CASCADE;
ALTER TABLE media ADD CONSTRAINT media_exactly_one_owner CHECK (
  (visit_id IS NOT NULL AND travel_leg_id IS NULL) OR
  (visit_id IS NULL AND travel_leg_id IS NOT NULL)
);

CREATE INDEX media_travel_leg_position_idx ON media (travel_leg_id, position)
  WHERE travel_leg_id IS NOT NULL;
