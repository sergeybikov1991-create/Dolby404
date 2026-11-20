# FLOUSTREAM WebShell Test APK

This is a disposable, isolated Android System WebView test app. It does not load the FLOUSTREAM website and does not modify the production messenger module.

## What it tests

- A standalone Android Activity containing WebView, with no browser address bar, tabs, or browser toolbar.
- Local HTML rendering without requiring network access.
- Long-page vertical scrolling and translucent UI panels.
- A fixed background compared with a scrolling background.
- Optional navigation to https://example.com/ to verify external HTTPS loading inside the same WebView.
- Android Back navigation from the external test page to the local diagnostic page.

## Build

From this directory:

```bash
gradle --no-daemon :app:assembleDebug
```

The debug APK is generated at:

`app/build/outputs/apk/debug/app-debug.apk`

Package ID: `com.floustream.webshelltest.debug`

Version: `0.1.0-debug`

The GitHub Actions workflow `.github/workflows/android-web-shell-test.yml` builds and uploads the APK as `FLOUSTREAM-WebShell-Test-debug`.

## Device test checklist

1. Install the test APK alongside the existing FLOUSTREAM Messenger. It has a separate application ID.
2. Launch it. Confirm there is no browser address bar, tab strip, or browser toolbar.
3. Scroll through all fourteen diagnostic panels several times. Watch for blank flashes, jumps, and frame drops.
4. Compare “Неподвижный фон” and “Движущийся фон”.
5. Tap “Проверить интернет”; confirm example.com opens inside the same app without browser chrome.
6. Press Android Back; confirm the diagnostic page returns.
7. Rotate the device and repeat the scroll test.
8. Report any visual glitches, slowdowns, crashes, or unexpected browser UI.

This test does not yet validate FLOUSTREAM site compatibility, authentication, media upload, camera/microphone access, notifications, or background calls. Those are later test stages.

## Safety boundary

Do not merge this test app into the production messenger or replace its MainActivity. It remains a separate test module until the engine and UX are accepted.
