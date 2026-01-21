ALTER TABLE fe_records
  ADD COLUMN IF NOT EXISTS animateur TEXT,
  ADD COLUMN IF NOT EXISTS date_creation DATE;

CREATE INDEX IF NOT EXISTS idx_fe_animateur ON fe_records(animateur);
CREATE INDEX IF NOT EXISTS idx_fe_date_creation ON fe_records(date_creation);
