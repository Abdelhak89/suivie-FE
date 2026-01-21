CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS fe_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file text NOT NULL,
  source_sheet text NOT NULL DEFAULT 'DATA',
  source_row int NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),

  -- champs indexables
  numero_fe text,
  statut text,
  creee_le text,
  code_article text,
  designation text,
  code_lancement text,
  animateur text,
  origine text,
  type_nc text,
  lieu_detection text,
  code_fournisseur text,
  nom_fournisseur text,
  pilote_qse text,
  ilot_generateur text,
  semaine text,
  annee text,

  -- toutes les colonnes Excel
  data jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fe_numero ON fe_records (numero_fe);
CREATE INDEX IF NOT EXISTS idx_fe_statut ON fe_records (statut);
CREATE INDEX IF NOT EXISTS idx_fe_article ON fe_records (code_article);
CREATE INDEX IF NOT EXISTS idx_fe_lancement ON fe_records (code_lancement);
CREATE INDEX IF NOT EXISTS idx_fe_frs ON fe_records (nom_fournisseur);
CREATE INDEX IF NOT EXISTS idx_fe_semaine_annee ON fe_records (annee, semaine);
CREATE INDEX IF NOT EXISTS idx_fe_data_gin ON fe_records USING gin (data);
