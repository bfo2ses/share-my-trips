DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM travel_legs WHERE transport = 'BUS') THEN
    RAISE EXCEPTION 'cannot roll back BUS transport while BUS travel legs exist';
  END IF;
END $$;

ALTER TABLE travel_legs DROP CONSTRAINT IF EXISTS travel_legs_transport_check;

ALTER TABLE travel_legs
  ADD CONSTRAINT travel_legs_transport_check
  CHECK (transport IN ('CAR', 'TRAIN', 'PLANE', 'BOAT'));
