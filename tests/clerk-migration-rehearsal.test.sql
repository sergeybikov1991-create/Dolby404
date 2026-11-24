\\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  policy_total integer;
  public_uid_policies integer;
  storage_uid_policies integer;
  app_user_fks integer;
  auth_user_fks integer;
BEGIN
  SELECT count(*) INTO policy_total FROM pg_policies
  WHERE (schemaname='public' AND tablename IN (
    'backgammon_matches','comments','device_push_tokens','direct_message_favorites',
    'direct_message_hidden','direct_message_pins','direct_message_reactions','direct_messages',
    'follows','friend_requests','likes','music_tracks','photo_album_photos','post_reactions',
    'posts','private_album_photos','private_photo_albums','private_video_album_videos',
    'profile_photo_likes','profile_privacy_settings','profile_visits','profiles','reposts',
    'scheduled_posts','video_album_videos'
  )) OR (schemaname='storage' AND tablename='objects');
  IF policy_total <> 104 THEN RAISE EXCEPTION 'Expected 104 recreated policies, got %', policy_total; END IF;

  SELECT count(*) INTO public_uid_policies FROM pg_policies
  WHERE schemaname='public' AND (
    coalesce(qual,'') ILIKE '%auth.uid()%' OR coalesce(with_check,'') ILIKE '%auth.uid()%'
  );
  SELECT count(*) INTO storage_uid_policies FROM pg_policies
  WHERE schemaname='storage' AND (
    coalesce(qual,'') ILIKE '%auth.uid()%' OR coalesce(with_check,'') ILIKE '%auth.uid()%'
  );
  IF public_uid_policies <> 0 OR storage_uid_policies <> 0 THEN
    RAISE EXCEPTION 'Legacy auth.uid() remains in policies: public %, storage %', public_uid_policies, storage_uid_policies;
  END IF;

  SELECT count(*) INTO app_user_fks FROM pg_constraint
  WHERE contype='f' AND confrelid='public.app_users'::regclass;
  SELECT count(*) INTO auth_user_fks FROM pg_constraint
  WHERE contype='f' AND confrelid='auth.users'::regclass
    AND connamespace IN ('public'::regnamespace, 'private'::regnamespace);
  IF app_user_fks <> 22 OR auth_user_fks <> 0 THEN
    RAISE EXCEPTION 'FK migration mismatch: app_users %, auth.users %', app_user_fks, auth_user_fks;
  END IF;
END;
$$;

-- Existing Supabase UUID subjects remain valid during stabilization.
SELECT set_config('request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111"}', true);
DO $$
BEGIN
  IF public.floustream_user_id() <> '11111111-1111-4111-8111-111111111111'::uuid THEN
    RAISE EXCEPTION 'Legacy UUID subject did not resolve';
  END IF;
END;
$$;

-- A new Clerk account first gets a shadow auth.users row. The before-insert
-- trigger creates its registry row; the trusted service-role RPC links it.
INSERT INTO auth.users(id,email) VALUES
 ('33333333-3333-4333-8333-333333333333','new-clerk-user@example.test');

SET LOCAL ROLE service_role;
SELECT public.provision_clerk_user(
  '33333333-3333-4333-8333-333333333333'::uuid,
  'user_test123',
  'new-clerk-user@example.test',
  'Test',
  'User',
  'LV',
  'en',
  NULL,
  'low',
  NULL
);
RESET ROLE;

SELECT set_config('request.jwt.claims',
  '{"sub":"user_test123","app_user_id":"33333333-3333-4333-8333-333333333333"}', true);
DO $$
BEGIN
  IF public.floustream_user_id() <> '33333333-3333-4333-8333-333333333333'::uuid THEN
    RAISE EXCEPTION 'Clerk subject + mapped UUID did not resolve';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id='33333333-3333-4333-8333-333333333333') THEN
    RAISE EXCEPTION 'Clerk provisioning did not create a profile';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.private_photo_albums WHERE owner_id='33333333-3333-4333-8333-333333333333') THEN
    RAISE EXCEPTION 'Clerk provisioning did not create a private album';
  END IF;
END;
$$;

-- A Clerk token cannot claim another account's UUID unless its subject matches
-- the server-managed app_users.clerk_user_id mapping.
SELECT set_config('request.jwt.claims',
  '{"sub":"user_attacker","app_user_id":"33333333-3333-4333-8333-333333333333"}', true);
DO $$
BEGIN
  IF public.floustream_user_id() IS NOT NULL THEN
    RAISE EXCEPTION 'Mismatched Clerk subject unexpectedly resolved to a user UUID';
  END IF;
END;
$$;

-- RLS isolation test for both legacy and Clerk sessions.
INSERT INTO public.device_push_tokens(user_id) VALUES
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333');
INSERT INTO storage.objects(bucket_id,name) VALUES
 ('message-media','33333333-3333-4333-8333-333333333333/own.bin'),
 ('message-media','22222222-2222-4222-8222-222222222222/other.bin');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"user_test123","app_user_id":"33333333-3333-4333-8333-333333333333"}', true);
DO $$
BEGIN
  IF (SELECT count(*) FROM public.device_push_tokens) <> 1 THEN
    RAISE EXCEPTION 'Device push-token RLS did not isolate the Clerk user';
  END IF;
  IF (SELECT count(*) FROM storage.objects WHERE bucket_id='message-media') <> 1 THEN
    RAISE EXCEPTION 'Storage RLS did not isolate the Clerk user media';
  END IF;
END;
$$;
RESET ROLE;

COMMIT;
