# FLOUSTREAM — Clerk migration preparation audit

Status: **preparation only**. No production code, schema, auth settings, users, Storage data, or Edge Functions have been changed. No Clerk instance has been created and no user export/import has run.

## Protected baselines and working branches

- Website Main 0.8 checkpoint: `c7a21e82195fadb8beb4ad648365e8cbb6f63fbb`.
- Current website Main 0.9 checkpoint: `7279eb03faffe940afbdf17714aa67a2de054abc`.
- Android APK 2.0 protected baseline: `ff7313622a3a68bf961a6ee1ebec7fdbf71667cc`.
- Website Clerk preparation branch: `auth/clerk-prep-main-0.9`; draft PR #83 targets current `main`.
- Android Clerk preparation branch: `auth/clerk-prep-apk-2.0`; documentation only, no app source changes.
- The older Main 0.8 draft PR #81 was closed unmerged after Main advanced to 0.9.

## Confirmed production database facts (read-only audit)

Project ref: `qhpobdktlbhdqsnajypr`; PostgreSQL 17.11; EU Central (Frankfurt); status ACTIVE_HEALTHY; Supabase organization plan Free.

- 3 Auth users and 3 profiles.
- All 3 users have confirmed email addresses and password hashes (bcrypt).
- Identity provider inventory contains email only; no MFA factors were found.
- 94 policies in `public`; 80 reference `auth.uid()`.
- 25 policies in Storage; 24 reference `auth.uid()`.
- 22 application foreign keys reference `auth.users(id)`: 21 in `public` and 1 in `private` (backgammon actions).
- Two public SQL functions reference `auth.uid()`: `guard_scheduled_post_changes()` and `retry_scheduled_post(uuid)`.
- Two triggers on `auth.users`: `on_auth_user_created` invokes `handle_new_user()`; `create_private_photo_album_after_signup` invokes `create_private_photo_album_for_user()`.

The current Storage project has 10 buckets and 60 objects across 7 buckets. The bucket/object-count inventory is recorded in `PRODUCTION_BACKUP_RUNBOOK.md`; no object names or user file contents were retrieved.

A final read-only production check after the preparation work confirmed:
- `public.app_users` does not exist.
- `public.account_lifecycle_reverifications` does not exist.
- Auth users/profiles remain 3/3.
- Public/Storage policy counts remain 94/25.

## Website architecture findings

- `shared/supabase-client.mjs` is the shared client entry point.
- `routes/portal.js` handles registration, password sign-in, email-code recovery, and session checks.
- `routes/profile.js` handles profile actions, account deletion, and account lifecycle.
- Other routes consume the shared client, so migration cannot be limited to the login form.
- The site is static HTML/JavaScript, not a React/Next application.

## Implemented on the isolated website preparation branch

- Added a Clerk browser auth facade while keeping the provider flag set to `supabase`. Existing production login remains the active path until an explicit future cutover.
- Added email/password registration with mandatory email-code verification, password sign-in, email-code recovery, sign-out, and email-code reverification for account deletion.
- Added stable-identity provisioning after both sign-up and every successful sign-in, so imported users receive their `app_users` mapping before protected Supabase requests.
- Added profile hydration from existing FLOUSTREAM profile rows. Imported users are not forced to re-enter names or profile data that is absent from their old Auth metadata.
- Added Clerk session verification using issuer, JWKS signature, verified-email claim, authenticated role, exact authorized-party origin allowlist (`azp`), and stable UUID claim.
- Added server-side Edge Function drafts for identity provisioning, account lifecycle, backgammon actions, and assistant access. The existing database-webhook push function remains on its separate webhook authentication path.
- Added forward SQL and guarded rollback drafts for the provider-independent `public.app_users` identity registry, 22 existing application FK relationships, the one-time reverification ledger, the 104 audited RLS policies, and the two scheduled-post functions.
- Added a synthetic PostgreSQL fixture and forward/rollback rehearsal tests. No production SQL has been applied.

## CI verification

On the current Main 0.9 preparation branch, the pre-authorized-party implementation run passed:
- Chromium smoke/browser tests.
- Deno type-checking of the shared identity verifier and all Clerk-aware Edge Function drafts.
- Clerk JWT verification tests.
- Disposable PostgreSQL migration rehearsal, stable identity mapping, RLS isolation, and guarded rollback.

The authorized-party implementation also passed GitHub Actions run #811: exact `azp` allowlist validation, missing-origin rejection, unapproved-origin rejection, Deno type checks, browser tests, and PostgreSQL migration/rollback rehearsal. Subsequent commits on this branch only refreshed documentation.

## Clerk configuration and cost

- Clerk Hobby is the initial no-cost target; no paid add-ons or plan upgrade are authorized.
- No Clerk instance, domain, publishable key, secret key, or Supabase Third-Party Auth provider has been configured.
- The setup runbook defines the required custom session claims: `app_user_id`, `email_verified`, and `reverification_id`; the native Supabase integration supplies the authenticated role.
- The backend additionally requires `CLERK_ALLOWED_PARTIES` to contain the exact website origin(s). Wildcards are not allowed.
- Email delivery domain/DNS, DPA/subprocessor terms, and actual token claims must be verified before production use.

## Backup and rollback

Supabase Free does not provide automatic daily database backups. The SQL rollback draft is **not** a full data backup.

A no-cost local backup runbook is committed at `PRODUCTION_BACKUP_RUNBOOK.md`. It covers a complete PostgreSQL dump including Auth and Storage metadata, plus all 10 Storage buckets. No production database dump or Storage objects have been downloaded; no restorable backup has been verified. No paid Supabase branch was created (the project's branch list remains empty).

Before cutover:
1. Create encrypted database and Storage backups in two separate locations.
2. Verify the database archive and object counts.
3. Complete a restore rehearsal on an isolated database.
4. Preserve old Supabase Auth users, password hashes, triggers, and recovery paths during stabilization.
5. Test rollback for Clerk-only accounts; their shadow Supabase users have random passwords, so returning to Supabase Auth requires a safe password-reset/recovery path.

## Android APK 2.0 source audit

The protected APK 2.0 commit `ff7313622a3a68bf961a6ee1ebec7fdbf71667cc` contains only `android-web-shell-test/`, an isolated test shell with package `com.floustream.webshelltest`, not the installed production Release source.

Other candidates were inspected:
- `APK-2.0` is only two commits beyond the protected baseline and changes a bundled website asset.
- `feature/apk-2.0-debug-clean-from-1.8` contains a WebView client with Release identity `com.floustream.android`, version `2.0`, code `111`, but its README explicitly calls it a Debug candidate and says not to publish a Release APK from it; the production Release baseline is separate.
- `auth/clerk-prep-apk-2.0-update` is explicitly Debug-only; its debug identity is `com.floustream.android.debug`, `2.0-debug`, code `110`.
- Historical native `android-messenger/` source exists at `bb068df16db43804872237f3c55c23aa6c2bfe0c`, but it is old version `0.4.27`, package `com.dolby404.messenger`, and is not the APK 2.0 source.
- The repository's public release tags reach `v1.6`; no public `v2.0` APK artifact or source-to-artifact mapping was found.

None of these is confirmed as the exact source that produced the currently installed production APK 2.0. Do not substitute a Debug candidate or old 0.4.27 source for the production Release app. The exact production Release repository/branch/commit and signing/update source must be identified before Android implementation.

## Remaining blockers before production cutover

1. Clerk Dashboard access and instance configuration.
2. Exact production Android APK 2.0 Release source.
3. A verified full database + Storage backup and restore rehearsal.
4. Exact allowed website origin(s), email delivery/DNS, and applicable Clerk DPA/subprocessor verification.
5. Live verification of Clerk session claims, email verification, account recovery/deletion, Storage ownership, chat/media, scheduled posts, and backgammon.

No production provider switch, production schema change, user migration, Edge Function deployment, or Release APK publication is permitted until these gates are closed and the cutover is separately authorized.
