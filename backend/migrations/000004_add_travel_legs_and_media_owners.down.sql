DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM travel_legs) THEN
    RAISE EXCEPTION 'cannot roll back travel legs while data exists';
  END IF;
  IF EXISTS (SELECT 1 FROM media WHERE travel_leg_id IS NOT NULL) THEN
    RAISE EXCEPTION 'cannot roll back leg-owned media while data exists';
  END IF;
END $$;

ALTER TABLE media DROP CONSTRAINT media_exactly_one_owner;
DROP INDEX media_travel_leg_position_idx;
ALTER TABLE media DROP COLUMN travel_leg_id;
ALTER TABLE media ALTER COLUMN visit_id SET NOT NULL;
DROP TABLE travel_legs;
