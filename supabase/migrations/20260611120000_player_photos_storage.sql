-- Storage bucket for player profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "player_photos_public_read" ON storage.objects;
CREATE POLICY "player_photos_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'player-photos');

-- Upload: team_admin, coach, super_admin, photographer
DROP POLICY IF EXISTS "player_photos_role_upload" ON storage.objects;
CREATE POLICY "player_photos_role_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'player-photos'
    AND auth_user_role() IN ('super_admin', 'team_admin', 'coach', 'photographer')
  );

-- Update / replace existing object
DROP POLICY IF EXISTS "player_photos_role_update" ON storage.objects;
CREATE POLICY "player_photos_role_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'player-photos'
    AND auth_user_role() IN ('super_admin', 'team_admin', 'coach', 'photographer')
  );

-- Delete: super_admin and team_admin only
DROP POLICY IF EXISTS "player_photos_role_delete" ON storage.objects;
CREATE POLICY "player_photos_role_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'player-photos'
    AND auth_user_role() IN ('super_admin', 'team_admin')
  );

-- Allow team_admin and coach to update their own team's player photo_url
-- (super_admin already covered by existing players_admin_write policy which uses is_admin())
DROP POLICY IF EXISTS "players_coach_photo_update" ON players;
CREATE POLICY "players_coach_photo_update" ON players FOR UPDATE
  USING (
    auth_user_role() IN ('coach', 'photographer')
    AND team_id IN (
      SELECT team_id FROM profiles
      WHERE id = auth.uid() AND team_id IS NOT NULL
    )
  );
