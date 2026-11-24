# FLOUSTREAM — Clerk instance setup runbook

Status: preparation only. No Clerk instance has been created and no production auth setting has been changed.

## Cost and plan

The initial deployment target is Clerk Hobby ($0, no credit card required), subject to the current published limit of 50,000 monthly retained users per application. Do not enable paid add-ons or upgrade the instance without explicit approval.

## Instance configuration

Create a Clerk application for FLOUSTREAM. Keep development and production environments distinct. Use the Clerk production instance only after the development rehearsal passes.

Authentication methods:
- Require email address.
- Enable email + password sign-up.
- Require email verification at sign-up using an email verification code.
- Enable email + password sign-in.
- Keep phone-number registration/sign-in disabled.
- Keep any unapproved social providers disabled.
- Keep email-code verification available for password sign-in on untrusted devices and for sensitive-action reverification.

Clerk email codes expire after 10 minutes; resend cooldown is 30 seconds.

## Supabase integration

Use Clerk's native Supabase Third-Party Auth integration, not a legacy JWT template:
1. In Clerk, activate the Supabase integration and copy the exact Clerk domain.
2. In Supabase Authentication → Sign In / Providers, add Clerk and enter that domain.
3. Confirm Clerk session tokens include the `role: "authenticated"` claim supplied by the native integration.
4. Keep Supabase Auth enabled during the stabilization period; do not delete existing users or disable the legacy provider.

## Clerk session-token custom claims

Add only these small claims in Clerk → Sessions → Customize session token. Merge them with any claims already required by the native Supabase integration:

```json
{
  "app_user_id": "{{user.external_id}}",
  "email_verified": "{{user.email_verified}}",
  "reverification_id": "{{session.reverification_id}}"
}
```

- `app_user_id` carries the stable FLOUSTREAM UUID preserved in Clerk `external_id`.
- `email_verified` lets the server reject sessions without a verified email.
- `reverification_id` makes sensitive account actions single-use.
- Keep `role: "authenticated"` from the native Supabase integration.
- Do not add full user metadata to the token; keep the token small.

## Required server-side secrets

Set these only in Supabase Edge Function secrets (never in browser code, GitHub source, chat messages, or committed files):
- `CLERK_SECRET_KEY`
- `CLERK_ISSUER` — exact issuer URL for the production instance
- `CLERK_JWKS_URL` — optional if the standard issuer JWKS endpoint is used
- `SUPABASE_SERVICE_ROLE_KEY` — existing server-side Supabase service-role secret

Set the public Clerk publishable key in the website's public configuration only after the Clerk instance and domain are confirmed. Never place the Clerk secret key in the website or Android APK.

## User migration rehearsal

The audited Supabase project contains 3 existing users; all 3 currently have confirmed email addresses and bcrypt password hashes. The migration must preserve their Supabase UUIDs as Clerk `external_id`.

Use Clerk's official Supabase migration CLI:
1. Obtain a restorable database and Storage backup first.
2. Use the Supabase Session Pooler connection string as `SUPABASE_DB_URL`; keep its password in a masked environment variable or secret store.
3. Run `clerk migrate export supabase`.
4. Run `clerk migrate import <export-run-id> --dry-run`; inspect every warning and confirm all 3 users retain a supported password digest and verified email.
5. Import only after the dry run is clean and the user has explicitly approved the cutover window.
6. Verify sign-in with an existing account before enabling the Clerk provider flag.

Never print, commit, or send the export file, password hashes, database URL, or Clerk secret key in chat.

## Stabilization and rollback

- Keep old Supabase Auth user rows and password hashes during stabilization.
- Keep `ALLOW_LEGACY_SUPABASE_AUTH=true` only while the approved dual-provider stabilization window is active.
- Do not remove old Supabase Auth triggers, auth configuration, or recovery paths during preparation.
- The database identity/RLS migration and its guarded rollback remain draft SQL only. The isolated PostgreSQL rehearsal has passed; production DDL has not run.
- Rollback must be rehearsed before cutover. New Clerk-only users require a safe Supabase shadow identity and an explicit password-reset/recovery path before the legacy provider can become primary again.
- Do not change the production provider flag until website and native Android source have both passed their own release checks.

## Remaining external setup gates

- Clerk application/domain and publishable/secret keys have not been created or configured.
- Supabase Clerk third-party provider has not been enabled.
- No user export/import has been run.
- No production database backup has been verified.
- No production user or auth configuration has been changed.
