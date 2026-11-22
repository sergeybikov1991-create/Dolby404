-- Make the ordinary photo album private for every account.
-- Preserve the current profile-avatar exception so public profile pictures still work.
begin;

alter table public.profile_privacy_settings
  alter column public_album_visible set default false;

update public.profile_privacy_settings
set public_album_visible = false
where public_album_visible is distinct from false;

create or replace function private.is_profile_section_public(p_owner_id uuid, p_section text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select case p_section
    when 'album' then false
    when 'videos' then coalesce((select s.video_album_visible from public.profile_privacy_settings s where s.owner_id = p_owner_id), true)
    when 'music' then coalesce((select s.music_visible from public.profile_privacy_settings s where s.owner_id = p_owner_id), true)
    when 'comments' then coalesce((select s.comments_visible from public.profile_privacy_settings s where s.owner_id = p_owner_id), true)
    when 'feed' then coalesce((select s.feed_posts_visible from public.profile_privacy_settings s where s.owner_id = p_owner_id), true)
    else false
  end;
$function$;

drop policy if exists "Public album photos are viewable by permanent users"
  on public.photo_album_photos;

drop policy if exists "Public album photos are readable by permanent users"
  on storage.objects;

drop policy if exists "Owners read own photo album files"
  on storage.objects;

create policy "Owners read own photo album files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'photo-albums'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Do not remove or move any photo rows or storage objects.
-- The existing profile-avatar policies intentionally remain in place.

commit;
