create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  first_name_value text := nullif(trim(new.raw_user_meta_data ->> 'first_name'), '');
  last_name_value text := nullif(trim(new.raw_user_meta_data ->> 'last_name'), '');
  country_value text := upper(nullif(trim(new.raw_user_meta_data ->> 'country_code'), ''));
  language_value text := lower(nullif(trim(new.raw_user_meta_data ->> 'preferred_language'), ''));
  display_value text;
  email_domain text := lower(split_part(coalesce(new.email, ''), '@', 2));
  risk_value text := lower(coalesce(new.raw_user_meta_data ->> 'registration_risk', 'low'));
  risk_reason_value text := coalesce(new.raw_user_meta_data ->> 'registration_risk_reason', 'domain_requires_manual_review');
  blocked_domain text;
  requested_username text := lower(nullif(trim(new.raw_user_meta_data ->> 'username'), ''));
  final_username text;
begin
  select domain into blocked_domain
  from unnest(array[
    '10minutemail.com','10minutemail.net','guerrillamail.com','guerrillamail.net',
    'mailinator.com','yopmail.com','getnada.com','tempmail.com','temp-mail.org',
    'throwawaymail.com','dispostable.com','maildrop.cc','sharklasers.com',
    'fakeinbox.com','emailondeck.com','trashmail.com','mintemail.com',
    'mohmal.com','minuteinbox.com','mailnesia.com','mytemp.email'
  ]) as domain
  where email_domain = domain or email_domain like '%.' || domain
  limit 1;

  if blocked_domain is not null then
    raise exception 'disposable_email_domain_not_allowed';
  end if;

  if email_domain like 'xn--%' or email_domain ~ '[0-9]{3,}' then
    risk_value := 'review';
    risk_reason_value := 'unusual_email_domain';
  end if;

  display_value := coalesce(
    nullif(trim(coalesce(first_name_value, '') || ' ' || coalesce(last_name_value, '')), ''),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    'Новый пользователь'
  );

  if language_value not in ('ru', 'en') then
    language_value := case when country_value in ('RU','BY','KZ','KG') then 'ru' else 'en' end;
  end if;

  if requested_username is not null then
    if requested_username !~ '^[a-z0-9_]{3,24}$' then
      raise exception 'username_invalid_format';
    end if;
    final_username := requested_username;
  else
    final_username := 'user_' || replace(new.id::text, '-', '');
  end if;

  insert into public.profiles (
    id, username, display_name, first_name, last_name,
    country_code, preferred_language, account_status
  ) values (
    new.id, final_username, display_value,
    first_name_value, last_name_value, country_value, language_value, 'active'
  );

  if risk_value = 'review' then
    insert into public.account_registration_reviews(user_id, risk_level, reason)
    values (new.id, 'review', risk_reason_value)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$function$;
