-- FLOUSTREAM Main 0.8: grouped chat attachments.
-- Keep the legacy single-attachment columns for existing messages and old clients.
alter table public.direct_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb;

alter table public.direct_messages
  drop constraint if exists direct_messages_attachments_is_array;
alter table public.direct_messages
  add constraint direct_messages_attachments_is_array
  check (jsonb_typeof(attachments) = 'array');

alter table public.direct_messages
  drop constraint if exists direct_messages_attachments_max_count;
alter table public.direct_messages
  add constraint direct_messages_attachments_max_count
  check (jsonb_array_length(attachments) <= 10);
