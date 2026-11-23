-- FLOUSTREAM Main 0.8: allow grouped attachment-only messages.
-- Preserve sender ownership and required recipient checks from the existing policy.
drop policy if exists "Authenticated users can send direct messages" on public.direct_messages;

create policy "Authenticated users can send direct messages"
on public.direct_messages
for insert
to authenticated
with check (
  (select auth.uid()) = sender_id
  and recipient_id is not null
  and (
    length(trim(coalesce(content, ''))) > 0
    or nullif(trim(coalesce(attachment_path, '')), '') is not null
    or jsonb_array_length(coalesce(attachments, '[]'::jsonb)) > 0
  )
);
