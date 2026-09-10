-- ──────────────────────────────────────────────────────────────────────────────
-- 003_register_rpc.sql
-- Adds the RPC used by the register page to atomically create an organisation
-- and a user profile in a single SECURITY DEFINER call, bypassing RLS.
-- Also adds the missing RLS policy for organisations.
-- ──────────────────────────────────────────────────────────────────────────────

-- Allow authenticated users to read their own organisation
CREATE POLICY "read_own_org" ON organisations
  FOR SELECT TO authenticated
  USING (id = my_org_id());

-- RPC: atomically create org + admin profile for a newly-registered user.
-- Runs as SECURITY DEFINER so it can INSERT into organisations/user_profiles
-- even though those tables are protected by RLS.
CREATE OR REPLACE FUNCTION create_org_and_profile(
  p_prenom  text,
  p_nom     text,
  p_org_nom text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Idempotent: do nothing if the user already has a profile
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()) THEN
    RETURN;
  END IF;

  INSERT INTO organisations (nom)
  VALUES (p_org_nom)
  RETURNING id INTO v_org_id;

  INSERT INTO user_profiles (id, org_id, prenom, nom, role)
  VALUES (auth.uid(), v_org_id, p_prenom, p_nom, 'admin');
END;
$$;
