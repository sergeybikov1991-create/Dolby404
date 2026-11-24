# FLOUSTREAM Android 2.0 — Verification Passport

Status: implementation baseline and CI pipeline setup in progress. No 2.0 APK is represented as an existing public or installed release.

## Source provenance

- Base branch: `feature/android-1.6-compact-audio-launcher`
- Base commit: `0177bd27a827e48dd1e3982048443b6382228b5d`
- Working branch: `feature/android-2.0-from-1.6`
- Initial 2.0 version: `2.0`
- Initial 2.0 versionCode: `110`
- Production application ID: `com.floustream.android`
- Debug application ID: `com.floustream.android.debug`

## Protected behavior inherited from 1.6

- [ ] Existing website WebView and Supabase authentication/session.
- [ ] Short tap on the existing send control sends text or queued attachments; press-and-hold records voice.
- [ ] Compact voice playback with Play/Stop and automatic reset.
- [ ] Borderless photo/video presentation and video preview.
- [ ] Gallery attachments and persistent per-account media cache.
- [ ] Existing camera/file chooser behavior.
- [ ] Chat photo viewer remains inside the Android viewport in portrait and landscape.
- [ ] SPA route changes reinstall the Android voice recorder/photo viewer integration only on known FLOUSTREAM routes.
- [ ] WebView microphone/camera capture requests are limited to the trusted HTTPS FLOUSTREAM origin and the exact Android runtime permissions requested.
- [ ] Existing launcher identity.
- [ ] In-app updater and Android install handoff.

## Automated checks

- [ ] Gradle unit tests, including trusted-origin and least-privilege media permission policy tests.
- [ ] Debug compilation (CI only; not a user test deliverable).
- [ ] Signed Release compilation.
- [ ] APK package/version identity.
- [ ] APK signature verification.
- [ ] Release certificate fingerprint matches the signing passport.
- [ ] SHA-256 and updater manifest generation.
- [ ] CI artifact is tied to the exact source commit.

## Physical-device checks — OnePlus 10T / Android 15

- [ ] Install signed Release 2.0 over the installed 1.6 Release without uninstalling.
- [ ] Verify existing account/session continuity.
- [ ] Verify launch, navigation, Back, keyboard, rotation and lifecycle.
- [ ] Verify voice recording and playback.
- [ ] Verify gallery photo/video sending, previews, playback and cache.
- [ ] Verify camera, permissions and file selection.
- [ ] Verify slow/offline/recovered network behavior.
- [ ] Verify updater discovery, checksum, download, install handoff and successful app replacement.
- [ ] Verify no protected 1.6 regression.

## Release decision

CI success alone does not authorize publication. Public Release v2.0 and the live updater target remain blocked until all required device checks pass and the owner explicitly authorizes publication.
