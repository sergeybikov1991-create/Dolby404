# Dolby404 Messenger updates

- Every installed build must keep the application ID `com.dolby404.messenger`.
- Every public update must be signed with the same private Android keystore.
- Increase both `versionCode` and `versionName` before publishing a new release.
- Push a tag such as `v0.2.0` to build a signed release and publish `Dolby404-Messenger.apk` as a GitHub Release asset.
- The app checks the latest public GitHub Release and downloads that APK from inside the app.
- Never commit the keystore or its passwords to this repository.
- Required GitHub Actions secrets: `DOLBY404_KEYSTORE_BASE64`, `DOLBY404_KEYSTORE_PASSWORD`, `DOLBY404_KEY_ALIAS`, and `DOLBY404_KEY_PASSWORD`.

Android still requires the user to approve installation through its system package installer. The app can attempt to reopen after the package-replaced broadcast, but Android may block automatic background launches on some devices.
