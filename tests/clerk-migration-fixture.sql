-- Synthetic schema-only fixture generated from PostgreSQL catalog metadata.
-- Contains no user rows, email addresses, password hashes, credentials or file data.
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END;
$roles$;

CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE SCHEMA storage;

CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
CREATE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE
AS $$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION private.is_account_active(uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$ SELECT true $$;
CREATE FUNCTION private.is_profile_section_public(uuid, text) RETURNS boolean
LANGUAGE sql STABLE AS $$ SELECT true $$;
CREATE FUNCTION storage.foldername(text) RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1, '/') $$;

CREATE TABLE "private"."backgammon_actions" (
  "match_id" uuid,
  "action_id" uuid,
  "actor_id" uuid,
  "action_type" text,
  "turn_number" integer,
  "request_hash" text,
  "response" jsonb,
  "created_at" timestamptz
);

CREATE TABLE "public"."account_deletion_requests" (
  "user_id" uuid,
  "status" text,
  "requested_at" timestamptz,
  "scheduled_for" timestamptz,
  "confirmation_token_hash" text,
  "confirmation_expires_at" timestamptz,
  "confirmed_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "public"."account_registration_reviews" (
  "user_id" uuid,
  "risk_level" text,
  "reason" text,
  "status" text,
  "created_at" timestamptz,
  "reviewed_at" timestamptz
);

CREATE TABLE "public"."backgammon_matches" (
  "id" uuid,
  "player_a" uuid,
  "player_b" uuid,
  "match_mode" text,
  "status" text,
  "state" jsonb,
  "turn_number" integer,
  "revision" bigint,
  "restart_request" jsonb,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "public"."comments" (
  "id" bigint,
  "user_id" uuid,
  "post_id" bigint,
  "content" text,
  "created_at" timestamptz
);

CREATE TABLE "public"."device_push_tokens" (
  "token" text,
  "user_id" uuid,
  "platform" text,
  "updated_at" timestamptz
);

CREATE TABLE "public"."direct_message_favorites" (
  "id" uuid,
  "message_id" uuid,
  "user_id" uuid,
  "created_at" timestamptz
);

CREATE TABLE "public"."direct_message_hidden" (
  "message_id" uuid,
  "user_id" uuid,
  "created_at" timestamptz
);

CREATE TABLE "public"."direct_message_pins" (
  "id" uuid,
  "message_id" uuid,
  "user_id" uuid,
  "created_at" timestamptz
);

CREATE TABLE "public"."direct_message_reactions" (
  "id" uuid,
  "message_id" uuid,
  "user_id" uuid,
  "emoji" text,
  "created_at" timestamptz
);

CREATE TABLE "public"."direct_messages" (
  "id" uuid,
  "sender_id" uuid,
  "recipient_id" uuid,
  "content" text,
  "attachment_path" text,
  "attachment_name" text,
  "attachment_mime" text,
  "created_at" timestamptz,
  "read_at" timestamptz,
  "reply_to_message_id" uuid,
  "edited_at" timestamptz,
  "attachments" jsonb
);

CREATE TABLE "public"."follows" (
  "id" bigint,
  "follower_id" uuid,
  "following_id" uuid,
  "created_at" timestamptz
);

CREATE TABLE "public"."friend_requests" (
  "id" uuid,
  "requester_id" uuid,
  "recipient_id" uuid,
  "user_low_id" uuid,
  "user_high_id" uuid,
  "status" text,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "public"."likes" (
  "id" bigint,
  "user_id" uuid,
  "post_id" bigint,
  "created_at" timestamptz
);

CREATE TABLE "public"."music_tracks" (
  "id" uuid,
  "owner_id" uuid,
  "title" text,
  "object_path" text,
  "visibility" text,
  "created_at" timestamptz
);

CREATE TABLE "public"."photo_album_photos" (
  "id" uuid,
  "owner_id" uuid,
  "object_path" text,
  "file_name" text,
  "mime_type" text,
  "created_at" timestamptz
);

CREATE TABLE "public"."post_reactions" (
  "id" bigint,
  "post_id" bigint,
  "user_id" uuid,
  "reaction_key" text,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "public"."posts" (
  "id" bigint,
  "user_id" uuid,
  "content" text,
  "image_url" text,
  "created_at" timestamptz,
  "media" jsonb
);

CREATE TABLE "public"."private_album_photos" (
  "id" uuid,
  "owner_id" uuid,
  "object_path" text,
  "file_name" text,
  "mime_type" text,
  "created_at" timestamptz
);

CREATE TABLE "public"."private_photo_albums" (
  "id" uuid,
  "owner_id" uuid,
  "created_at" timestamptz
);

CREATE TABLE "public"."private_video_album_videos" (
  "id" uuid,
  "owner_id" uuid,
  "object_path" text,
  "file_name" text,
  "mime_type" text,
  "created_at" timestamptz
);

CREATE TABLE "public"."profile_photo_likes" (
  "id" uuid,
  "profile_id" uuid,
  "user_id" uuid,
  "created_at" timestamptz
);

CREATE TABLE "public"."profile_privacy_settings" (
  "owner_id" uuid,
  "public_album_visible" boolean,
  "music_visible" boolean,
  "comments_visible" boolean,
  "feed_posts_visible" boolean,
  "updated_at" timestamptz,
  "video_album_visible" boolean
);

CREATE TABLE "public"."profile_visits" (
  "visitor_id" uuid,
  "visited_profile_id" uuid,
  "last_visited_at" timestamptz
);

CREATE TABLE "public"."profiles" (
  "id" uuid,
  "username" text,
  "display_name" text,
  "bio" text,
  "avatar_url" text,
  "created_at" timestamptz,
  "cover_url" text,
  "avatar_photo_id" uuid,
  "last_activity_at" timestamptz,
  "time_zone" text,
  "first_name" text,
  "last_name" text,
  "country_code" text,
  "preferred_language" text,
  "account_status" text,
  "deletion_requested_at" timestamptz,
  "deletion_scheduled_at" timestamptz
);

CREATE TABLE "public"."reposts" (
  "id" bigint,
  "user_id" uuid,
  "post_id" bigint,
  "created_at" timestamptz
);

CREATE TABLE "public"."scheduled_posts" (
  "id" uuid,
  "user_id" uuid,
  "queue_order" bigint,
  "content" text,
  "image_url" text,
  "media" jsonb,
  "scheduled_at" timestamptz,
  "status" text,
  "published_post_id" bigint,
  "published_at" timestamptz,
  "attempts" integer,
  "last_error" text,
  "created_at" timestamptz,
  "updated_at" timestamptz
);

CREATE TABLE "public"."video_album_videos" (
  "id" uuid,
  "owner_id" uuid,
  "object_path" text,
  "file_name" text,
  "mime_type" text,
  "created_at" timestamptz
);

CREATE TABLE "storage"."objects" (
  "id" uuid,
  "bucket_id" text,
  "name" text,
  "owner" uuid,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  "last_accessed_at" timestamptz,
  "metadata" jsonb,
  "path_tokens" text[],
  "version" text,
  "owner_id" text,
  "user_metadata" jsonb,
  "archived_at" timestamptz,
  "is_delete_marker" boolean,
  "is_versioned" boolean
);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_fixture_pk PRIMARY KEY (id);
ALTER TABLE public.private_photo_albums ADD CONSTRAINT private_photo_albums_fixture_pk PRIMARY KEY (owner_id);
ALTER TABLE public.account_registration_reviews ADD CONSTRAINT account_registration_reviews_fixture_pk PRIMARY KEY (user_id);

ALTER TABLE "private"."backgammon_actions" ADD CONSTRAINT "backgammon_actions_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."account_registration_reviews" ADD CONSTRAINT "account_registration_reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."backgammon_matches" ADD CONSTRAINT "backgammon_matches_player_a_fkey" FOREIGN KEY (player_a) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."backgammon_matches" ADD CONSTRAINT "backgammon_matches_player_b_fkey" FOREIGN KEY (player_b) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."device_push_tokens" ADD CONSTRAINT "device_push_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."direct_message_favorites" ADD CONSTRAINT "direct_message_favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."direct_message_hidden" ADD CONSTRAINT "direct_message_hidden_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."direct_message_pins" ADD CONSTRAINT "direct_message_pins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."direct_message_reactions" ADD CONSTRAINT "direct_message_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."direct_messages" ADD CONSTRAINT "direct_messages_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."music_tracks" ADD CONSTRAINT "music_tracks_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."photo_album_photos" ADD CONSTRAINT "photo_album_photos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."post_reactions" ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."private_album_photos" ADD CONSTRAINT "private_album_photos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."private_photo_albums" ADD CONSTRAINT "private_photo_albums_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."private_video_album_videos" ADD CONSTRAINT "private_video_album_videos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."profile_privacy_settings" ADD CONSTRAINT "profile_privacy_settings_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."profile_visits" ADD CONSTRAINT "profile_visits_visitor_id_fkey" FOREIGN KEY (visitor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "public"."video_album_videos" ADD CONSTRAINT "video_album_videos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Existing policies are installed by the migration draft; enable RLS on all
-- policy-bearing fixture tables to exercise the actual PostgreSQL policy engine.
ALTER TABLE "public"."account_deletion_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."account_registration_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."backgammon_matches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."device_push_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."direct_message_favorites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."direct_message_hidden" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."direct_message_pins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."direct_message_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."direct_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."friend_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."music_tracks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."photo_album_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."post_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."private_album_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."private_photo_albums" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."private_video_album_videos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profile_photo_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profile_privacy_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profile_visits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reposts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."scheduled_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."video_album_videos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public, auth, private, storage TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, private, storage TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth, private, storage TO anon, authenticated, service_role;

INSERT INTO auth.users(id,email) VALUES
 ('11111111-1111-4111-8111-111111111111','legacy-one@example.test'),
 ('22222222-2222-4222-8222-222222222222','legacy-two@example.test');
