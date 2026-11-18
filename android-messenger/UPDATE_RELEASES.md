# FLOUSTREAM Messenger updates

- Android package ID: `com.dolby404.messenger`.
- The app checks the latest public GitHub Release when it opens.
- A newer release is downloaded inside the app and passed to Android's package installer.
- Android requires the user to approve installation; silent installation is not available to an ordinary app.
- Keep the same private signing keystore for every future release. Losing it prevents updates over the installed app.
- Increase `versionCode` and `versionName` before each subsequent release.
- Start the signed release workflow from GitHub Actions or push a version tag such as `v0.2.0`.
- The workflow validates the keystore, builds and verifies the signed APK, and publishes `FLOUSTREAM-Messenger.apk` plus a ZIP.

Required GitHub Actions secrets:
- `DOLBY404_KEYSTORE_BASE64`
- `DOLBY404_KEYSTORE_PASSWORD`
- `DOLBY404_KEY_ALIAS`
- `DOLBY404_KEY_PASSWORD`

Never commit the keystore, Base64 key, or passwords to this repository. The workflow removes the temporary keystore from its runner after the job.


## Candidate v0.4.29

- Android versionName: `0.4.29`; versionCode: `37`.
- Adds the first local FLOUSTREAM voice assistant foundation (push-to-talk; Android on-device speech recognition; Android TTS; allow-listed commands and confirmation gates).
- Preserves the approved chat/media implementation; microphone ownership is coordinated between the assistant, voice messages, and video messages.
- Release CI must pass unit tests, Android lint, signed APK build, package/version verification, and APK signature verification before publication.
