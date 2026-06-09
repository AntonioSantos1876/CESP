ALTER TABLE gallery_photos
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Gallery Upload',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'matchday',
  ADD COLUMN IF NOT EXISTS aspect TEXT NOT NULL DEFAULT 'square';

ALTER TABLE gallery_photos
  DROP CONSTRAINT IF EXISTS gallery_photos_media_type_check;

ALTER TABLE gallery_photos
  ADD CONSTRAINT gallery_photos_media_type_check
  CHECK (media_type IN ('image', 'video'));

ALTER TABLE gallery_photos
  DROP CONSTRAINT IF EXISTS gallery_photos_category_check;

ALTER TABLE gallery_photos
  ADD CONSTRAINT gallery_photos_category_check
  CHECK (category IN ('spotlight', 'teams', 'matchday', 'awards'));

ALTER TABLE gallery_photos
  DROP CONSTRAINT IF EXISTS gallery_photos_aspect_check;

ALTER TABLE gallery_photos
  ADD CONSTRAINT gallery_photos_aspect_check
  CHECK (aspect IN ('square', 'wide', 'tall'));

CREATE INDEX IF NOT EXISTS idx_gallery_photos_created_at ON gallery_photos(created_at DESC);

DROP POLICY IF EXISTS "gallery_albums_author_insert" ON gallery_albums;
CREATE POLICY "gallery_albums_author_insert" ON gallery_albums FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND auth_user_role() IN ('super_admin', 'team_admin', 'photographer', 'coach')
  );

DROP POLICY IF EXISTS "gallery_photos_author_write" ON gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_author_insert" ON gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_author_update" ON gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_author_delete" ON gallery_photos;

CREATE POLICY "gallery_photos_author_insert" ON gallery_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM gallery_albums ga
      WHERE ga.id = album_id
        AND (ga.author_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "gallery_photos_author_update" ON gallery_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM gallery_albums ga
      WHERE ga.id = album_id
        AND (ga.author_id = auth.uid() OR is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM gallery_albums ga
      WHERE ga.id = album_id
        AND (ga.author_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "gallery_photos_author_delete" ON gallery_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM gallery_albums ga
      WHERE ga.id = album_id
        AND (ga.author_id = auth.uid() OR is_admin())
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-media', 'gallery-media', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "gallery_media_public_read" ON storage.objects;
CREATE POLICY "gallery_media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery-media');

DROP POLICY IF EXISTS "gallery_media_role_upload" ON storage.objects;
CREATE POLICY "gallery_media_role_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gallery-media'
    AND public.auth_user_role() IN ('super_admin', 'team_admin', 'photographer', 'coach')
  );
