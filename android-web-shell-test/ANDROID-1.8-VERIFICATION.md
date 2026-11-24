# FLOUSTREAM Android 1.8 — full website parity

Branch: `feature/apk-1.8-full-floustream-site`
Starting point: Android 1.7 auth-fix candidate, commit `530f3725640bafed8bfa85653a859e5936f200de`
Immutable APK 2.0 baseline: `ff7313622a3a68bf961a6ee1ebec7fdbf71667cc`
App version: `1.8` (versionCode `108`)
Build target during implementation: Debug only.
Release: prohibited until the owner separately approves a verified candidate.

## Single product requirement

The Android app must present and operate as the FLOUSTREAM website itself. On opening the app, the user must not see a separate simplified Android product or notice a visual/functional difference from the website. The live website remains the single source of truth for interface, behavior, data, and features; Android provides the native device integration needed to make the same website experience work correctly on the phone.

## Required parity

- Preserve the complete website interface: every existing page, section, layout, visual element, typography, color, animation, menu, dialog, responsive state, and navigation behavior.
- Preserve every existing website feature and user flow, including all profile, social, feed, friend, message, media, settings, game, and account flows that exist on the live site.
- Preserve the site's data model, Supabase authentication and session behavior, storage, permissions, and user-visible outcomes. The app and website must use the same accounts and data.
- Preserve the website's established VK-inspired interaction and engineering principles as implemented in FLOUSTREAM: SPA route lifecycle, route/module map, lazy loading, prefetching, history/navigation behavior, request cancellation, cleanup/disposal, and existing performance behavior. Do not replace these mechanisms or invent a second implementation.
- Keep Android WebView visually seamless: no browser chrome, no extra welcome/loading screens after startup, no substitute native navigation UI, and no Android-only redesign of site pages.
- Make device-dependent site actions work through Android integration: camera, microphone, media/file selection, uploads, downloads, playback, fullscreen, notifications, and system Back behavior wherever the website currently supports them.
- Ensure all Android-only bridges are restricted to trusted FLOUSTREAM origins/routes and clean up resources when SPA routes change or the app closes.
- Preserve all working Android 1.6/1.7 capabilities unless a verified incompatibility must be corrected without reducing website parity.

## Protected scope

- Do not modify website `main`, published website files, Supabase schema/data, or server configuration for this APK-only task.
- Do not modify the immutable APK 2.0 baseline or its source commit.
- Do not merge the 1.8 branch into website `main`.
- Do not add new product features that do not already exist on the website.
- Do not remove, simplify, replace, or redesign any existing website feature.
- Debug builds and CI are the only permitted build outputs during implementation. Do not sign, publish, or distribute a Release until the owner explicitly approves it.

## Verification gates for Debug 1.8

- [ ] Confirm the app loads the exact live FLOUSTREAM site and has no browser chrome or separate app UI.
- [ ] Compare all site routes and key screens in browser vs Android WebView; record and fix every visible discrepancy.
- [ ] Exercise every existing site feature and user flow in Android, not just a hand-picked list of native integrations.
- [ ] Verify account creation, login, logout, persisted session, and navigation between authenticated/guest states.
- [ ] Verify SPA navigation, history/back behavior, lazy module loading, prefetching, cancellation, and cleanup.
- [ ] Verify social/feed/profile/friends/messages/media/settings/game flows that exist on the website.
- [ ] Verify camera, microphone, gallery, file chooser, upload/download, media playback, fullscreen, and notifications where supported by the website.
- [ ] Verify all native bridges reject untrusted origins and release camera/microphone/audio resources on route changes.
- [ ] Run Android unit tests and all applicable automated website smoke/e2e tests.
- [ ] Build Debug APK with application ID `com.floustream.android.debug`, versionName `1.8-debug`, versionCode `108`.
- [ ] Inspect APK identity, artifact integrity, logs, and test results before giving the Debug build to the owner.
- [ ] No Release candidate, public release, or in-app production update before separate explicit approval.

## Completion definition

Debug 1.8 is complete only when the FLOUSTREAM site can be opened and used inside the Android app with the same interface, functions, behavior, data, and user-visible results as the site itself, with no known parity gaps or regressions. A successful APK compilation alone is not completion.
