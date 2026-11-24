# FLOUSTREAM APK 2.0 — Clerk migration preparation

Status: source discovery and planning only. No production APK source or artifact changed.

## Protected baseline

- APK 2.0 source baseline: `ff7313622a3a68bf961a6ee1ebec7fdbf71667cc`.
- Work branch: `auth/clerk-prep-apk-2.0`.
- This document is not a production Android implementation.

## Repository verification

The recursive Git tree at the APK 2.0 baseline contains 79 entries. The only Android Gradle module found is `android-web-shell-test`, with package `com.floustream.webshelltest` (debug suffix in the test build).

Its README explicitly identifies it as an isolated WebView test application, not the production messenger. It does not contain production camera/microphone/file chooser/upload bridge functionality. The audited tree contains no production package source path for `com.dolby404.messenger`.

Do not modify this test module as if it were the production APK. Do not merge it into or replace the production messenger.

## Planned production update (once exact source is located)

1. Create a new Android update branch from the immutable APK 2.0 baseline; never rewrite the baseline.
2. Identify whether the production messenger is native Android, WebView-based, or hybrid before selecting the Clerk SDK/integration path.
3. Use Clerk's supported Android/native flow for email verification codes and session lifecycle if the app is native. If the app delegates auth to the website, verify secure origin, cookie/session handoff, deep links and WebView lifecycle on the real app.
4. Connect Clerk identity to the same stable FLOUSTREAM UUID used by the website and Supabase RLS mapping.
5. Preserve existing chats, media, cache, calling and attachment functionality; auth work must not alter these modules.
6. Test sign-in, sign-out, email OTP, password reset, app restart, token refresh, expired session and account deletion/restore on the actual production application.
7. Build a signed Release update and verify delivery through the existing in-app updater. Do not hand off a debug APK as the final result.

## Blocking input

The production Android source repository/path or exact branch/commit is required. Current repository evidence is insufficient to implement or validate a production APK update. The isolated WebShell test project is not a substitute.

No APK release, package/version changes, production auth changes, or user migration have been performed.
