# FLOUSTREAM Android Debug 2.0

This branch builds the Android Debug 2.0 client from the verified Android 1.8 source baseline. It is dedicated to fixing the Android chat issues agreed for this iteration:

- Keep portrait and landscape photos fully inside the full-screen viewer, respecting the Android viewport and image orientation.
- Restore voice recording on the existing send arrow using press-and-hold.
- Make a short tap on the send arrow submit queued attachments, including a recorded voice message, even when the text field is empty.

## Debug identity

- Application ID: `com.floustream.android.debug`
- Version name: `2.0-debug`
- Version code: `110`
- Minimum Android: 8.0 (API 26)
- Target Android: API 35

The Debug variant installs separately from the production app. The Android 1.8 Supabase session verification and refresh-token recovery code is preserved unchanged from the baseline.

## Scope and protection

This is a Debug-only development branch. Do not publish a Release APK from this branch. The production Release baseline APK 2.0 and website Main are separate and remain untouched.

No website source, Supabase schema, production signing configuration, or Release baseline is changed by this task.

## Build

```bash
gradle --no-daemon :app:testDebugUnitTest
gradle --no-daemon clean :app:assembleDebug
```

GitHub Actions workflow: `.github/workflows/android-web-shell-test.yml`.

The workflow verifies the Debug package/version, checks that the Android-only chat fixes are present, uploads the Debug APK, and runs the WebView startup smoke test on an Android emulator.
