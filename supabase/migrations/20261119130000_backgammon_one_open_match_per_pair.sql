-- Allow only one unfinished game between the same two FLOUSTREAM accounts.
-- Finished and cancelled matches remain in history; a new casual match can then start.
create unique index if not exists backgammon_one_open_match_per_pair
  on public.backgammon_matches (
    least(player_a, player_b),
    greatest(player_a, player_b)
  )
  where status in ('waiting', 'awaiting_opening_roll', 'active');

-- Support actor-scoped audit lookups without scanning the private action ledger.
create index if not exists backgammon_actions_actor_id_idx
  on private.backgammon_actions (actor_id);

-- Evaluate auth.uid() once per statement rather than once per visible row.
drop policy if exists backgammon_players_read_match on public.backgammon_matches;
create policy backgammon_players_read_match
  on public.backgammon_matches
  for select to authenticated
  using (
    (select auth.uid()) = player_a
    or (select auth.uid()) = player_b
  );
