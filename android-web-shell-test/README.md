# FLOUSTREAM Android 2.1

Android 2.1 is being developed from the verified Android 1.6 source branch. The production package identity and persistent signing certificate are preserved so the final signed 2.1 APK can update an installed 1.6 Release in place.

## Source provenance

- Base branch: `feature/android-2.0-from-1.6`
- Base commit: `9d88a3a708747312500c50e7100c4a42c8f9c7fe` (signed APK 2.0)
- Development branch: `feature/android-2.0-from-1.6`
- Android module: `android-web-shell-test/`
- Website `main`: out of scope and must remain untouched.

## Production identity

- Application ID: `com.floustream.android`
- Version name: `2.1`
- Version code: `111` (higher than Android 2.0 / 110)
- Minimum Android: 8.0 (API 26)
- Target Android: API 35
- Compile SDK: 36
- Java/Kotlin target: 17

The Debug variant uses the separate application ID `com.floustream.android.debug`. Debug builds are for automated CI only and are not substitutes for the signed Release candidate or the final Release.

## Protected Android 2.0/1.6 protected behavior

The 2.1 branch must preserve the working 1.6 behavior unless a separately tested change is explicitly documented:

- existing WebView-based FLOUSTREAM website and Supabase session; website Supabase JS is the sole session-refresh owner and Android never refreshes or rewrites tokens; after login the real website profile remains the app home;
- short tap on the existing send control sends text or queued attachments; press-and-hold records voice;
- compact voice-message player with Play/Stop and automatic reset;
- photo/video media presentation without visible frames, plus viewport-safe chat photo viewing;
- gallery attachment flow, video preview and persistent per-account media cache;
- existing launcher icon artwork and Android file/camera integration;
- checksum-verified in-app updater.

## Release signing

Use the same persistent release keystore and certificate recorded in [RELEASE-SIGNING-PASSPORT.md](RELEASE-SIGNING-PASSPORT.md). Never regenerate or replace the signing key. The private keystore and passwords must remain in GitHub Actions secrets and must never be committed.

The workflow checks the APK signature and the certificate SHA-256 fingerprint before uploading a signed Release candidate.

## In-app updater

The existing updater reads the latest published GitHub Release and its `update.json` asset. The 2.1 manifest is prepared with versionCode 111, versionName 2.1, the `v2.1` APK URL and the APK SHA-256. After the automated and emulator gates pass, the controlled public v2.1 Release is published so the installed 1.6 app can receive it through the in-app updater. Do not sideload the APK.

## CI and publication

Workflow: `.github/workflows/android-2.0-release.yml`.

CI runs unit tests, builds the isolated Debug variant, checks Android 2.1 behavior contracts, runs an Android API 35 WebView emulator smoke test, builds the signed Release APK, verifies package identity and signing certificate, and uploads the signed Release APK plus checksum and updater manifest. The workflow publishes GitHub Release `v2.1` only when the commit message contains the explicit `[publish-v2.1]` gate marker and every preceding check succeeds.

The first public Release is intentionally the in-app update validation path: install it over the existing 2.0 Release through the app's updater, then complete the OnePlus 10T / Android 15 regression checks. APK 1.6 remains the rollback point until those physical-device checks pass. Do not distribute or install a Debug build.
