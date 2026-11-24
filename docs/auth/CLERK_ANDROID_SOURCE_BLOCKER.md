# FLOUSTREAM APK 2.0 — production source audit for Clerk migration

Status: source audit only. The APK 2.0 baseline and production app have not been modified.

## Protected baseline

- APK 2.0 baseline commit: `ff7313622a3a68bf961a6ee1ebec7fdbf71667cc`.
- Preparation branch: `auth/clerk-prep-apk-2.0`.

## What exists in the APK 2.0 baseline

The baseline contains `android-web-shell-test/`, whose Gradle application ID is `com.floustream.webshelltest` and whose README explicitly describes it as an isolated test WebView shell, not the production messenger. Its declared version is `0.1.0`; it must not be substituted for the installed production app.

## Historical native messenger source found

The repository history contains an older `android-messenger/` project at commit `bb068df16db43804872237f3c55c23aa6c2bfe0c`. It used:
- application ID `com.dolby404.messenger`;
- `versionCode 35`;
- `versionName 0.4.27`.

That native project was subsequently deleted from the active line. It predates the protected APK 2.0 baseline and cannot be assumed to contain the exact current APK 2.0 source or all of its preserved fixes. It is not safe to restore it automatically as the production baseline.

## Additional branches checked

- `APK-2.0` is only two commits beyond the protected baseline and changes a bundled website asset; it still contains the isolated test shell, not the production source.
- `feature/apk-2.0-debug-clean-from-1.8` contains a WebView client with Release identity `com.floustream.android`, version `2.0`, code `111`, but its README explicitly labels the branch a Debug candidate and says not to publish a Release APK from it; the production Release baseline is separate.
- `feature/apk-2.0-release-fcm` is a misleading branch name for this purpose: its Gradle/Release workflow identifies it as Android `1.3`, versionCode `103`, not APK 2.0.
- `auth/clerk-prep-apk-2.0-update` is explicitly Debug-only and identifies its installable debug variant as `com.floustream.android.debug`, version `2.0-debug`, code `110`.
- The repository's public release tags reach `v1.6`; no public `v2.0` APK artifact or source-to-artifact mapping was found.

These are useful development sources, but none is confirmed as the exact source of the currently installed production Release APK 2.0. Do not silently promote a Debug branch to Release.

## Closest Android 2.0 candidate checked

The branch `feature/apk-2.0-debug-clean-from-1.8` is a descendant of the protected commit (212 commits ahead) and contains a WebView client with production identity `com.floustream.android`, version name `2.0`, and version code `111`. Its README explicitly labels the branch a Debug candidate, says its CI builds Debug only, and states that the production Release baseline is separate. It therefore cannot be treated as the installed signed Release source, even though it is the closest 2.0 code candidate.

The latest public production release found is Android 1.6; its Release workflow source is separate from the 2.0 Debug candidate. No public v2.0 Release asset or exact source-to-artifact provenance was found.

## Required before Android implementation

Obtain or identify the exact source that produced the currently installed production APK 2.0, including:
- repository and branch or exact commit;
- Gradle project path and application ID;
- versionCode/versionName and signing/update workflow;
- source corresponding to the installed APK artifact.

Once identified, create a separate Clerk implementation branch from the exact approved APK 2.0 source. Keep the current APK 2.0 baseline immutable. Do not edit `android-web-shell-test/` as a substitute, do not copy the old 0.4.27 project into the current baseline without an explicit technical decision, and do not build or publish a replacement APK until the correct source is verified.

## Clerk integration design to apply after source recovery

- Use Clerk email/password with mandatory email-code verification; phone registration is not required.
- Use the Clerk JavaScript/native integration appropriate to the actual app architecture.
- For Supabase access, use the native Third-Party Auth token path and preserve the stable FLOUSTREAM UUID claim.
- Keep Clerk secret keys server-side only.
- Retain the existing in-app update/signing mechanism and application ID so the installed production app can update in place.
