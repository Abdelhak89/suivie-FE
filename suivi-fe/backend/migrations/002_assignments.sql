-- Ajouts dans fe_records
ALTER TABLE fe_records
  ADD COLUMN IF NOT EXISTS assigned_to TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_fe_assigned_to ON fe_records(assigned_to);

-- Portefeuille client par qualiticien
CREATE TABLE IF NOT EXISTS qualiticien_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qualiticien TEXT NOT NULL,
  client TEXT NOT NULL,
  UNIQUE (qualiticien, client)
);

CREATE INDEX IF NOT EXISTS idx_qc_qualiticien ON qualiticien_clients(qualiticien);
CREATE INDEX IF NOT EXISTS idx_qc_client ON qualiticien_clients(client);
