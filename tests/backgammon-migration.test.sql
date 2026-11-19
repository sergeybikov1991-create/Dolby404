\set ON_ERROR_STOP on
BEGIN;

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-000000000004');

INSERT INTO public.backgammon_matches (
  id, player_a, player_b, match_mode, status, state, turn_number, revision
) VALUES
  ('10000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000002',
   'casual', 'waiting', '{"schemaVersion":1,"turn":{"phase":"awaiting_roll"}}', 0, 0),
  ('10000000-0000-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000003',
   '00000000-0000-4000-8000-000000000004',
   'casual', 'waiting', '{"schemaVersion":1,"turn":{"phase":"awaiting_roll"}}', 0, 0);

DO $duplicate_open_match$
BEGIN
  BEGIN
    INSERT INTO public.backgammon_matches (
      id, player_a, player_b, match_mode, status, state, turn_number, revision
    ) VALUES (
      '10000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000001',
      'casual', 'active', '{"schemaVersion":1,"turn":{"phase":"awaiting_roll"}}', 0, 0
    );
    RAISE EXCEPTION 'duplicate open match for the same pair unexpectedly inserted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END;
$duplicate_open_match$;

DO $duplicate_open_match$
BEGIN
  BEGIN
    INSERT INTO public.backgammon_matches (
      id, player_a, player_b, match_mode, status, state, turn_number, revision
    ) VALUES (
      '10000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000001',
      'casual', 'active', '{"schemaVersion":1,"turn":{"phase":"awaiting_roll"}}', 0, 0
    );
    RAISE EXCEPTION 'duplicate open match for the same pair unexpectedly inserted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END;
$duplicate_open_match$;

DO $$
DECLARE
  first_result jsonb;
  retry_result jsonb;
  lookup_result jsonb;
BEGIN
  first_result := public.backgammon_commit_action(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'accept_match', 0, 0, repeat('a', 64),
    '{"schemaVersion":1,"turn":{"phase":"awaiting_roll"}}',
    'awaiting_opening_roll', 0, null
  );

  retry_result := public.backgammon_commit_action(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'accept_match', 0, 0, repeat('a', 64),
    '{"schemaVersion":1,"turn":{"phase":"awaiting_roll"}}',
    'awaiting_opening_roll', 0, null
  );

  lookup_result := public.backgammon_get_action_result(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    repeat('a', 64)
  );

  IF first_result IS DISTINCT FROM retry_result OR
     first_result IS DISTINCT FROM lookup_result THEN
    RAISE EXCEPTION 'idempotent retry did not return the original response';
  END IF;

  BEGIN
    PERFORM public.backgammon_commit_action(
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000099',
      '00000000-0000-4000-8000-000000000001',
      'accept_match', 0, 0, repeat('b', 64),
      '{"schemaVersion":1}', 'active', 0, null
    );
    RAISE EXCEPTION 'stale revision unexpectedly committed';
  EXCEPTION WHEN SQLSTATE '40001' THEN
    NULL;
  END;

  PERFORM public.backgammon_commit_action(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    'opening_roll', 0, 1, repeat('c', 64),
    '{"schemaVersion":1,"turn":{"phase":"moving"}}', 'active', 1, null
  );

  PERFORM public.backgammon_commit_action(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    'roll', 1, 2, repeat('d', 64),
    '{"schemaVersion":1,"turn":{"phase":"moving"}}', 'active', 1, null
  );

  BEGIN
    PERFORM public.backgammon_commit_action(
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000004',
      '00000000-0000-4000-8000-000000000001',
      'roll', 1, 3, repeat('e', 64),
      '{"schemaVersion":1,"turn":{"phase":"moving"}}', 'active', 1, null
    );
    RAISE EXCEPTION 'second roll in one turn unexpectedly committed';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END;
$$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

DO $$
DECLARE
  visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM public.backgammon_matches;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'RLS participant filter expected 1 match, got %', visible_count;
  END IF;

  BEGIN
    UPDATE public.backgammon_matches
      SET status = 'cancelled'
      WHERE id = '10000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'authenticated user unexpectedly updated a match';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM private.backgammon_actions';
    RAISE EXCEPTION 'authenticated user unexpectedly read private action ledger';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;

ROLLBACK;
