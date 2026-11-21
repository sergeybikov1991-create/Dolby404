-- Restrict public photo/video album rows and objects to permanent signed-in users.
-- Public profile visibility remains available to signed-in members.
-- Profile avatars remain public through their dedicated policies.

DROP POLICY IF EXISTS "Public album photos are viewable by everyone" ON public.photo_album_photos;
CREATE POLICY "Public album photos are viewable by permanent users"
ON public.photo_album_photos
FOR SELECT
TO authenticated
USING (
  private.is_profile_section_public(owner_id, 'album')
  AND COALESCE((SELECT (auth.jwt()->>'is_anonymous')::boolean), false) = false
);

DROP POLICY IF EXISTS "Visible video album videos are viewable" ON public.video_album_videos;
CREATE POLICY "Visible video album videos are viewable by permanent users"
ON public.video_album_videos
FOR SELECT
TO authenticated
USING (
  private.is_profile_section_public(owner_id, 'videos')
  AND COALESCE((SELECT (auth.jwt()->>'is_anonymous')::boolean), false) = false
);

DROP POLICY IF EXISTS "Public album photos are publicly readable" ON storage.objects;
CREATE POLICY "Public album photos are readable by permanent users"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'photo-albums'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR (
      private.is_profile_section_public(((storage.foldername(name))[1])::uuid, 'album')
      AND COALESCE((SELECT (auth.jwt()->>'is_anonymous')::boolean), false) = false
    )
  )
);

DROP POLICY IF EXISTS "Video album files are readable by owner or public profile viewers" ON storage.objects;
CREATE POLICY "Video album files are readable by permanent users"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'video-albums'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR (
      private.is_profile_section_public(((storage.foldername(name))[1])::uuid, 'videos')
      AND COALESCE((SELECT (auth.jwt()->>'is_anonymous')::boolean), false) = false
    )
  )
);
