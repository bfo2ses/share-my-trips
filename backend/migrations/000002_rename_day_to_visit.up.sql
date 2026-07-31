ALTER TABLE days RENAME TO visits;
ALTER TABLE day_stages RENAME TO visit_stages;
ALTER TABLE visit_stages RENAME COLUMN day_id TO visit_id;
ALTER TABLE media RENAME COLUMN day_id TO visit_id;
