-- 004_notaires_grants.sql
-- The notaires table was missing explicit grants for the authenticated role.
-- Supabase auto-grants via ALTER DEFAULT PRIVILEGES apply only when tables are
-- created by the role that originally ran the ALTER DEFAULT PRIVILEGES setup.
-- Adding explicit grants here covers any gap.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notaires TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notaires TO anon;

-- While we're here, ensure all other app tables have the same explicit grants
-- so any similar edge-cases are covered across the board.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projets             TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ghs                 TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.immeubles           TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.unites              TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clients             TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reservations        TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.historique_unites   TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dossiers_notaire    TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.documents_dossier   TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles       TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.organisations       TO authenticated, anon;
