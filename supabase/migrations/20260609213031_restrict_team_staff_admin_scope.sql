-- Restrict global admin powers to super admins only.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
  )
$$;

-- Team staff can manage only their assigned team, while super admins can manage any team.
CREATE OR REPLACE FUNCTION is_team_staff(target_team_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (
        role = 'super_admin'
        OR (
          team_id = target_team_id
          AND role IN ('coach', 'team_admin')
        )
      )
  )
$$;

DROP POLICY IF EXISTS "players_admin_write" ON players;

DROP POLICY IF EXISTS "fixtures_admin_write" ON fixtures;
CREATE POLICY "fixtures_admin_write" ON fixtures FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "match_scores_operator_write" ON match_scores;
CREATE POLICY "match_scores_operator_write" ON match_scores FOR ALL
  USING (auth_user_role() IN ('super_admin', 'livestream_operator'))
  WITH CHECK (auth_user_role() IN ('super_admin', 'livestream_operator'));

DROP POLICY IF EXISTS "formations_admin_write" ON formations;
CREATE POLICY "formations_team_staff_write" ON formations FOR ALL
  USING (is_team_staff(team_id))
  WITH CHECK (is_team_staff(team_id));
