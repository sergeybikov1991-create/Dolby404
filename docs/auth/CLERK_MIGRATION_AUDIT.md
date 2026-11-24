# FLOUSTREAM — Clerk migration preparation audit

Status: preparation only. No production code, schema, auth settings, users, or Storage data changed.

## Protected baselines

- Website baseline: `c7a21e82195fadb8beb4ad648365e8cbb6f63fbb`.
- Android APK 2.0 baseline: `ff7313622a3a68bf961a6ee1ebec7fdbf71667cc`.
- This document is committed only on `auth/clerk-prep-main-0.8`.

## Confirmed production database facts (read-only audit)

Project ref: `qhpobdktlbhdqsnajypr`; PostgreSQL 17.11; EU Central (Frankfurt); project status ACTIVE_HEALTHY; Supabase organization plan Free.

Aggregate account inventory: 3 auth users, 3 profiles, all 3 email-confirmed, all 3 have password hashes. Identity provider inventory contains email only. No MFA factors found. No individual email addresses or hashes are recorded here.

Authorization dependency inventory:
- 94 policies in public; 80 reference `auth.uid()`.
- 25 policies in Storage; 24 reference `auth.uid()`.
- 22 application foreign keys reference `auth.users(id)`: 21 in public and 1 in private (backgammon actions).
- Two public SQL functions reference `auth.uid()`: `guard_scheduled_post_changes()` and `retry_scheduled_post(uuid)`.
- Two triggers on `auth.users`: `on_auth_user_created` invokes `handle_new_user()`; `create_private_photo_album_after_signup` invokes `create_private_photo_album_for_user()`.

The user-creation trigger currently creates the public profile, validates registration metadata/username and risk markers, and the second creates the private photo album. Clerk sign-up will not fire these auth.users triggers; equivalent trusted server-side provisioning must be designed and tested before cutover.

## Website code findings

- `shared/supabase-client.mjs` is the shared Supabase client.
- `routes/portal.js` uses Supabase `signUp`, `signInWithPassword`, `signInWithOtp` for account restore, and checks the persisted Supabase session key.
- `routes/profile.js` checks `getSession()` and `getUser()`, and calls `account-lifecycle` for delete/restore.
- Other route modules also consume the shared client; do not limit migration to the login form.
- Site source is a static HTML/JavaScript application rather than a React/Next application. Integration design must suit this architecture.

## Required architecture decisions

1. Clerk is the authentication authority; Supabase remains the application database, Storage and Realtime provider.
2. Preserve the existing UUID for every existing FLOUSTREAM account. Clerk user IDs are mapped to stable application UUIDs in a provider-independent identity registry.
3. Do not assume a Clerk token's `sub` is a UUID. Do not retain `auth.uid()` policies unchanged. Use Supabase Third-Party Auth integration and a carefully verified stable-UUID claim or a database identity lookup.
4. New account provisioning must be idempotent and trusted: create identity mapping, profile, username, risk review (when required), and private album without exposing service-role credentials to the browser.
5. The 22 FK relationships must be migrated without losing rows or changing stable IDs. Review exact ON DELETE behavior before any DDL.
6. The two SQL functions and all Storage policies need explicit authorization redesign and regression tests.
7. Edge Functions requiring user identity must verify Clerk JWTs, issuer/audience and relevant claims. Admin/service credentials stay server-side.

## Edge Function inventory

Active functions found and inspected:
- `registration-risk` (verify_jwt=false): public pre-registration domain/risk screening. Returns `low` or `review` for allowed addresses and blocks invalid/disposable addresses. It does not authenticate a user.
- `account-lifecycle` (verify_jwt=false): manually validates bearer token with Supabase Auth `getUser`, uses the token's user ID for deletion/restore, and finalizes deletion through `auth.admin.deleteUser`. Must be changed to verify Clerk JWTs, resolve the stable app UUID, delete Clerk identity at finalization, and remove the `app_users` row so the 22 FK cascades still execute.
- `dolby404-assistant` (verify_jwt=false): manually validates Supabase Auth token and checks the resolved user against the configured admin user ID. Must resolve the stable FLOUSTREAM UUID from a verified Clerk JWT and retain the same admin-only authorization.
- `backgammon-action` (verify_jwt=true): gateway-verifies the current Supabase JWT and then calls Supabase Auth `getUser`; the player UUID is used for match ownership. Must be tested with Clerk Third-Party Auth at the Functions gateway and explicitly verify/resolve the Clerk identity in the function before using the stable UUID.
- `send-chat-push` (verify_jwt=false): database-webhook handler protected by its own shared secret; it reads sender/recipient IDs from the webhook payload and uses the service role. It does not call Supabase Auth `getUser`. Keep this separate webhook authentication mechanism; review secret storage/rotation, but do not add a Clerk end-user token requirement to the database webhook.

Do not deploy changes to any production function during preparation.

## Migration and rollback gates

- Obtain and verify a real database backup and a Storage backup before production DDL or user migration. The connected Supabase tools expose SQL/migrations and project metadata but do not expose a complete downloadable database/Storage backup operation. A schema query is not a backup. Do not claim backup completion until a restorable backup has been verified.
- Clerk migration must be rehearsed against isolated synthetic/test data first. Do not export personal user records to an unapproved service.
- Validate password-hash compatibility with the exact existing hashes using a test account and Clerk's supported import path; never log or display hashes.
- Preserve Supabase Auth records during stabilization; no deletion of old users, old auth configuration, or old Edge Function paths until explicit approval.
- Define rollback handling for users created after cutover. Returning to Supabase Auth alone cannot magically recreate their old password hashes; test and document recovery or a safe dual-write strategy before enabling production sign-up.
- Do not cut over production as part of this preparation branch.

## Outstanding blockers

1. Clerk development instance/domain and publishable key are not configured yet; no secret keys should be sent in chat.
2. Production Android messenger source is not present in the audited APK 2.0 Git tree. The only Android Gradle project in that tree is a clearly isolated WebShell test app, not the production messenger.
3. A restorable database and Storage backup must be obtained and verified before production migration.
4. Email delivery DNS/domain configuration and applicable Clerk DPA/subprocessor terms must be verified before production use.

## Next implementation order

1. Build and test a provider-independent identity mapping and server-side provisioning design on an isolated local/test database.
2. Build a site auth adapter and route integration on this preparation branch, retaining a feature flag that defaults to the existing Supabase Auth path.
3. Add regression tests for profile creation, account restore/deletion, chat/media access, Storage ownership, scheduled posts, and backgammon.
4. Only after the Android production source is located, prepare the matching native/WebView integration on a separate update branch based on APK 2.0.
5. Present evidence, unresolved risks and exact cutover/rollback steps before any production switch.


## Implementation work committed on the preparation branch

- Added an additive `createThirdPartySupabaseClient()` / `createClerkSupabaseClient()` bridge in `shared/supabase-client.mjs`. Existing `getSupabaseClient()` remains unchanged and all existing routes still use the current Supabase Auth path.
- Added unit tests for fresh Clerk token retrieval and null/no-session behavior.
- Added a generated forward SQL draft that creates `public.app_users`, preserves the 22 audited FK relationships by redirecting them to the stable registry, replaces the 104 audited `auth.uid()` policies with a verified stable-UUID resolver, and adapts the two scheduled-post SQL functions.
- Added a guarded rollback SQL draft that restores the original 22 FK targets and all 104 original policies. It refuses to run if any app_users identity has no matching `auth.users` shadow row.
- Added a synthetic schema-only PostgreSQL fixture (195 catalog-derived columns across 29 tables; no production row data) and forward/rollback rehearsal tests.
- Added a GitHub Actions rehearsal sequence using a disposable PostgreSQL service database. This does not create a paid Supabase branch and does not touch the production project.
- Opened draft PR #81 for review and CI only. It is intentionally not mergeable/merged as a deployment action; do not merge it while the rehearsal and blockers remain.

## Identity provisioning and rollback safety refinement

For every new Clerk account, the server-side provisioning workflow must:
1. Verify the Clerk session JWT and retrieve the Clerk user from Clerk's Backend API.
2. Confirm the primary email address is verified.
3. Create a matching Supabase Auth shadow user via the Supabase Admin API, using an inaccessible random password and verified email. This preserves a same-UUID row for rollback and FK restoration; normal sign-in remains Clerk.
4. Use the resulting Supabase UUID as Clerk `external_id`.
5. Call `public.provision_clerk_user(...)` with a server-validated Clerk ID and metadata.
6. Refresh the Clerk session token so the new trusted claim is present before Supabase requests.

The Clerk session token must contain a trusted `app_user_id` claim sourced from Clerk's server-managed `external_id`, plus the `authenticated` role claim required by Supabase Third-Party Auth. The resolver accepts a Clerk UUID only when `app_users.clerk_user_id` matches the JWT subject; a mismatched subject resolves to NULL. Legacy Supabase UUID subjects remain accepted during stabilization.

The shadow-user approach is specifically for rollback safety. If production rollback is ever required, new Clerk-only accounts can recover access through a Supabase password-reset flow; their random shadow password is not known to the user. This behavior must be tested and documented before cutover.

## CI status

The first draft PR run (#750) completed successfully for the existing unit, browser and backgammon/Postgres suites. The expanded rehearsal tests are now part of the updated workflow and require their own completed run before this migration draft can be considered validated.


## Clerk session claims and sensitive-action reverification

The Clerk session-token configuration must include these claims:

```json
{
  "role": "authenticated",
  "app_user_id": "{{user.external_id}}",
  "email_verified": "{{user.email_verified}}",
  "reverification_id": "{{session.reverification_id}}"
}
```

The backend helper now rejects Clerk sessions unless the email is verified, the role is `authenticated`, the Clerk subject is a Clerk user ID, and `app_user_id` is a valid UUID. It then verifies that the UUID and Clerk subject match the server-managed `app_users` mapping.

The website has an additive email-code reverification helper based on Clerk's JavaScript Session methods. It requests a first-factor email code, verifies it, clears the token cache, and requests a fresh session token. The backend requires a recent first-factor age (`fva[0]` no more than 10 minutes) and a non-empty `reverification_id` for sensitive account-lifecycle actions.

A one-time `account_lifecycle_reverifications` ledger and service-role-only RPC consume each reverification ID for one action only. The synthetic PostgreSQL rehearsal checks duplicate-proof rejection and rollback removes this ledger. The actual development Clerk instance must still be used to verify the exact emitted `fva` and `reverification_id` claims before enabling account deletion/restore in production.

Official implementation references:
- Clerk session token custom claims and `user.external_id`: https://clerk.com/docs/guides/sessions/customize-session-tokens and https://clerk.com/docs/guides/sessions/jwt-templates
- Clerk JavaScript Session reverification methods: https://clerk.com/docs/js-frontend/reference/objects/session
- Clerk reverification and one-time IDs: https://clerk.com/docs/guides/secure/reverification
