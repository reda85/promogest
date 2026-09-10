-- Exception requests table (price / advance reduction approvals)
CREATE TABLE IF NOT EXISTS exception_requests (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid        NOT NULL REFERENCES organisations(id)  ON DELETE CASCADE,
  reservation_id     uuid        NOT NULL REFERENCES reservations(id)   ON DELETE CASCADE,
  type               text        NOT NULL CHECK (type IN ('PRIX', 'AVANCE')),
  current_value      numeric     NOT NULL,
  requested_value    numeric     NOT NULL,
  justification      text        NOT NULL,
  requested_by_role  text        NOT NULL,
  requested_by_name  text        NOT NULL,
  status             text        NOT NULL DEFAULT 'EN_ATTENTE'
                                 CHECK (status IN ('EN_ATTENTE', 'APPROUVE', 'REJETE')),
  admin_comment      text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  resolved_at        timestamptz
);

ALTER TABLE exception_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON exception_requests
  USING  (org_id = my_org_id())
  WITH CHECK (org_id = my_org_id());

CREATE INDEX IF NOT EXISTS exception_requests_reservation_id_idx ON exception_requests(reservation_id);
CREATE INDEX IF NOT EXISTS exception_requests_status_idx         ON exception_requests(status);
CREATE INDEX IF NOT EXISTS exception_requests_org_id_idx         ON exception_requests(org_id);
