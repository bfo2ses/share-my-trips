ALTER TABLE visits ADD COLUMN position INT NOT NULL DEFAULT 0;

-- Backfill existing visits with a stable, non-colliding position per
-- (primary stage, date) group, ordered by creation time.
WITH ranked AS (
  SELECT v.id,
         ROW_NUMBER() OVER (
           PARTITION BY vs.stage_id, v.date
           ORDER BY v.created_at
         ) - 1 AS rn
  FROM visits v
  JOIN visit_stages vs ON vs.visit_id = v.id AND vs.position = 0
)
UPDATE visits
SET position = ranked.rn
FROM ranked
WHERE visits.id = ranked.id;
