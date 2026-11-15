create table if not exists public.direct_message_hidden (
    message_id uuid not null references public.direct_messages(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (message_id, user_id)
);

alter table public.direct_message_hidden enable row level security;
grant select, insert, delete on table public.direct_message_hidden to authenticated;

do $$
begin
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='direct_message_hidden' and policyname='Users can view their hidden messages') then
        execute 'create policy "Users can view their hidden messages" on public.direct_message_hidden for select to authenticated using ((select auth.uid()) = user_id)';
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='direct_message_hidden' and policyname='Users can hide messages for themselves') then
        execute 'create policy "Users can hide messages for themselves" on public.direct_message_hidden for insert to authenticated with check ((select auth.uid()) = user_id)';
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='direct_message_hidden' and policyname='Users can unhide their messages') then
        execute 'create policy "Users can unhide their messages" on public.direct_message_hidden for delete to authenticated using ((select auth.uid()) = user_id)';
    end if;
end
$$;
