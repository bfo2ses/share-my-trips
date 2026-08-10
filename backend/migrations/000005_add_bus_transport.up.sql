ALTER TABLE travel_legs DROP CONSTRAINT IF EXISTS travel_legs_transport_check;

ALTER TABLE travel_legs
  ADD CONSTRAINT travel_legs_transport_check
  CHECK (transport IN ('CAR', 'TRAIN', 'PLANE', 'BOAT', 'BUS'));
