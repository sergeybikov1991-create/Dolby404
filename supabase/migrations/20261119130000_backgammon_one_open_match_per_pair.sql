-- Allow only one unfinished game between the same two FLOUSTREAM accounts.
-- Finished and cancelled matches remain in history; a new casual match can then start.
create unique index if not exists backgammon_one_open_match_per_pair
  on public.backgammon_matches (
    least(player_a, player_b),
    greatest(player_a, player_b)
  )
  where status in ('waiting', 'awaiting_opening_roll', 'active');
