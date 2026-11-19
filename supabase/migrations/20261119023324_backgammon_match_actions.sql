-- FLOUSTREAM long backgammon: isolated match storage and atomic action ledger.
-- This migration is committed to the feature branch only; it is not applied to the live project.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists public.backgammon_matches (
  id uuid primary key default gen_random_uuid(),
  player_a uuid not null references auth.users(id) on delete cascade,
  player_b uuid not null references auth.users(id) on delete cascade,
  match_mode text not null default 'casual'
    check (match_mode in ('casual', 'tournament')),
  status text not null default 'waiting'
    check (status in ('waiting', 'awaiting_opening_roll', 'active', 'finished', 'cancelled')),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  turn_number integer not null default 0 check (turn_number >= 0),
  revision bigint not null default 0 check (revision >= 0),
  restart_request jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint backgammon_distinct_players check (player_a <> player_b)
);

create index if not exists backgammon_matches_player_a_updated
  on public.backgammon_matches (player_a, updated_at desc);
create index if not exists backgammon_matches_player_b_updated
  on public.backgammon_matches (player_b, updated_at desc);
create index if not exists backgammon_matches_active_updated
  on public.backgammon_matches (updated_at desc)
  where status in ('waiting', 'awaiting_opening_roll', 'active');

alter table public.backgammon_matches enable row level security;
drop policy if exists backgammon_players_read_match on public.backgammon_matches;
create policy backgammon_players_read_match
  on public.backgammon_matches
  for select to authenticated
  using (auth.uid() = player_a or auth.uid() = player_b);

revoke all on public.backgammon_matches from anon, authenticated;
grant select on public.backgammon_matches to authenticated;
grant all on public.backgammon_matches to service_role;

create table if not exists private.backgammon_actions (
  match_id uuid not null references public.backgammon_matches(id) on delete cascade,
  action_id uuid not null,
  actor_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null
    check (action_type in (
      'accept_match', 'decline_match', 'opening_roll', 'roll', 'move',
      'finish_turn', 'restart_request', 'restart_vote', 'restart_cancel'
    )),
  turn_number integer not null check (turn_number >= 0),
  request_hash text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (match_id, action_id)
);

create unique index if not exists backgammon_one_roll_per_turn
  on private.backgammon_actions (match_id, turn_number)
  where action_type in ('opening_roll', 'roll');

alter table private.backgammon_actions enable row level security;
revoke all on private.backgammon_actions from public, anon, authenticated;
grant select, insert, update, delete on private.backgammon_actions to service_role;

create or replace function public.backgammon_get_action_result(
  p_match_id uuid,
  p_action_id uuid,
  p_actor_id uuid,
  p_request_hash text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid;
  v_hash text;
  v_response jsonb;
begin
  select a.actor_id, a.request_hash, a.response
    into v_actor, v_hash, v_response
  from private.backgammon_actions a
  where a.match_id = p_match_id and a.action_id = p_action_id;

  if not found then
    return null;
  end if;
  if v_actor <> p_actor_id then
    raise exception 'action_id belongs to another actor' using errcode = '42501';
  end if;
  if v_hash <> p_request_hash then
    raise exception 'action_id reused with different request' using errcode = '22023';
  end if;
  return v_response;
end;
$$;

create or replace function public.backgammon_commit_action(
  p_match_id uuid,
  p_action_id uuid,
  p_actor_id uuid,
  p_action_type text,
  p_turn_number integer,
  p_expected_revision bigint,
  p_request_hash text,
  p_next_state jsonb,
  p_next_status text,
  p_next_turn_number integer,
  p_next_restart_request jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_match public.backgammon_matches%rowtype;
  v_existing_actor uuid;
  v_existing_hash text;
  v_existing_response jsonb;
  v_response jsonb;
begin
  if p_action_type not in (
    'accept_match', 'decline_match', 'opening_roll', 'roll', 'move',
    'finish_turn', 'restart_request', 'restart_vote', 'restart_cancel'
  ) then
    raise exception 'unsupported action type' using errcode = '22023';
  end if;
  if jsonb_typeof(p_next_state) <> 'object' then
    raise exception 'next state must be a JSON object' using errcode = '22023';
  end if;
  if p_next_status not in (
    'waiting', 'awaiting_opening_roll', 'active', 'finished', 'cancelled'
  ) then
    raise exception 'invalid next match status' using errcode = '22023';
  end if;
  if p_next_turn_number < 0 then
    raise exception 'invalid turn number' using errcode = '22023';
  end if;

  select a.actor_id, a.request_hash, a.response
    into v_existing_actor, v_existing_hash, v_existing_response
  from private.backgammon_actions a
  where a.match_id = p_match_id and a.action_id = p_action_id;

  if found then
    if v_existing_actor <> p_actor_id then
      raise exception 'action_id belongs to another actor' using errcode = '42501';
    end if;
    if v_existing_hash <> p_request_hash then
      raise exception 'action_id reused with different request' using errcode = '22023';
    end if;
    return v_existing_response;
  end if;

  select m.* into v_match
  from public.backgammon_matches m
  where m.id = p_match_id
  for update;

  if not found then
    raise exception 'match not found' using errcode = 'P0002';
  end if;

  -- Recheck after acquiring the row lock: simultaneous retries with the same
  -- action UUID must receive the first committed response, not a PK violation.
  select a.actor_id, a.request_hash, a.response
    into v_existing_actor, v_existing_hash, v_existing_response
  from private.backgammon_actions a
  where a.match_id = p_match_id and a.action_id = p_action_id;

  if found then
    if v_existing_actor <> p_actor_id then
      raise exception 'action_id belongs to another actor' using errcode = '42501';
    end if;
    if v_existing_hash <> p_request_hash then
      raise exception 'action_id reused with different request' using errcode = '22023';
    end if;
    return v_existing_response;
  end if;

  if p_actor_id <> v_match.player_a and p_actor_id <> v_match.player_b then
    raise exception 'actor is not a match participant' using errcode = '42501';
  end if;
  if v_match.revision <> p_expected_revision then
    raise exception 'revision conflict' using errcode = '40001';
  end if;
  if v_match.turn_number <> p_turn_number then
    raise exception 'turn number conflict' using errcode = '40001';
  end if;

  v_response := jsonb_build_object(
    'match_id', p_match_id,
    'status', p_next_status,
    'state', p_next_state,
    'turn_number', p_next_turn_number,
    'revision', v_match.revision + 1,
    'restart_request', p_next_restart_request
  );

  insert into private.backgammon_actions (
    match_id, action_id, actor_id, action_type, turn_number,
    request_hash, response
  ) values (
    p_match_id, p_action_id, p_actor_id, p_action_type, p_turn_number,
    p_request_hash, v_response
  );

  update public.backgammon_matches
  set state = p_next_state,
      status = p_next_status,
      turn_number = p_next_turn_number,
      revision = revision + 1,
      restart_request = p_next_restart_request,
      updated_at = now()
  where id = p_match_id;

  return v_response;
end;
$$;

revoke all on function public.backgammon_get_action_result(uuid, uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.backgammon_commit_action(
  uuid, uuid, uuid, text, integer, bigint, text, jsonb, text, integer, jsonb
) from public, anon, authenticated;
grant execute on function public.backgammon_get_action_result(uuid, uuid, uuid, text)
  to service_role;
grant execute on function public.backgammon_commit_action(
  uuid, uuid, uuid, text, integer, bigint, text, jsonb, text, integer, jsonb
) to service_role;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'backgammon_matches'
     ) then
    alter publication supabase_realtime add table public.backgammon_matches;
  end if;
end;
$$;
