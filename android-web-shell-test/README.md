# FLOUSTREAM Android WebShell Test APK

An isolated Android WebView test application for validating the FLOUSTREAM Android entry flow. It remains separate from the production messenger module.

## Entry and authentication flow

- On launch, the app opens the existing FLOUSTREAM website entry point in a hidden WebView to check the existing Supabase session.
- If a saved session is found, the app opens `home.html` directly.
- If the visitor is signed out, the app shows the welcome screen bundled inside the APK. The website's `index.html` is not modified for this flow.
- The welcome screen's Start button and right-to-left swipe open the existing `portal.html` sign-in/registration page.
- After successful authentication, the Android WebView redirects the existing `profile.html` post-auth route to `home.html`.

## What it tests

- Standalone Android Activity with WebView and no browser address bar or toolbar.
- APK-bundled welcome screen and right-to-left swipe.
- Existing website authentication and saved-session routing.
- Navigation to the FLOUSTREAM home page after sign-in.
- WebView scrolling, translucent UI panels, fixed/scrolling backgrounds, and Android Back navigation.

## Build

From this directory:

```bash
gradle --no-daemon :app:assembleDebug
```

The debug APK is generated at:

`app/build/outputs/apk/debug/app-debug.apk`

Package ID: `com.floustream.webshelltest.debug`

Version: `0.1.0-debug`

GitHub Actions builds and uploads the APK as `FLOUSTREAM-WebShell-Test-debug`.

## Device test checklist

1. Install the test APK alongside the existing FLOUSTREAM Messenger. It has a separate application ID.
2. With no saved session, launch the app and confirm the bundled welcome screen appears.
3. Swipe from the right side toward the left; confirm the existing sign-in/registration page opens.
4. Repeat using the Start button.
5. Sign in or register; confirm the app opens `home.html`.
6. Relaunch with a saved session; confirm the welcome and sign-in screens are skipped.
7. Press Android Back and check navigation behavior.
8. Rotate the device and repeat the flow.

## Safety boundary

This is still a test WebView shell, not a finished production messenger APK. Do not merge this test app into the production messenger or replace its MainActivity until the flow has been accepted on a device.
