DO $$
DECLARE
  auth_user_fks integer;
  app_user_fks integer;
  uid_policies integer;
BEGIN
  SELECT count(*) INTO auth_user_fks FROM pg_constraint
  WHERE contype='f' AND confrelid='auth.users'::regclass
    AND connamespace IN ('public'::regnamespace, 'private'::regnamespace);
  SELECT count(*) INTO app_user_fks FROM pg_constraint
  WHERE contype='f' AND confrelid='public.app_users'::regclass;
  SELECT count(*) INTO uid_policies FROM pg_policies
  WHERE (schemaname='public' OR schemaname='storage')
    AND (coalesce(qual,'') ILIKE '%auth.uid()%' OR coalesce(with_check,'') ILIKE '%auth.uid()%');

  IF auth_user_fks <> 22 OR app_user_fks <> 0 THEN
    RAISE EXCEPTION 'Rollback FK mismatch: auth.users %, app_users %', auth_user_fks, app_user_fks;
  END IF;
  IF uid_policies <> 104 THEN
    RAISE EXCEPTION 'Rollback did not restore all original auth.uid policies: %', uid_policies;
  END IF;
  IF to_regclass('public.app_users') IS NOT NULL THEN
    RAISE EXCEPTION 'Rollback did not remove provider-independent registry table';
  END IF;
END;
$$;
