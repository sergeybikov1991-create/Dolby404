# FLOUSTREAM Android 2.1 — Verification Passport

Status: signed Release 2.1 is prepared for controlled in-app updater validation. CI and Android API 35 emulator checks must pass on the exact publishing commit. Physical-device acceptance is still pending.

## Source provenance

- Base branch: `feature/android-1.6-compact-audio-launcher`
- Base commit: `0177bd27a827e48dd1e3982048443b6382228b5d`
- Working branch: `feature/android-2.0-from-1.6`
- Release version: `2.1`
- Release versionCode: `111`
- Production application ID: `com.floustream.android`
- Debug application ID: `com.floustream.android.debug`

## Protected behavior inherited from 1.6

- [ ] Existing website WebView and Supabase authentication/session; native Android never calls the Supabase refresh-token endpoint or writes refreshed tokens.
- [ ] Short tap on the existing send control sends text or queued attachments; press-and-hold records voice.
- [ ] Compact voice playback with Play/Stop and automatic reset.
- [ ] Borderless photo/video presentation and video preview.
- [ ] Gallery attachments and persistent per-account media cache.
- [ ] Existing camera/file chooser behavior.
- [ ] Chat photo viewer remains inside the Android viewport in portrait and landscape.
- [ ] SPA route changes reinstall the Android voice recorder/photo viewer integration only on known FLOUSTREAM routes.
- [ ] WebView microphone/camera capture requests are limited to the trusted HTTPS FLOUSTREAM origin and the exact Android runtime permissions requested.
- [ ] Tapping a push notification opens the sender's chat after authentication; malformed peer IDs are ignored.
- [ ] Existing launcher identity.
- [ ] In-app updater and Android install handoff.

## Automated checks

- [ ] Gradle unit tests, including trusted-origin and least-privilege media permission policy tests.
- [ ] Debug compilation (CI only; not a user test deliverable).
- [ ] Android API 35 emulator smoke test confirms the live FLOUSTREAM portal/login loads in a visible WebView, including SPA-only route transitions.
- [ ] Signed Release compilation.
- [ ] APK package/version identity.
- [ ] APK signature verification.
- [ ] Release certificate fingerprint matches the signing passport.
- [ ] SHA-256 and updater manifest generation.
- [ ] CI artifact is tied to the exact source commit.
- [ ] GitHub Release v2.1 contains the signed APK, checksum and update.json; v2.1 is the latest stable release.

## Physical-device checks — OnePlus 10T / Android 15

- [ ] Install signed Release 2.1 over the installed 2.0 Release without uninstalling.
- [ ] Verify existing account/session continuity, including Supabase JS refreshing an expired access token without native refresh requests or signing the user out.
- [ ] After authentication, the app opens the real FLOUSTREAM profile route rather than an Android-only welcome screen; signed-out users can still receive update prompts.
- [ ] Verify launch, navigation, Back, keyboard, rotation and lifecycle.
- [ ] Verify voice recording and playback.
- [ ] Verify gallery photo/video sending, previews, playback and cache.
- [ ] Verify camera, permissions and file selection.
- [ ] Verify slow/offline/recovered network behavior.
- [ ] Verify updater discovery, checksum, download, install handoff and successful app replacement.
- [ ] Verify no protected 1.6 regression.

## Release decision

Public Release v2.1 is published only after the complete CI and Android API 35 emulator gates pass, using the owner-approved `[publish-v2.1]` marker. The first installation is deliberately delivered through the in-app updater for physical-device acceptance. Do not mark 2.0 as the immutable baseline until the OnePlus 10T / Android 15 checks pass; APK 2.0 remains the rollback point.
