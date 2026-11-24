# FLOUSTREAM Android 2.0

Android 2.0 is being developed from the verified Android 1.6 source branch. The production package identity and persistent signing certificate are preserved so the final signed 2.0 APK can update an installed 1.6 Release in place.

## Source provenance

- Base branch: `feature/android-1.6-compact-audio-launcher`
- Base commit: `0177bd27a827e48dd1e3982048443b6382228b5d`
- Development branch: `feature/android-2.0-from-1.6`
- Android module: `android-web-shell-test/`
- Website `main`: out of scope and must remain untouched.

## Production identity

- Application ID: `com.floustream.android`
- Version name: `2.0`
- Version code: `110` (higher than Android 1.6 / 106)
- Minimum Android: 8.0 (API 26)
- Target Android: API 35
- Compile SDK: 36
- Java/Kotlin target: 17

The Debug variant uses the separate application ID `com.floustream.android.debug`. Debug builds are for automated CI only and are not substitutes for the signed Release candidate or the final Release.

## Protected Android 1.6 behavior

The 2.0 branch must preserve the working 1.6 behavior unless a separately tested change is explicitly documented:

- existing WebView-based FLOUSTREAM website and Supabase session;
- press-and-hold voice-message recording on the existing send control;
- compact voice-message player with Play/Stop and automatic reset;
- photo/video media presentation without visible frames;
- gallery attachment flow, video preview and persistent per-account media cache;
- existing launcher icon artwork and Android file/camera integration;
- checksum-verified in-app updater.

## Release signing

Use the same persistent release keystore and certificate recorded in [RELEASE-SIGNING-PASSPORT.md](RELEASE-SIGNING-PASSPORT.md). Never regenerate or replace the signing key. The private keystore and passwords must remain in GitHub Actions secrets and must never be committed.

The workflow checks the APK signature and the certificate SHA-256 fingerprint before uploading a signed Release candidate.

## In-app updater

The existing updater reads the latest published GitHub Release and its `update.json` asset. The 2.0 manifest is prepared with versionCode 110, versionName 2.0, the future `v2.0` APK URL and the APK SHA-256. It will not discover 2.0 until the public release is explicitly published.

## CI and publication

Workflow: `.github/workflows/android-2.0-release.yml`.

CI runs unit tests, builds the isolated Debug variant, builds the signed Release APK, verifies package identity and signing certificate, and uploads only the signed Release APK plus its checksum and updater manifest. It does not publish a GitHub Release.

A CI artifact is not proof of physical-device behavior. Public publication and replacement of the in-app update target remain blocked until the OnePlus 10T / Android 15 checks, updater in-place installation, and protected-feature regression checks pass, followed by explicit release authorization.
