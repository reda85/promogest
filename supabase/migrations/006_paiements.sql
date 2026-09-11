-- 006_paiements.sql
-- Suivi des paiements d'une réservation : type (avance, mensualité, versement,
-- solde final…), montant et date. Sert de base au blocage de la transition
-- vers VENDU tant que le prix n'est pas intégralement réglé.

CREATE TYPE type_paiement AS ENUM ('AVANCE','MENSUALITE','VERSEMENT','SOLDE_FINAL','AUTRE');

CREATE TABLE IF NOT EXISTS paiements (
  id             uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid           NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  type           type_paiement  NOT NULL DEFAULT 'VERSEMENT',
  montant        numeric(12,2)  NOT NULL CHECK (montant > 0),
  date_paiement  date           NOT NULL,
  mode_paiement  text,
  reference      text,
  notes          text,
  created_at     timestamptz    NOT NULL DEFAULT now()
);

ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_paiements" ON paiements
  USING (
    reservation_id IN (
      SELECT id FROM reservations WHERE client_id IN (
        SELECT id FROM clients WHERE org_id = my_org_id()
      )
    )
  )
  WITH CHECK (
    reservation_id IN (
      SELECT id FROM reservations WHERE client_id IN (
        SELECT id FROM clients WHERE org_id = my_org_id()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_paiements_reservation ON paiements(reservation_id);
CREATE INDEX IF NOT EXISTS idx_paiements_date        ON paiements(date_paiement);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.paiements TO authenticated, anon;
