-- DRAFT ONLY — generated from a read-only catalog audit.
-- DO NOT APPLY to production or any live database before:
-- (1) a restorable DB + Storage backup is verified,
-- (2) this draft is rehearsed on an isolated database,
-- (3) the Clerk app, JWT claim and provisioning function are configured,
-- (4) a tested rollback procedure is approved.
-- This draft changes identity foreign keys and RLS policies. It has NOT been executed.

BEGIN;

CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY,
  clerk_user_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_users_clerk_user_id_nonempty CHECK (clerk_user_id IS NULL OR length(btrim(clerk_user_id)) > 0)
);

COMMENT ON TABLE public.app_users IS
  'Provider-independent FLOUSTREAM identity registry. id preserves existing application UUIDs; clerk_user_id maps Clerk identities.';

-- Preserve every existing Supabase Auth UUID before redirecting application FKs.
INSERT INTO public.app_users (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_users FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.app_users TO service_role;

-- Preserve legacy Supabase Auth registrations during the transition window.
CREATE OR REPLACE FUNCTION public.register_legacy_auth_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.app_users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.register_legacy_auth_identity() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS floustream_register_legacy_auth_identity ON auth.users;
CREATE TRIGGER floustream_register_legacy_auth_identity
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.register_legacy_auth_identity();

-- Resolve a stable FLOUSTREAM UUID from a verified Clerk claim.
-- Clerk's app_user_id claim is accepted only when it matches the server-managed
-- app_users mapping for the same Clerk subject. Legacy Supabase UUID subjects
-- remain accepted during the stabilization window.
CREATE OR REPLACE FUNCTION public.floustream_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  claims jsonb := auth.jwt();
  claim_user_id text := claims ->> 'app_user_id';
  subject text := claims ->> 'sub';
  candidate uuid;
BEGIN
  IF claim_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    candidate := claim_user_id::uuid;
    IF EXISTS (
      SELECT 1 FROM public.app_users u
      WHERE u.id = candidate AND u.clerk_user_id = subject
    ) THEN
      RETURN candidate;
    END IF;
    RETURN NULL;
  END IF;

  IF subject ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    candidate := subject::uuid;
    IF EXISTS (SELECT 1 FROM public.app_users u WHERE u.id = candidate) THEN
      RETURN candidate;
    END IF;
  END IF;

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.floustream_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.floustream_user_id() TO anon, authenticated;

-- Trusted, idempotent provisioning entry point. The Edge Function must first
-- verify the Clerk JWT and primary email, then create a matching Supabase Auth
-- shadow user through auth.admin.createUser (with an inaccessible random password
-- and verified email) so every app_users identity remains recoverable on rollback.
-- It then sets Clerk external_id to that returned UUID and calls this RPC. Only
-- service_role may call this function. Existing imported users keep their current
-- auth.users rows and password hashes; they are not recreated.
CREATE OR REPLACE FUNCTION public.provision_clerk_user(
  p_user_id uuid,
  p_clerk_user_id text,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_country_code text,
  p_preferred_language text,
  p_username text DEFAULT NULL,
  p_registration_risk text DEFAULT 'low',
  p_registration_risk_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  email_domain text := lower(split_part(coalesce(p_email, ''), '@', 2));
  blocked_domain text;
  risk_value text := lower(coalesce(p_registration_risk, 'low'));
  risk_reason_value text := coalesce(p_registration_risk_reason, 'domain_requires_manual_review');
  display_value text;
  final_username text;
  registered_id uuid;
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = p_user_id AND lower(u.email) = lower(p_email)
    ) THEN
    RAISE EXCEPTION 'A matching Supabase Auth shadow identity is required for rollback safety';
  END IF;

  IF p_user_id IS NULL
    OR p_clerk_user_id IS NULL
    OR p_clerk_user_id !~ '^user_[A-Za-z0-9]+$'
    OR p_email IS NULL
    OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+$'
    OR nullif(trim(p_first_name), '') IS NULL
    OR nullif(trim(p_last_name), '') IS NULL
    OR upper(coalesce(p_country_code, '')) !~ '^[A-Z]{2,5}$'
    OR lower(coalesce(p_preferred_language, '')) NOT IN ('ru', 'en')
    OR risk_value NOT IN ('low', 'review') THEN
    RAISE EXCEPTION 'Invalid FLOUSTREAM account provisioning data';
  END IF;

  SELECT domain INTO blocked_domain
  FROM unnest(ARRAY[
    '10minutemail.com','10minutemail.net','guerrillamail.com','guerrillamail.net',
    'mailinator.com','yopmail.com','getnada.com','tempmail.com','temp-mail.org',
    'throwawaymail.com','dispostable.com','maildrop.cc','sharklasers.com',
    'fakeinbox.com','emailondeck.com','trashmail.com','mintemail.com',
    'mohmal.com','minuteinbox.com','mailnesia.com','mytemp.email'
  ]) AS domain
  WHERE email_domain = domain OR email_domain LIKE '%.' || domain
  LIMIT 1;

  IF blocked_domain IS NOT NULL THEN
    RAISE EXCEPTION 'disposable_email_domain_not_allowed';
  END IF;

  IF email_domain LIKE 'xn--%' OR email_domain ~ '[0-9]{3,}' THEN
    risk_value := 'review';
    risk_reason_value := 'unusual_email_domain';
  END IF;

  IF p_username IS NOT NULL AND p_username !~ '^[a-z0-9_]{3,24}$' THEN
    RAISE EXCEPTION 'username_invalid_format';
  END IF;

  final_username := coalesce(p_username, 'user_' || replace(p_user_id::text, '-', ''));
  display_value := trim(p_first_name) || ' ' || trim(p_last_name);

  INSERT INTO public.app_users (id, clerk_user_id)
  VALUES (p_user_id, p_clerk_user_id)
  ON CONFLICT (id) DO UPDATE
    SET clerk_user_id = EXCLUDED.clerk_user_id
    WHERE public.app_users.clerk_user_id IS NULL
       OR public.app_users.clerk_user_id = EXCLUDED.clerk_user_id
  RETURNING id INTO registered_id;

  IF registered_id IS NULL THEN
    RAISE EXCEPTION 'FLOUSTREAM identity is already linked to another Clerk account';
  END IF;

  INSERT INTO public.profiles (
    id, username, display_name, first_name, last_name,
    country_code, preferred_language, account_status
  ) VALUES (
    p_user_id, final_username, display_value, trim(p_first_name), trim(p_last_name),
    upper(p_country_code), lower(p_preferred_language), 'active'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.private_photo_albums(owner_id)
  VALUES (p_user_id)
  ON CONFLICT (owner_id) DO NOTHING;

  IF risk_value = 'review' THEN
    INSERT INTO public.account_registration_reviews(user_id, risk_level, reason)
    VALUES (p_user_id, 'review', risk_reason_value)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.provision_clerk_user(uuid, text, text, text, text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_clerk_user(uuid, text, text, text, text, text, text, text, text, text)
  TO service_role;

-- Move all 22 application foreign keys from auth.users to the stable registry.
-- Existing UUID values remain unchanged; ON DELETE behavior is preserved.
ALTER TABLE "private"."backgammon_actions" DROP CONSTRAINT "backgammon_actions_actor_id_fkey";
ALTER TABLE "private"."backgammon_actions" ADD CONSTRAINT "backgammon_actions_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."account_deletion_requests" DROP CONSTRAINT "account_deletion_requests_user_id_fkey";
ALTER TABLE "public"."account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."account_registration_reviews" DROP CONSTRAINT "account_registration_reviews_user_id_fkey";
ALTER TABLE "public"."account_registration_reviews" ADD CONSTRAINT "account_registration_reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."backgammon_matches" DROP CONSTRAINT "backgammon_matches_player_a_fkey";
ALTER TABLE "public"."backgammon_matches" ADD CONSTRAINT "backgammon_matches_player_a_fkey" FOREIGN KEY (player_a) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."backgammon_matches" DROP CONSTRAINT "backgammon_matches_player_b_fkey";
ALTER TABLE "public"."backgammon_matches" ADD CONSTRAINT "backgammon_matches_player_b_fkey" FOREIGN KEY (player_b) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."device_push_tokens" DROP CONSTRAINT "device_push_tokens_user_id_fkey";
ALTER TABLE "public"."device_push_tokens" ADD CONSTRAINT "device_push_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_message_favorites" DROP CONSTRAINT "direct_message_favorites_user_id_fkey";
ALTER TABLE "public"."direct_message_favorites" ADD CONSTRAINT "direct_message_favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_message_hidden" DROP CONSTRAINT "direct_message_hidden_user_id_fkey";
ALTER TABLE "public"."direct_message_hidden" ADD CONSTRAINT "direct_message_hidden_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_message_pins" DROP CONSTRAINT "direct_message_pins_user_id_fkey";
ALTER TABLE "public"."direct_message_pins" ADD CONSTRAINT "direct_message_pins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_message_reactions" DROP CONSTRAINT "direct_message_reactions_user_id_fkey";
ALTER TABLE "public"."direct_message_reactions" ADD CONSTRAINT "direct_message_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_messages" DROP CONSTRAINT "direct_messages_recipient_id_fkey";
ALTER TABLE "public"."direct_messages" ADD CONSTRAINT "direct_messages_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_messages" DROP CONSTRAINT "direct_messages_sender_id_fkey";
ALTER TABLE "public"."direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."music_tracks" DROP CONSTRAINT "music_tracks_owner_id_fkey";
ALTER TABLE "public"."music_tracks" ADD CONSTRAINT "music_tracks_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."photo_album_photos" DROP CONSTRAINT "photo_album_photos_owner_id_fkey";
ALTER TABLE "public"."photo_album_photos" ADD CONSTRAINT "photo_album_photos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."post_reactions" DROP CONSTRAINT "post_reactions_user_id_fkey";
ALTER TABLE "public"."post_reactions" ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."private_album_photos" DROP CONSTRAINT "private_album_photos_owner_id_fkey";
ALTER TABLE "public"."private_album_photos" ADD CONSTRAINT "private_album_photos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."private_photo_albums" DROP CONSTRAINT "private_photo_albums_owner_id_fkey";
ALTER TABLE "public"."private_photo_albums" ADD CONSTRAINT "private_photo_albums_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."private_video_album_videos" DROP CONSTRAINT "private_video_album_videos_owner_id_fkey";
ALTER TABLE "public"."private_video_album_videos" ADD CONSTRAINT "private_video_album_videos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profile_privacy_settings" DROP CONSTRAINT "profile_privacy_settings_owner_id_fkey";
ALTER TABLE "public"."profile_privacy_settings" ADD CONSTRAINT "profile_privacy_settings_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profile_visits" DROP CONSTRAINT "profile_visits_visitor_id_fkey";
ALTER TABLE "public"."profile_visits" ADD CONSTRAINT "profile_visits_visitor_id_fkey" FOREIGN KEY (visitor_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles" DROP CONSTRAINT "profiles_id_fkey";
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE "public"."video_album_videos" DROP CONSTRAINT "video_album_videos_owner_id_fkey";
ALTER TABLE "public"."video_album_videos" ADD CONSTRAINT "video_album_videos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

-- Recreate every policy that referenced auth.uid(), retaining names, roles,
-- commands, permissive/restrictive mode, USING and WITH CHECK semantics.
DROP POLICY IF EXISTS "backgammon_players_read_match" ON "public"."backgammon_matches";
CREATE POLICY "backgammon_players_read_match" ON "public"."backgammon_matches"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT (SELECT public.floustream_user_id()) AS uid) = player_a) OR (( SELECT (SELECT public.floustream_user_id()) AS uid) = player_b)));

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON "public"."comments";
CREATE POLICY "Comments are viewable by everyone" ON "public"."comments"
  AS PERMISSIVE
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = comments.post_id) AND ((p.user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) OR private.is_profile_section_public(p.user_id, 'comments'::text))))));

DROP POLICY IF EXISTS "Users can add own comments" ON "public"."comments";
CREATE POLICY "Users can add own comments" ON "public"."comments"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "Users can delete own comments" ON "public"."comments";
CREATE POLICY "Users can delete own comments" ON "public"."comments"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."comments";
CREATE POLICY "account_active_guard" ON "public"."comments"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Users can delete their own push tokens" ON "public"."device_push_tokens";
CREATE POLICY "Users can delete their own push tokens" ON "public"."device_push_tokens"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((SELECT public.floustream_user_id()) = user_id));

DROP POLICY IF EXISTS "Users can read their own push tokens" ON "public"."device_push_tokens";
CREATE POLICY "Users can read their own push tokens" ON "public"."device_push_tokens"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((SELECT public.floustream_user_id()) = user_id));

DROP POLICY IF EXISTS "Users can register their own push tokens" ON "public"."device_push_tokens";
CREATE POLICY "Users can register their own push tokens" ON "public"."device_push_tokens"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((SELECT public.floustream_user_id()) = user_id));

DROP POLICY IF EXISTS "Users can update their own push tokens" ON "public"."device_push_tokens";
CREATE POLICY "Users can update their own push tokens" ON "public"."device_push_tokens"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING (((SELECT public.floustream_user_id()) = user_id))
  WITH CHECK (((SELECT public.floustream_user_id()) = user_id));

DROP POLICY IF EXISTS "Users can favorite messages in their conversations" ON "public"."direct_message_favorites";
CREATE POLICY "Users can favorite messages in their conversations" ON "public"."direct_message_favorites"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND ( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_favorites.message_id) AND ((dm.sender_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) OR (dm.recipient_id = ( SELECT (SELECT public.floustream_user_id()) AS uid))))))));

DROP POLICY IF EXISTS "Users can remove their own direct message favorites" ON "public"."direct_message_favorites";
CREATE POLICY "Users can remove their own direct message favorites" ON "public"."direct_message_favorites"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND ( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active)));

DROP POLICY IF EXISTS "Users can view their own direct message favorites" ON "public"."direct_message_favorites";
CREATE POLICY "Users can view their own direct message favorites" ON "public"."direct_message_favorites"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND ( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_favorites.message_id) AND ((dm.sender_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) OR (dm.recipient_id = ( SELECT (SELECT public.floustream_user_id()) AS uid))))))));

DROP POLICY IF EXISTS "Users can hide messages for themselves" ON "public"."direct_message_hidden";
CREATE POLICY "Users can hide messages for themselves" ON "public"."direct_message_hidden"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "Users can unhide their messages" ON "public"."direct_message_hidden";
CREATE POLICY "Users can unhide their messages" ON "public"."direct_message_hidden"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "Users can view their hidden messages" ON "public"."direct_message_hidden";
CREATE POLICY "Users can view their hidden messages" ON "public"."direct_message_hidden"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "Chat participants can pin messages for themselves" ON "public"."direct_message_pins";
CREATE POLICY "Chat participants can pin messages for themselves" ON "public"."direct_message_pins"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND ( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_pins.message_id) AND ((( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.sender_id) OR (( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.recipient_id)))))));

DROP POLICY IF EXISTS "Chat participants can view their pinned messages" ON "public"."direct_message_pins";
CREATE POLICY "Chat participants can view their pinned messages" ON "public"."direct_message_pins"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND ( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_pins.message_id) AND ((( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.sender_id) OR (( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.recipient_id)))))));

DROP POLICY IF EXISTS "Users can unpin their own messages" ON "public"."direct_message_pins";
CREATE POLICY "Users can unpin their own messages" ON "public"."direct_message_pins"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND ( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active)));

DROP POLICY IF EXISTS "Chat participants can add their own reactions" ON "public"."direct_message_reactions";
CREATE POLICY "Chat participants can add their own reactions" ON "public"."direct_message_reactions"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND ( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_reactions.message_id) AND ((( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.sender_id) OR (( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.recipient_id)))))));

DROP POLICY IF EXISTS "Chat participants can view message reactions" ON "public"."direct_message_reactions";
CREATE POLICY "Chat participants can view message reactions" ON "public"."direct_message_reactions"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_reactions.message_id) AND ((( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.sender_id) OR (( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.recipient_id)))))));

DROP POLICY IF EXISTS "Users can remove their own message reactions" ON "public"."direct_message_reactions";
CREATE POLICY "Users can remove their own message reactions" ON "public"."direct_message_reactions"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND ( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active)));

DROP POLICY IF EXISTS "Users can update their own message reactions" ON "public"."direct_message_reactions";
CREATE POLICY "Users can update their own message reactions" ON "public"."direct_message_reactions"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND ( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_reactions.message_id) AND ((( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.sender_id) OR (( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.recipient_id)))))));

DROP POLICY IF EXISTS "Authenticated users can send direct messages" ON "public"."direct_messages";
CREATE POLICY "Authenticated users can send direct messages" ON "public"."direct_messages"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((( SELECT (SELECT public.floustream_user_id()) AS uid) = sender_id) AND (recipient_id IS NOT NULL) AND ((length(TRIM(BOTH FROM COALESCE(content, ''::text))) > 0) OR (NULLIF(TRIM(BOTH FROM COALESCE(attachment_path, ''::text)), ''::text) IS NOT NULL) OR (jsonb_array_length(COALESCE(attachments, '[]'::jsonb)) > 0))));

DROP POLICY IF EXISTS "Recipients can mark incoming messages as read" ON "public"."direct_messages";
CREATE POLICY "Recipients can mark incoming messages as read" ON "public"."direct_messages"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING (((( SELECT (SELECT public.floustream_user_id()) AS uid) = recipient_id) AND (sender_id <> ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND (read_at IS NULL)))
  WITH CHECK (((( SELECT (SELECT public.floustream_user_id()) AS uid) = recipient_id) AND (sender_id <> ( SELECT (SELECT public.floustream_user_id()) AS uid))));

DROP POLICY IF EXISTS "Senders can delete their own direct messages" ON "public"."direct_messages";
CREATE POLICY "Senders can delete their own direct messages" ON "public"."direct_messages"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = sender_id));

DROP POLICY IF EXISTS "Senders can edit their own direct messages" ON "public"."direct_messages";
CREATE POLICY "Senders can edit their own direct messages" ON "public"."direct_messages"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = sender_id))
  WITH CHECK (((( SELECT (SELECT public.floustream_user_id()) AS uid) = sender_id) AND ( SELECT private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)) AS is_account_active)));

DROP POLICY IF EXISTS "Users read their direct messages" ON "public"."direct_messages";
CREATE POLICY "Users read their direct messages" ON "public"."direct_messages"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT (SELECT public.floustream_user_id()) AS uid) = sender_id) OR (( SELECT (SELECT public.floustream_user_id()) AS uid) = recipient_id)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."direct_messages";
CREATE POLICY "account_active_guard" ON "public"."direct_messages"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Users can follow" ON "public"."follows";
CREATE POLICY "Users can follow" ON "public"."follows"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = follower_id));

DROP POLICY IF EXISTS "Users can unfollow" ON "public"."follows";
CREATE POLICY "Users can unfollow" ON "public"."follows"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = follower_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."follows";
CREATE POLICY "account_active_guard" ON "public"."follows"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Participants can remove pending requests or friendships" ON "public"."friend_requests";
CREATE POLICY "Participants can remove pending requests or friendships" ON "public"."friend_requests"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((((( SELECT (SELECT public.floustream_user_id()) AS uid) = requester_id) AND (status = ANY (ARRAY['pending'::text, 'accepted'::text]))) OR ((( SELECT (SELECT public.floustream_user_id()) AS uid) = recipient_id) AND (status = ANY (ARRAY['pending'::text, 'accepted'::text])))));

DROP POLICY IF EXISTS "Recipients can accept friend requests" ON "public"."friend_requests";
CREATE POLICY "Recipients can accept friend requests" ON "public"."friend_requests"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING (((( SELECT (SELECT public.floustream_user_id()) AS uid) = recipient_id) AND (status = 'pending'::text)))
  WITH CHECK (((( SELECT (SELECT public.floustream_user_id()) AS uid) = recipient_id) AND (status = 'accepted'::text)));

DROP POLICY IF EXISTS "Users can send friend requests" ON "public"."friend_requests";
CREATE POLICY "Users can send friend requests" ON "public"."friend_requests"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((( SELECT (SELECT public.floustream_user_id()) AS uid) = requester_id) AND (requester_id <> recipient_id) AND (status = 'pending'::text) AND (user_low_id = LEAST(requester_id, recipient_id)) AND (user_high_id = GREATEST(requester_id, recipient_id))));

DROP POLICY IF EXISTS "Users can view their friend requests" ON "public"."friend_requests";
CREATE POLICY "Users can view their friend requests" ON "public"."friend_requests"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT (SELECT public.floustream_user_id()) AS uid) = requester_id) OR (( SELECT (SELECT public.floustream_user_id()) AS uid) = recipient_id)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."friend_requests";
CREATE POLICY "account_active_guard" ON "public"."friend_requests"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Users can add own likes" ON "public"."likes";
CREATE POLICY "Users can add own likes" ON "public"."likes"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "Users can remove own likes" ON "public"."likes";
CREATE POLICY "Users can remove own likes" ON "public"."likes"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."likes";
CREATE POLICY "account_active_guard" ON "public"."likes"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Owners manage their own music tracks" ON "public"."music_tracks";
CREATE POLICY "Owners manage their own music tracks" ON "public"."music_tracks"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."music_tracks";
CREATE POLICY "account_active_guard" ON "public"."music_tracks"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Owners manage their public album photos" ON "public"."photo_album_photos";
CREATE POLICY "Owners manage their public album photos" ON "public"."photo_album_photos"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."photo_album_photos";
CREATE POLICY "account_active_guard" ON "public"."photo_album_photos"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Users can add own post reactions" ON "public"."post_reactions";
CREATE POLICY "Users can add own post reactions" ON "public"."post_reactions"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "Users can remove own post reactions" ON "public"."post_reactions";
CREATE POLICY "Users can remove own post reactions" ON "public"."post_reactions"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "Users can update own post reactions" ON "public"."post_reactions";
CREATE POLICY "Users can update own post reactions" ON "public"."post_reactions"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id))
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."post_reactions";
CREATE POLICY "account_active_guard" ON "public"."post_reactions"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Create own posts" ON "public"."posts";
CREATE POLICY "Create own posts" ON "public"."posts"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON "public"."posts";
CREATE POLICY "Posts are viewable by everyone" ON "public"."posts"
  AS PERMISSIVE
  FOR SELECT
  TO "anon", "authenticated"
  USING (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) OR private.is_profile_section_public(user_id, 'feed'::text)));

DROP POLICY IF EXISTS "Users can delete own posts" ON "public"."posts";
CREATE POLICY "Users can delete own posts" ON "public"."posts"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "Users can update own posts" ON "public"."posts";
CREATE POLICY "Users can update own posts" ON "public"."posts"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id))
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."posts";
CREATE POLICY "account_active_guard" ON "public"."posts"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Owners manage their secret album photos" ON "public"."private_album_photos";
CREATE POLICY "Owners manage their secret album photos" ON "public"."private_album_photos"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."private_album_photos";
CREATE POLICY "account_active_guard" ON "public"."private_album_photos"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Owners access their secret album container" ON "public"."private_photo_albums";
CREATE POLICY "Owners access their secret album container" ON "public"."private_photo_albums"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."private_photo_albums";
CREATE POLICY "account_active_guard" ON "public"."private_photo_albums"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Owners manage their private video album videos" ON "public"."private_video_album_videos";
CREATE POLICY "Owners manage their private video album videos" ON "public"."private_video_album_videos"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."private_video_album_videos";
CREATE POLICY "account_active_guard" ON "public"."private_video_album_videos"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Users can like photos" ON "public"."profile_photo_likes";
CREATE POLICY "Users can like photos" ON "public"."profile_photo_likes"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "Users can remove own likes" ON "public"."profile_photo_likes";
CREATE POLICY "Users can remove own likes" ON "public"."profile_photo_likes"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."profile_photo_likes";
CREATE POLICY "account_active_guard" ON "public"."profile_photo_likes"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Users manage their own privacy settings" ON "public"."profile_privacy_settings";
CREATE POLICY "Users manage their own privacy settings" ON "public"."profile_privacy_settings"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."profile_privacy_settings";
CREATE POLICY "account_active_guard" ON "public"."profile_privacy_settings"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Users can add to own visit history" ON "public"."profile_visits";
CREATE POLICY "Users can add to own visit history" ON "public"."profile_visits"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = visitor_id));

DROP POLICY IF EXISTS "Users can delete own visit history" ON "public"."profile_visits";
CREATE POLICY "Users can delete own visit history" ON "public"."profile_visits"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = visitor_id));

DROP POLICY IF EXISTS "Users can read own visit history" ON "public"."profile_visits";
CREATE POLICY "Users can read own visit history" ON "public"."profile_visits"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = visitor_id));

DROP POLICY IF EXISTS "Users can update own visit history" ON "public"."profile_visits";
CREATE POLICY "Users can update own visit history" ON "public"."profile_visits"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = visitor_id))
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = visitor_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."profile_visits";
CREATE POLICY "account_active_guard" ON "public"."profile_visits"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";
CREATE POLICY "Users can update own profile" ON "public"."profiles"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = id))
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."profiles";
CREATE POLICY "account_active_guard" ON "public"."profiles"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Users can create own reposts" ON "public"."reposts";
CREATE POLICY "Users can create own reposts" ON "public"."reposts"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "Users can remove own reposts" ON "public"."reposts";
CREATE POLICY "Users can remove own reposts" ON "public"."reposts"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT (SELECT public.floustream_user_id()) AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."reposts";
CREATE POLICY "account_active_guard" ON "public"."reposts"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Users can create own scheduled posts" ON "public"."scheduled_posts";
CREATE POLICY "Users can create own scheduled posts" ON "public"."scheduled_posts"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND (status = 'pending'::text)));

DROP POLICY IF EXISTS "Users can delete own pending or failed scheduled posts" ON "public"."scheduled_posts";
CREATE POLICY "Users can delete own pending or failed scheduled posts" ON "public"."scheduled_posts"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND (status = ANY (ARRAY['pending'::text, 'failed'::text]))));

DROP POLICY IF EXISTS "Users can edit own pending or failed scheduled posts" ON "public"."scheduled_posts";
CREATE POLICY "Users can edit own pending or failed scheduled posts" ON "public"."scheduled_posts"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND (status = ANY (ARRAY['pending'::text, 'failed'::text]))))
  WITH CHECK (((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)) AND (status = ANY (ARRAY['pending'::text, 'failed'::text]))));

DROP POLICY IF EXISTS "Users can view own scheduled posts" ON "public"."scheduled_posts";
CREATE POLICY "Users can view own scheduled posts" ON "public"."scheduled_posts"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((user_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."scheduled_posts";
CREATE POLICY "account_active_guard" ON "public"."scheduled_posts"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Owners manage their video album videos" ON "public"."video_album_videos";
CREATE POLICY "Owners manage their video album videos" ON "public"."video_album_videos"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK ((owner_id = ( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."video_album_videos";
CREATE POLICY "account_active_guard" ON "public"."video_album_videos"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)))
  WITH CHECK (private.is_account_active(( SELECT (SELECT public.floustream_user_id()) AS uid)));

DROP POLICY IF EXISTS "Message participants read shared media" ON "storage"."objects";
CREATE POLICY "Message participants read shared media" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'message-media'::text) AND (((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text) OR (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.attachment_path = objects.name) AND ((( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.sender_id) OR (( SELECT (SELECT public.floustream_user_id()) AS uid) = dm.recipient_id))))))));

DROP POLICY IF EXISTS "Message sender deletes own media" ON "storage"."objects";
CREATE POLICY "Message sender deletes own media" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'message-media'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Message sender uploads own media" ON "storage"."objects";
CREATE POLICY "Message sender uploads own media" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'message-media'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Owners delete own video album files" ON "storage"."objects";
CREATE POLICY "Owners delete own video album files" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'video-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Owners delete public album photos" ON "storage"."objects";
CREATE POLICY "Owners delete public album photos" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'photo-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Owners read own photo album files" ON "storage"."objects";
CREATE POLICY "Owners read own photo album files" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'photo-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Owners read own private music" ON "storage"."objects";
CREATE POLICY "Owners read own private music" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'music-private'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Owners upload own video album files" ON "storage"."objects";
CREATE POLICY "Owners upload own video album files" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'video-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Owners upload public album photos" ON "storage"."objects";
CREATE POLICY "Owners upload public album photos" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'photo-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Private video owner deletes own files" ON "storage"."objects";
CREATE POLICY "Private video owner deletes own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'private-video-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Private video owner reads own files" ON "storage"."objects";
CREATE POLICY "Private video owner reads own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'private-video-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Private video owner uploads own files" ON "storage"."objects";
CREATE POLICY "Private video owner uploads own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'private-video-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Public music files are readable" ON "storage"."objects";
CREATE POLICY "Public music files are readable" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "anon", "authenticated"
  USING (((bucket_id = 'music-public'::text) AND (((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text) OR private.is_profile_section_public(((storage.foldername(name))[1])::uuid, 'music'::text))));

DROP POLICY IF EXISTS "Secret album owner deletes own files" ON "storage"."objects";
CREATE POLICY "Secret album owner deletes own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'private-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Secret album owner reads own files" ON "storage"."objects";
CREATE POLICY "Secret album owner reads own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'private-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Secret album owner updates own files" ON "storage"."objects";
CREATE POLICY "Secret album owner updates own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'private-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)))
  WITH CHECK (((bucket_id = 'private-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Secret album owner uploads own files" ON "storage"."objects";
CREATE POLICY "Secret album owner uploads own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'private-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Upload own post media" ON "storage"."objects";
CREATE POLICY "Upload own post media" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'posts'::text) AND ((storage.foldername(name))[1] = ((SELECT public.floustream_user_id()))::text)));

DROP POLICY IF EXISTS "Users delete own private music" ON "storage"."objects";
CREATE POLICY "Users delete own private music" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'music-private'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Users delete own public music" ON "storage"."objects";
CREATE POLICY "Users delete own public music" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'music-public'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Users upload own private music" ON "storage"."objects";
CREATE POLICY "Users upload own private music" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'music-private'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Users upload own public music" ON "storage"."objects";
CREATE POLICY "Users upload own public music" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'music-public'::text) AND ((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text)));

DROP POLICY IF EXISTS "Users_upload_own_avatars 1oj01fe_0" ON "storage"."objects";
CREATE POLICY "Users_upload_own_avatars 1oj01fe_0" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ((SELECT public.floustream_user_id()))::text)));

DROP POLICY IF EXISTS "Video album files are readable by permanent users" ON "storage"."objects";
CREATE POLICY "Video album files are readable by permanent users" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'video-albums'::text) AND (((storage.foldername(name))[1] = (( SELECT (SELECT public.floustream_user_id()) AS uid))::text) OR (private.is_profile_section_public(((storage.foldername(name))[1])::uuid, 'videos'::text) AND (COALESCE(( SELECT ((auth.jwt() ->> 'is_anonymous'::text))::boolean AS bool), false) = false)))));

-- Adapt the two catalog-confirmed SQL functions that previously called auth.uid().
-- The helper supports both legacy Supabase UUID subjects and Clerk's trusted app_user_id claim.
CREATE OR REPLACE FUNCTION public.guard_scheduled_post_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
declare
  previous_time timestamptz;
  next_time timestamptz;
begin
  if public.floustream_user_id() is not null and current_user <> 'postgres' then
    if tg_op = 'INSERT' then
      if new.user_id is distinct from public.floustream_user_id() then
        raise exception 'You can only schedule posts for your own account';
      end if;
      select s.scheduled_at into previous_time
      from public.scheduled_posts s
      where s.user_id = new.user_id and s.status in ('pending','failed')
      order by s.queue_order desc limit 1;
      if previous_time is not null and new.scheduled_at <= previous_time then
        raise exception 'Choose a time later than the previous post in your queue';
      end if;
      new.status := 'pending';
      new.published_post_id := null;
      new.published_at := null;
      new.attempts := 0;
      new.last_error := null;
      new.created_at := now();
      new.updated_at := now();
    else
      if old.status not in ('pending', 'failed') then
        raise exception 'Only pending or failed scheduled posts can be edited';
      end if;
      if new.user_id is distinct from old.user_id
        or new.queue_order is distinct from old.queue_order
        or new.status is distinct from old.status
        or new.published_post_id is distinct from old.published_post_id
        or new.published_at is distinct from old.published_at
        or new.attempts is distinct from old.attempts
        or new.last_error is distinct from old.last_error
        or new.created_at is distinct from old.created_at then
        raise exception 'Protected scheduling fields cannot be changed directly';
      end if;
      select s.scheduled_at into previous_time
      from public.scheduled_posts s
      where s.user_id = old.user_id and s.queue_order < old.queue_order
        and s.status in ('pending','failed') and s.id <> old.id
      order by s.queue_order desc limit 1;
      select s.scheduled_at into next_time
      from public.scheduled_posts s
      where s.user_id = old.user_id and s.queue_order > old.queue_order
        and s.status in ('pending','failed') and s.id <> old.id
      order by s.queue_order asc limit 1;
      if previous_time is not null and new.scheduled_at <= previous_time then
        raise exception 'Choose a time later than the previous post in your queue';
      end if;
      if next_time is not null and new.scheduled_at >= next_time then
        raise exception 'Choose a time earlier than the next post in your queue';
      end if;
      new.updated_at := now();
    end if;
  else
    if tg_op = 'UPDATE' then
      new.updated_at := now();
    end if;
  end if;
  if tg_op = 'INSERT' then
    if new.scheduled_at <= now() then
      raise exception 'Scheduled time must be in the future';
    end if;
  elsif tg_op = 'UPDATE' and new.scheduled_at is distinct from old.scheduled_at then
    if new.scheduled_at <= now() then
      raise exception 'Scheduled time must be in the future';
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.retry_scheduled_post(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
begin
  if public.floustream_user_id() is null then
    raise exception 'Authentication required';
  end if;
  update public.scheduled_posts
  set status = 'pending', last_error = null, updated_at = now()
  where id = p_post_id
    and user_id = public.floustream_user_id()
    and status = 'failed'
    and scheduled_at > now();
  if not found then
    raise exception 'Scheduled post was not found, is not failed, or needs a future time';
  end if;
  return true;
end;
$function$;


COMMIT;
