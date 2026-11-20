# FLOUSTREAM Android Web Shell — Development Plan

## Branch purpose

This branch is an isolated development line for evolving the existing FLOUSTREAM Android application into a full-screen app shell around the shared FLOUSTREAM web platform.

It is not a replacement for the website and it is not a rewrite of the existing Android application.

## Baseline

- Base branch: `release/floustream-0.4.30`
- Base commit: `0c9c549fa2c130c2624774b1e7327c2c61b9f385`
- Existing Android module: `android-messenger/`
- Existing application ID: `com.dolby404.messenger`
- Baseline version: `0.4.30` / versionCode `38`

The release baseline is intentionally used because it contains the latest inspected Android application, signing/build configuration, updater, media and messaging implementation. The website's `main` branch is intentionally not merged into this Android branch: the two histories have diverged substantially and must be integrated selectively.

## Product requirements

1. Launch as a standalone Android app with FLOUSTREAM branding.
2. No browser address bar, browser toolbar, tab strip, or browser navigation chrome.
3. The web platform remains independently usable in Chrome, Firefox, desktop browsers, and other supported clients.
4. Use the same production web origin and Supabase-backed account/data services; do not fork or duplicate the website.
5. Keep the app shell responsible for native Android capabilities only where needed: permissions, camera/microphone integration, notifications, file selection, downloads, app lifecycle, deep links, and future call/background services.
6. Prefer a WebView-based Activity as the first shell prototype because it provides an app-owned surface without browser chrome. Evaluate TWA and GeckoView against the same test matrix before committing to a final engine.
7. Do not promise that Android system status/navigation bars can be permanently suppressed. Use appropriate edge-to-edge/immersive behavior without fighting system gestures.

## Visual and scrolling requirements

- The web content should occupy the app's available viewport.
- No browser UI or visible page-card/stack transitions.
- Scrolling should feel continuous, with one coherent FLOUSTREAM background rather than independently scrolling background panels or tiled surfaces.
- Inspect the actual DOM/CSS scroll containers before changing layout. Avoid global CSS hacks such as applying `position: fixed` indiscriminately.
- Verify fixed backgrounds, sticky elements, viewport units, safe areas, keyboard resize, orientation changes, and long-page scrolling on a physical Android device.

## Preservation rules

Do not remove, replace, or regress the existing Android functionality while building the shell. In particular, preserve and regression-test:

- chat local cache/preloading;
- FLOUSTREAM composer fan button and media picker;
- voice messages;
- gallery photo/video sending and playback;
- in-app update flow;
- authentication/deep-link handling;
- existing permissions and media lifecycle handling.

The immutable backgammon reference branch `reference/FIX-BACKGAMMON-001` must not be modified.

## Web-to-Android promotion workflow

1. Develop and test shared web features on the website development branch.
2. Record the tested commit and the exact changed files.
3. Compare the web development branch with the Android shell branch.
4. Port only the required shared web files or focused commits. Do not merge the entire website history into this branch.
5. Keep Android-specific code and configuration isolated under `android-messenger/` unless a shared web asset is intentionally packaged.
6. Run Android unit tests, lint, and debug build; then test on a physical device.
7. Promote to a release branch only after explicit approval and regression testing.

## Initial implementation sequence

1. Inspect the current Android Activity, navigation, authentication callbacks, and update flow.
2. Document the production web origin and required routes; do not guess or hard-code an unverified URL.
3. Add a minimal WebView shell behind an isolated entry point/feature flag, leaving the current app entry point available as a rollback path.
4. Add explicit handling for WebView lifecycle, navigation allowlist, external intents, file chooser, camera/microphone permissions, downloads, and renderer crashes.
5. Validate the full-screen/no-browser-chrome behavior and continuous scrolling on OnePlus 10T (Android 15).
6. Only after the prototype passes, plan migration of app sections and native integrations.

## Current status

Branch prepared from the Android 0.4.30 release baseline. No production Activity, manifest, Gradle dependencies, signing configuration, website files, or release workflow behavior have been changed as part of branch preparation.
