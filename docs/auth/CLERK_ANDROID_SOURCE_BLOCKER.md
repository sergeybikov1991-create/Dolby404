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
