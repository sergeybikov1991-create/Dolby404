# FLOUSTREAM Android 1.7

This Android application is the WebView-based FLOUSTREAM client. It opens the live FLOUSTREAM website inside a native Android Activity and uses the website's existing Supabase authentication/session.

## Production identity

- Application ID: `com.floustream.android`
- Version name: `1.7`
- Version code: `107`
- Minimum Android: 8.0 (API 26)
- Target Android: API 35
- Release signing: one persistent upload keystore; never regenerate it after the first public release.

The Debug variant deliberately uses a separate ID (`com.floustream.android.debug`) and can be installed alongside the production Release app. It uses a variant-specific Firebase configuration under `app/src/debug/google-services.json`; the production `app/google-services.json` remains unchanged. The Release APK must always be signed with the same keystore and certificate fingerprint recorded in the signing passport.

## In-app updates

The app checks the latest published GitHub Release for an `update.json` asset. The manifest contains `versionCode`, `versionName`, `apkUrl`, and the APK SHA-256 checksum. The app downloads the APK, verifies SHA-256, then hands installation to Android's system package installer. Android may require the user to allow installs from FLOUSTREAM once.

A public release must include `app-release.apk` and `update.json` as release assets. Do not publish a release until the signed candidate passes device validation.

Signing identity and certificate fingerprint are recorded in [RELEASE-SIGNING-PASSPORT.md](RELEASE-SIGNING-PASSPORT.md). The private keystore and passwords are never stored in this repository.

## GitHub Actions signing secrets

The release workflow reads these exact repository Actions secret names:

- `DOLBY404_KEYSTORE_BASE64`: base64-encoded persistent JKS/PKCS12 keystore
- `DOLBY404_KEYSTORE_PASSWORD`: keystore password
- `DOLBY404_KEY_ALIAS`: key alias
- `DOLBY404_KEY_PASSWORD`: private-key password

The workflow maps these secrets to the Android Gradle environment variables internally. Never rename or expose the secret values in logs.

Keep a secure offline backup of the keystore and passwords. Losing the key can prevent in-place updates for all users. Never commit the keystore or passwords to the repository.

## Build

Debug:
```bash
gradle --no-daemon :app:assembleDebug
```

Signed Release (requires the signing environment variables above):
```bash
gradle --no-daemon :app:assembleRelease
```

GitHub Actions workflow: `.github/workflows/android-release-1.0.yml`.

## Release gates

A push to the Android 1.7 development branch runs unit tests and builds Debug only. A signed Release candidate and public v1.7 publication are manual, gated actions and must not run before the owner approves Debug. After publication, verify that the installed production app discovers 1.7 and completes the download, SHA-256 check, and Android installer handoff through the in-app updater. Confirm the launcher icon is present and matches the owner-supplied FLOUSTREAM artwork. Keep the immutable APK 2.0 baseline unchanged.
