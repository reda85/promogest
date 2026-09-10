-- 005_taches.sql
-- Tâches / activités (style Pipedrive) : appels, rendez-vous, relances, e-mails,
-- visites… rattachées optionnellement à un client, une réservation ou un projet.

CREATE TYPE type_tache     AS ENUM ('APPEL','RDV','RELANCE','EMAIL','VISITE','DOCUMENT','AUTRE');
CREATE TYPE priorite_tache AS ENUM ('BASSE','NORMALE','HAUTE');

CREATE TABLE IF NOT EXISTS taches (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid           NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  titre            text           NOT NULL,
  type             type_tache     NOT NULL DEFAULT 'APPEL',
  priorite         priorite_tache NOT NULL DEFAULT 'NORMALE',
  description      text,
  echeance         timestamptz    NOT NULL,
  terminee         boolean        NOT NULL DEFAULT false,
  date_realisation timestamptz,
  agent            text,
  client_id        uuid           REFERENCES clients(id)      ON DELETE CASCADE,
  reservation_id   uuid           REFERENCES reservations(id) ON DELETE CASCADE,
  projet_id        uuid           REFERENCES projets(id)      ON DELETE CASCADE,
  created_at       timestamptz    NOT NULL DEFAULT now(),
  updated_at       timestamptz    NOT NULL DEFAULT now()
);

ALTER TABLE taches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_taches" ON taches
  USING      (org_id = my_org_id())
  WITH CHECK (org_id = my_org_id());

CREATE TRIGGER trg_taches_updated_at
  BEFORE UPDATE ON taches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_taches_org         ON taches(org_id);
CREATE INDEX IF NOT EXISTS idx_taches_client      ON taches(client_id);
CREATE INDEX IF NOT EXISTS idx_taches_reservation ON taches(reservation_id);
CREATE INDEX IF NOT EXISTS idx_taches_projet      ON taches(projet_id);
CREATE INDEX IF NOT EXISTS idx_taches_echeance    ON taches(echeance);
CREATE INDEX IF NOT EXISTS idx_taches_terminee    ON taches(terminee);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.taches TO authenticated, anon;
