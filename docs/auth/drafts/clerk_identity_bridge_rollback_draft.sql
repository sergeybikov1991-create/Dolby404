-- DRAFT ONLY. Rollback rehearsal required; never apply blindly.
-- This rollback refuses to proceed unless every provider-independent identity
-- has a matching auth.users row. Clerk-only accounts must first receive a
-- matching Supabase Auth shadow identity through the approved recovery process.
BEGIN;

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.app_users au
    LEFT JOIN auth.users u ON u.id = au.id
    WHERE u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Rollback blocked: one or more FLOUSTREAM identities have no matching Supabase Auth shadow user';
  END IF;
END;
$guard$;

-- Restore the exact original RLS policies captured during the read-only audit.
DROP POLICY IF EXISTS "backgammon_players_read_match" ON "public"."backgammon_matches";
CREATE POLICY "backgammon_players_read_match" ON "public"."backgammon_matches"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) = player_a) OR (( SELECT auth.uid() AS uid) = player_b)));

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON "public"."comments";
CREATE POLICY "Comments are viewable by everyone" ON "public"."comments"
  AS PERMISSIVE
  FOR SELECT
  TO "anon", "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = comments.post_id) AND ((p.user_id = ( SELECT auth.uid() AS uid)) OR private.is_profile_section_public(p.user_id, 'comments'::text))))));

DROP POLICY IF EXISTS "Users can add own comments" ON "public"."comments";
CREATE POLICY "Users can add own comments" ON "public"."comments"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "Users can delete own comments" ON "public"."comments";
CREATE POLICY "Users can delete own comments" ON "public"."comments"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."comments";
CREATE POLICY "account_active_guard" ON "public"."comments"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users can delete their own push tokens" ON "public"."device_push_tokens";
CREATE POLICY "Users can delete their own push tokens" ON "public"."device_push_tokens"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can read their own push tokens" ON "public"."device_push_tokens";
CREATE POLICY "Users can read their own push tokens" ON "public"."device_push_tokens"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can register their own push tokens" ON "public"."device_push_tokens";
CREATE POLICY "Users can register their own push tokens" ON "public"."device_push_tokens"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own push tokens" ON "public"."device_push_tokens";
CREATE POLICY "Users can update their own push tokens" ON "public"."device_push_tokens"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can favorite messages in their conversations" ON "public"."direct_message_favorites";
CREATE POLICY "Users can favorite messages in their conversations" ON "public"."direct_message_favorites"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_favorites.message_id) AND ((dm.sender_id = ( SELECT auth.uid() AS uid)) OR (dm.recipient_id = ( SELECT auth.uid() AS uid))))))));

DROP POLICY IF EXISTS "Users can remove their own direct message favorites" ON "public"."direct_message_favorites";
CREATE POLICY "Users can remove their own direct message favorites" ON "public"."direct_message_favorites"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active)));

DROP POLICY IF EXISTS "Users can view their own direct message favorites" ON "public"."direct_message_favorites";
CREATE POLICY "Users can view their own direct message favorites" ON "public"."direct_message_favorites"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_favorites.message_id) AND ((dm.sender_id = ( SELECT auth.uid() AS uid)) OR (dm.recipient_id = ( SELECT auth.uid() AS uid))))))));

DROP POLICY IF EXISTS "Users can hide messages for themselves" ON "public"."direct_message_hidden";
CREATE POLICY "Users can hide messages for themselves" ON "public"."direct_message_hidden"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "Users can unhide their messages" ON "public"."direct_message_hidden";
CREATE POLICY "Users can unhide their messages" ON "public"."direct_message_hidden"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "Users can view their hidden messages" ON "public"."direct_message_hidden";
CREATE POLICY "Users can view their hidden messages" ON "public"."direct_message_hidden"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "Chat participants can pin messages for themselves" ON "public"."direct_message_pins";
CREATE POLICY "Chat participants can pin messages for themselves" ON "public"."direct_message_pins"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_pins.message_id) AND ((( SELECT auth.uid() AS uid) = dm.sender_id) OR (( SELECT auth.uid() AS uid) = dm.recipient_id)))))));

DROP POLICY IF EXISTS "Chat participants can view their pinned messages" ON "public"."direct_message_pins";
CREATE POLICY "Chat participants can view their pinned messages" ON "public"."direct_message_pins"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_pins.message_id) AND ((( SELECT auth.uid() AS uid) = dm.sender_id) OR (( SELECT auth.uid() AS uid) = dm.recipient_id)))))));

DROP POLICY IF EXISTS "Users can unpin their own messages" ON "public"."direct_message_pins";
CREATE POLICY "Users can unpin their own messages" ON "public"."direct_message_pins"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active)));

DROP POLICY IF EXISTS "Chat participants can add their own reactions" ON "public"."direct_message_reactions";
CREATE POLICY "Chat participants can add their own reactions" ON "public"."direct_message_reactions"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_reactions.message_id) AND ((( SELECT auth.uid() AS uid) = dm.sender_id) OR (( SELECT auth.uid() AS uid) = dm.recipient_id)))))));

DROP POLICY IF EXISTS "Chat participants can view message reactions" ON "public"."direct_message_reactions";
CREATE POLICY "Chat participants can view message reactions" ON "public"."direct_message_reactions"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_reactions.message_id) AND ((( SELECT auth.uid() AS uid) = dm.sender_id) OR (( SELECT auth.uid() AS uid) = dm.recipient_id)))))));

DROP POLICY IF EXISTS "Users can remove their own message reactions" ON "public"."direct_message_reactions";
CREATE POLICY "Users can remove their own message reactions" ON "public"."direct_message_reactions"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active)));

DROP POLICY IF EXISTS "Users can update their own message reactions" ON "public"."direct_message_reactions";
CREATE POLICY "Users can update their own message reactions" ON "public"."direct_message_reactions"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active) AND (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.id = direct_message_reactions.message_id) AND ((( SELECT auth.uid() AS uid) = dm.sender_id) OR (( SELECT auth.uid() AS uid) = dm.recipient_id)))))));

DROP POLICY IF EXISTS "Authenticated users can send direct messages" ON "public"."direct_messages";
CREATE POLICY "Authenticated users can send direct messages" ON "public"."direct_messages"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((( SELECT auth.uid() AS uid) = sender_id) AND (recipient_id IS NOT NULL) AND ((length(TRIM(BOTH FROM COALESCE(content, ''::text))) > 0) OR (NULLIF(TRIM(BOTH FROM COALESCE(attachment_path, ''::text)), ''::text) IS NOT NULL) OR (jsonb_array_length(COALESCE(attachments, '[]'::jsonb)) > 0))));

DROP POLICY IF EXISTS "Recipients can mark incoming messages as read" ON "public"."direct_messages";
CREATE POLICY "Recipients can mark incoming messages as read" ON "public"."direct_messages"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) = recipient_id) AND (sender_id <> ( SELECT auth.uid() AS uid)) AND (read_at IS NULL)))
  WITH CHECK (((( SELECT auth.uid() AS uid) = recipient_id) AND (sender_id <> ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS "Senders can delete their own direct messages" ON "public"."direct_messages";
CREATE POLICY "Senders can delete their own direct messages" ON "public"."direct_messages"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = sender_id));

DROP POLICY IF EXISTS "Senders can edit their own direct messages" ON "public"."direct_messages";
CREATE POLICY "Senders can edit their own direct messages" ON "public"."direct_messages"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = sender_id))
  WITH CHECK (((( SELECT auth.uid() AS uid) = sender_id) AND ( SELECT private.is_account_active(( SELECT auth.uid() AS uid)) AS is_account_active)));

DROP POLICY IF EXISTS "Users read their direct messages" ON "public"."direct_messages";
CREATE POLICY "Users read their direct messages" ON "public"."direct_messages"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) = sender_id) OR (( SELECT auth.uid() AS uid) = recipient_id)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."direct_messages";
CREATE POLICY "account_active_guard" ON "public"."direct_messages"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users can follow" ON "public"."follows";
CREATE POLICY "Users can follow" ON "public"."follows"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((( SELECT auth.uid() AS uid) = follower_id));

DROP POLICY IF EXISTS "Users can unfollow" ON "public"."follows";
CREATE POLICY "Users can unfollow" ON "public"."follows"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((( SELECT auth.uid() AS uid) = follower_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."follows";
CREATE POLICY "account_active_guard" ON "public"."follows"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Participants can remove pending requests or friendships" ON "public"."friend_requests";
CREATE POLICY "Participants can remove pending requests or friendships" ON "public"."friend_requests"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((((( SELECT auth.uid() AS uid) = requester_id) AND (status = ANY (ARRAY['pending'::text, 'accepted'::text]))) OR ((( SELECT auth.uid() AS uid) = recipient_id) AND (status = ANY (ARRAY['pending'::text, 'accepted'::text])))));

DROP POLICY IF EXISTS "Recipients can accept friend requests" ON "public"."friend_requests";
CREATE POLICY "Recipients can accept friend requests" ON "public"."friend_requests"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) = recipient_id) AND (status = 'pending'::text)))
  WITH CHECK (((( SELECT auth.uid() AS uid) = recipient_id) AND (status = 'accepted'::text)));

DROP POLICY IF EXISTS "Users can send friend requests" ON "public"."friend_requests";
CREATE POLICY "Users can send friend requests" ON "public"."friend_requests"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((( SELECT auth.uid() AS uid) = requester_id) AND (requester_id <> recipient_id) AND (status = 'pending'::text) AND (user_low_id = LEAST(requester_id, recipient_id)) AND (user_high_id = GREATEST(requester_id, recipient_id))));

DROP POLICY IF EXISTS "Users can view their friend requests" ON "public"."friend_requests";
CREATE POLICY "Users can view their friend requests" ON "public"."friend_requests"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) = requester_id) OR (( SELECT auth.uid() AS uid) = recipient_id)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."friend_requests";
CREATE POLICY "account_active_guard" ON "public"."friend_requests"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users can add own likes" ON "public"."likes";
CREATE POLICY "Users can add own likes" ON "public"."likes"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "Users can remove own likes" ON "public"."likes";
CREATE POLICY "Users can remove own likes" ON "public"."likes"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."likes";
CREATE POLICY "account_active_guard" ON "public"."likes"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Owners manage their own music tracks" ON "public"."music_tracks";
CREATE POLICY "Owners manage their own music tracks" ON "public"."music_tracks"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."music_tracks";
CREATE POLICY "account_active_guard" ON "public"."music_tracks"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Owners manage their public album photos" ON "public"."photo_album_photos";
CREATE POLICY "Owners manage their public album photos" ON "public"."photo_album_photos"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."photo_album_photos";
CREATE POLICY "account_active_guard" ON "public"."photo_album_photos"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users can add own post reactions" ON "public"."post_reactions";
CREATE POLICY "Users can add own post reactions" ON "public"."post_reactions"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "Users can remove own post reactions" ON "public"."post_reactions";
CREATE POLICY "Users can remove own post reactions" ON "public"."post_reactions"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "Users can update own post reactions" ON "public"."post_reactions";
CREATE POLICY "Users can update own post reactions" ON "public"."post_reactions"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."post_reactions";
CREATE POLICY "account_active_guard" ON "public"."post_reactions"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Create own posts" ON "public"."posts";
CREATE POLICY "Create own posts" ON "public"."posts"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON "public"."posts";
CREATE POLICY "Posts are viewable by everyone" ON "public"."posts"
  AS PERMISSIVE
  FOR SELECT
  TO "anon", "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR private.is_profile_section_public(user_id, 'feed'::text)));

DROP POLICY IF EXISTS "Users can delete own posts" ON "public"."posts";
CREATE POLICY "Users can delete own posts" ON "public"."posts"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "Users can update own posts" ON "public"."posts";
CREATE POLICY "Users can update own posts" ON "public"."posts"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."posts";
CREATE POLICY "account_active_guard" ON "public"."posts"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Owners manage their secret album photos" ON "public"."private_album_photos";
CREATE POLICY "Owners manage their secret album photos" ON "public"."private_album_photos"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."private_album_photos";
CREATE POLICY "account_active_guard" ON "public"."private_album_photos"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Owners access their secret album container" ON "public"."private_photo_albums";
CREATE POLICY "Owners access their secret album container" ON "public"."private_photo_albums"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."private_photo_albums";
CREATE POLICY "account_active_guard" ON "public"."private_photo_albums"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Owners manage their private video album videos" ON "public"."private_video_album_videos";
CREATE POLICY "Owners manage their private video album videos" ON "public"."private_video_album_videos"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."private_video_album_videos";
CREATE POLICY "account_active_guard" ON "public"."private_video_album_videos"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users can like photos" ON "public"."profile_photo_likes";
CREATE POLICY "Users can like photos" ON "public"."profile_photo_likes"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "Users can remove own likes" ON "public"."profile_photo_likes";
CREATE POLICY "Users can remove own likes" ON "public"."profile_photo_likes"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."profile_photo_likes";
CREATE POLICY "account_active_guard" ON "public"."profile_photo_likes"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users manage their own privacy settings" ON "public"."profile_privacy_settings";
CREATE POLICY "Users manage their own privacy settings" ON "public"."profile_privacy_settings"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."profile_privacy_settings";
CREATE POLICY "account_active_guard" ON "public"."profile_privacy_settings"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users can add to own visit history" ON "public"."profile_visits";
CREATE POLICY "Users can add to own visit history" ON "public"."profile_visits"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = visitor_id));

DROP POLICY IF EXISTS "Users can delete own visit history" ON "public"."profile_visits";
CREATE POLICY "Users can delete own visit history" ON "public"."profile_visits"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = visitor_id));

DROP POLICY IF EXISTS "Users can read own visit history" ON "public"."profile_visits";
CREATE POLICY "Users can read own visit history" ON "public"."profile_visits"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = visitor_id));

DROP POLICY IF EXISTS "Users can update own visit history" ON "public"."profile_visits";
CREATE POLICY "Users can update own visit history" ON "public"."profile_visits"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = visitor_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = visitor_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."profile_visits";
CREATE POLICY "account_active_guard" ON "public"."profile_visits"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";
CREATE POLICY "Users can update own profile" ON "public"."profiles"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((( SELECT auth.uid() AS uid) = id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."profiles";
CREATE POLICY "account_active_guard" ON "public"."profiles"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users can create own reposts" ON "public"."reposts";
CREATE POLICY "Users can create own reposts" ON "public"."reposts"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "Users can remove own reposts" ON "public"."reposts";
CREATE POLICY "Users can remove own reposts" ON "public"."reposts"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."reposts";
CREATE POLICY "account_active_guard" ON "public"."reposts"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Users can create own scheduled posts" ON "public"."scheduled_posts";
CREATE POLICY "Users can create own scheduled posts" ON "public"."scheduled_posts"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (status = 'pending'::text)));

DROP POLICY IF EXISTS "Users can delete own pending or failed scheduled posts" ON "public"."scheduled_posts";
CREATE POLICY "Users can delete own pending or failed scheduled posts" ON "public"."scheduled_posts"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND (status = ANY (ARRAY['pending'::text, 'failed'::text]))));

DROP POLICY IF EXISTS "Users can edit own pending or failed scheduled posts" ON "public"."scheduled_posts";
CREATE POLICY "Users can edit own pending or failed scheduled posts" ON "public"."scheduled_posts"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND (status = ANY (ARRAY['pending'::text, 'failed'::text]))))
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (status = ANY (ARRAY['pending'::text, 'failed'::text]))));

DROP POLICY IF EXISTS "Users can view own scheduled posts" ON "public"."scheduled_posts";
CREATE POLICY "Users can view own scheduled posts" ON "public"."scheduled_posts"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."scheduled_posts";
CREATE POLICY "account_active_guard" ON "public"."scheduled_posts"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Owners manage their video album videos" ON "public"."video_album_videos";
CREATE POLICY "Owners manage their video album videos" ON "public"."video_album_videos"
  AS PERMISSIVE
  FOR ALL
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "account_active_guard" ON "public"."video_album_videos";
CREATE POLICY "account_active_guard" ON "public"."video_album_videos"
  AS RESTRICTIVE
  FOR ALL
  TO "authenticated"
  USING (private.is_account_active(( SELECT auth.uid() AS uid)))
  WITH CHECK (private.is_account_active(( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Message participants read shared media" ON "storage"."objects";
CREATE POLICY "Message participants read shared media" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'message-media'::text) AND (((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM direct_messages dm
  WHERE ((dm.attachment_path = objects.name) AND ((( SELECT auth.uid() AS uid) = dm.sender_id) OR (( SELECT auth.uid() AS uid) = dm.recipient_id))))))));

DROP POLICY IF EXISTS "Message sender deletes own media" ON "storage"."objects";
CREATE POLICY "Message sender deletes own media" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'message-media'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Message sender uploads own media" ON "storage"."objects";
CREATE POLICY "Message sender uploads own media" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'message-media'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Owners delete own video album files" ON "storage"."objects";
CREATE POLICY "Owners delete own video album files" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'video-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Owners delete public album photos" ON "storage"."objects";
CREATE POLICY "Owners delete public album photos" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'photo-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Owners read own photo album files" ON "storage"."objects";
CREATE POLICY "Owners read own photo album files" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'photo-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Owners read own private music" ON "storage"."objects";
CREATE POLICY "Owners read own private music" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'music-private'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Owners upload own video album files" ON "storage"."objects";
CREATE POLICY "Owners upload own video album files" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'video-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Owners upload public album photos" ON "storage"."objects";
CREATE POLICY "Owners upload public album photos" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'photo-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Private video owner deletes own files" ON "storage"."objects";
CREATE POLICY "Private video owner deletes own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'private-video-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Private video owner reads own files" ON "storage"."objects";
CREATE POLICY "Private video owner reads own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'private-video-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Private video owner uploads own files" ON "storage"."objects";
CREATE POLICY "Private video owner uploads own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'private-video-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Public music files are readable" ON "storage"."objects";
CREATE POLICY "Public music files are readable" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "anon", "authenticated"
  USING (((bucket_id = 'music-public'::text) AND (((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) OR private.is_profile_section_public(((storage.foldername(name))[1])::uuid, 'music'::text))));

DROP POLICY IF EXISTS "Secret album owner deletes own files" ON "storage"."objects";
CREATE POLICY "Secret album owner deletes own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'private-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Secret album owner reads own files" ON "storage"."objects";
CREATE POLICY "Secret album owner reads own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'private-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Secret album owner updates own files" ON "storage"."objects";
CREATE POLICY "Secret album owner updates own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'private-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)))
  WITH CHECK (((bucket_id = 'private-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Secret album owner uploads own files" ON "storage"."objects";
CREATE POLICY "Secret album owner uploads own files" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'private-albums'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Upload own post media" ON "storage"."objects";
CREATE POLICY "Upload own post media" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'posts'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

DROP POLICY IF EXISTS "Users delete own private music" ON "storage"."objects";
CREATE POLICY "Users delete own private music" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'music-private'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Users delete own public music" ON "storage"."objects";
CREATE POLICY "Users delete own public music" ON "storage"."objects"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'music-public'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Users upload own private music" ON "storage"."objects";
CREATE POLICY "Users upload own private music" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'music-private'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Users upload own public music" ON "storage"."objects";
CREATE POLICY "Users upload own public music" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'music-public'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

DROP POLICY IF EXISTS "Users_upload_own_avatars 1oj01fe_0" ON "storage"."objects";
CREATE POLICY "Users_upload_own_avatars 1oj01fe_0" ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

DROP POLICY IF EXISTS "Video album files are readable by permanent users" ON "storage"."objects";
CREATE POLICY "Video album files are readable by permanent users" ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'video-albums'::text) AND (((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) OR (private.is_profile_section_public(((storage.foldername(name))[1])::uuid, 'videos'::text) AND (COALESCE(( SELECT ((auth.jwt() ->> 'is_anonymous'::text))::boolean AS bool), false) = false)))));

-- Restore the original scheduled-post functions that used Supabase UUID subjects.
CREATE OR REPLACE FUNCTION public.guard_scheduled_post_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
declare
  previous_time timestamptz;
  next_time timestamptz;
begin
  if auth.uid() is not null and current_user <> 'postgres' then
    if tg_op = 'INSERT' then
      if new.user_id is distinct from auth.uid() then
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

  -- Validate future time only when a user creates or changes the schedule.
  -- The internal publisher must be able to mark an overdue item as published/failed.
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
$function$
;

CREATE OR REPLACE FUNCTION public.retry_scheduled_post(p_post_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.scheduled_posts
  set status = 'pending',
      last_error = null,
      updated_at = now()
  where id = p_post_id
    and user_id = auth.uid()
    and status = 'failed'
    and scheduled_at > now();

  if not found then
    raise exception 'Scheduled post was not found, is not failed, or needs a future time';
  end if;

  return true;
end;
$function$
;

-- Return all application foreign keys to auth.users, preserving their original actions.
ALTER TABLE "private"."backgammon_actions" DROP CONSTRAINT "backgammon_actions_actor_id_fkey";
ALTER TABLE "private"."backgammon_actions" ADD CONSTRAINT "backgammon_actions_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."account_deletion_requests" DROP CONSTRAINT "account_deletion_requests_user_id_fkey";
ALTER TABLE "public"."account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."account_registration_reviews" DROP CONSTRAINT "account_registration_reviews_user_id_fkey";
ALTER TABLE "public"."account_registration_reviews" ADD CONSTRAINT "account_registration_reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."backgammon_matches" DROP CONSTRAINT "backgammon_matches_player_a_fkey";
ALTER TABLE "public"."backgammon_matches" ADD CONSTRAINT "backgammon_matches_player_a_fkey" FOREIGN KEY (player_a) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."backgammon_matches" DROP CONSTRAINT "backgammon_matches_player_b_fkey";
ALTER TABLE "public"."backgammon_matches" ADD CONSTRAINT "backgammon_matches_player_b_fkey" FOREIGN KEY (player_b) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."device_push_tokens" DROP CONSTRAINT "device_push_tokens_user_id_fkey";
ALTER TABLE "public"."device_push_tokens" ADD CONSTRAINT "device_push_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_message_favorites" DROP CONSTRAINT "direct_message_favorites_user_id_fkey";
ALTER TABLE "public"."direct_message_favorites" ADD CONSTRAINT "direct_message_favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_message_hidden" DROP CONSTRAINT "direct_message_hidden_user_id_fkey";
ALTER TABLE "public"."direct_message_hidden" ADD CONSTRAINT "direct_message_hidden_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_message_pins" DROP CONSTRAINT "direct_message_pins_user_id_fkey";
ALTER TABLE "public"."direct_message_pins" ADD CONSTRAINT "direct_message_pins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_message_reactions" DROP CONSTRAINT "direct_message_reactions_user_id_fkey";
ALTER TABLE "public"."direct_message_reactions" ADD CONSTRAINT "direct_message_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_messages" DROP CONSTRAINT "direct_messages_recipient_id_fkey";
ALTER TABLE "public"."direct_messages" ADD CONSTRAINT "direct_messages_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_messages" DROP CONSTRAINT "direct_messages_sender_id_fkey";
ALTER TABLE "public"."direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."music_tracks" DROP CONSTRAINT "music_tracks_owner_id_fkey";
ALTER TABLE "public"."music_tracks" ADD CONSTRAINT "music_tracks_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."photo_album_photos" DROP CONSTRAINT "photo_album_photos_owner_id_fkey";
ALTER TABLE "public"."photo_album_photos" ADD CONSTRAINT "photo_album_photos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."post_reactions" DROP CONSTRAINT "post_reactions_user_id_fkey";
ALTER TABLE "public"."post_reactions" ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."private_album_photos" DROP CONSTRAINT "private_album_photos_owner_id_fkey";
ALTER TABLE "public"."private_album_photos" ADD CONSTRAINT "private_album_photos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."private_photo_albums" DROP CONSTRAINT "private_photo_albums_owner_id_fkey";
ALTER TABLE "public"."private_photo_albums" ADD CONSTRAINT "private_photo_albums_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."private_video_album_videos" DROP CONSTRAINT "private_video_album_videos_owner_id_fkey";
ALTER TABLE "public"."private_video_album_videos" ADD CONSTRAINT "private_video_album_videos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profile_privacy_settings" DROP CONSTRAINT "profile_privacy_settings_owner_id_fkey";
ALTER TABLE "public"."profile_privacy_settings" ADD CONSTRAINT "profile_privacy_settings_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profile_visits" DROP CONSTRAINT "profile_visits_visitor_id_fkey";
ALTER TABLE "public"."profile_visits" ADD CONSTRAINT "profile_visits_visitor_id_fkey" FOREIGN KEY (visitor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles" DROP CONSTRAINT "profiles_id_fkey";
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."video_album_videos" DROP CONSTRAINT "video_album_videos_owner_id_fkey";
ALTER TABLE "public"."video_album_videos" ADD CONSTRAINT "video_album_videos_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

DROP TRIGGER IF EXISTS floustream_register_legacy_auth_identity ON auth.users;
DROP FUNCTION IF EXISTS public.register_legacy_auth_identity();
DROP FUNCTION IF EXISTS public.provision_clerk_user(uuid, text, text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.floustream_user_id();
DROP TABLE public.app_users;

COMMIT;
