ALTER TABLE media RENAME COLUMN visit_id TO day_id;
ALTER TABLE visit_stages RENAME COLUMN visit_id TO day_id;
ALTER TABLE visit_stages RENAME TO day_stages;
ALTER TABLE visits RENAME TO days;
