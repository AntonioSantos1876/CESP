-- ============================================================
-- ACCESS REQUESTS + TEAM UNIQUENESS
-- ============================================================

CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL,
  requested_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  requested_team_name TEXT,
  requested_team_short_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (requested_role IN ('fan', 'supporter', 'volunteer', 'photographer', 'coach', 'livestream_operator', 'team_admin')),
  CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE TRIGGER access_requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE UNIQUE INDEX teams_name_unique_ci ON teams (LOWER(name));
CREATE UNIQUE INDEX teams_short_name_unique_ci ON teams (LOWER(short_name));

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested_role_text TEXT := LOWER(COALESCE(NEW.raw_user_meta_data->>'requested_role', 'fan'));
  requested_team_type TEXT := LOWER(COALESCE(NEW.raw_user_meta_data->>'requested_team_type', 'none'));
  requested_team_id_text TEXT := NULLIF(NEW.raw_user_meta_data->>'requested_team_id', '');
  requested_team_name_text TEXT := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'requested_team_name', '')), '');
  requested_team_short_name_text TEXT := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'requested_team_short_name', '')), '');
  assigned_team_id UUID := NULL;
BEGIN
  IF requested_team_type = 'existing' AND requested_team_id_text IS NOT NULL AND requested_role_text IN ('fan', 'supporter') THEN
    assigned_team_id := requested_team_id_text::UUID;
  END IF;

  INSERT INTO profiles (id, email, full_name, avatar_url, team_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    assigned_team_id
  );

  IF requested_role_text NOT IN ('fan', 'supporter') THEN
    INSERT INTO access_requests (
      user_id,
      requested_role,
      requested_team_id,
      requested_team_name,
      requested_team_short_name
    )
    VALUES (
      NEW.id,
      requested_role_text,
      CASE WHEN requested_team_type = 'existing' AND requested_team_id_text IS NOT NULL THEN requested_team_id_text::UUID ELSE NULL END,
      CASE WHEN requested_team_type = 'new' THEN requested_team_name_text ELSE NULL END,
      CASE WHEN requested_team_type = 'new' THEN requested_team_short_name_text ELSE NULL END
    );
  END IF;

  RETURN NEW;
END;
$$;

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_requests_own_read" ON access_requests FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "access_requests_own_insert" ON access_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "access_requests_own_update" ON access_requests FOR UPDATE
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "access_requests_admin_delete" ON access_requests FOR DELETE
  USING (is_admin());

CREATE POLICY "access_requests_own_delete" ON access_requests FOR DELETE
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION is_team_staff(target_team_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND team_id = target_team_id
      AND role IN ('coach', 'team_admin', 'super_admin')
  )
$$;

CREATE POLICY "players_team_staff_write" ON players FOR ALL USING (
  is_team_staff(team_id)
)
WITH CHECK (
  is_team_staff(team_id)
);
