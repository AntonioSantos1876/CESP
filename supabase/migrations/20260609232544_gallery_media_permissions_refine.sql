DROP POLICY IF EXISTS "gallery_albums_author_insert" ON gallery_albums;
CREATE POLICY "gallery_albums_author_insert" ON gallery_albums FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND auth_user_role() IN ('super_admin', 'photographer')
  );

DROP POLICY IF EXISTS "gallery_photos_author_delete" ON gallery_photos;
CREATE POLICY "gallery_photos_super_admin_delete" ON gallery_photos FOR DELETE
  USING (auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "gallery_media_role_upload" ON storage.objects;
CREATE POLICY "gallery_media_role_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gallery-media'
    AND public.auth_user_role() IN ('super_admin', 'photographer')
  );

DROP POLICY IF EXISTS "gallery_media_super_admin_delete" ON storage.objects;
CREATE POLICY "gallery_media_super_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'gallery-media'
    AND public.auth_user_role() = 'super_admin'
  );
