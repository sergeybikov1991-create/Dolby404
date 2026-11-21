# FLOUSTREAM Android 1.5 — verification checklist

Source branch: `feature/android-1.5-repair-from-1.4`
Starting point: Android 1.4 source commit `bbf4b5dfea25dec4d59094833d23e020c2687e91`
App version: `1.5` (`versionCode 105`)
Release status: candidate only; do not publish until CI and device checks pass.

## Fixes in this candidate

1. **Guest album privacy**
   - Supabase RLS now restricts photo/video album rows and Storage objects to permanent signed-in users.
   - Anonymous Auth sessions are explicitly excluded using the `is_anonymous` JWT claim.
   - Existing public-avatar access remains separate.
   - Android request filtering covers photo/video album REST endpoints and Storage object endpoints, including signed-URL endpoints where the URL ends at the bucket name.

2. **Voice messages**
   - Removed the extra microphone control.
   - Recording is press-and-hold on the existing send button; releasing sends the voice message through the existing attachment flow.
   - Android requests `RECORD_AUDIO` directly. The WebView no longer opens and immediately closes a temporary `getUserMedia` stream before native `MediaRecorder` starts.
   - Native recorder startup errors are surfaced for diagnosis.

3. **Media borders**
   - Media bubbles are explicitly marked and styled with zero border, outline, shadow and padding.
   - The decorator handles both existing media and elements added after chat rendering.

4. **Video previews**
   - Video preload is raised to `auto`.
   - The app attempts to capture the first decoded frame as a poster; a neutral FLOUSTREAM poster is used while the frame is loading or if browser CORS prevents capture.

5. **Media cache**
   - Existing per-account persistent media cache implementation is retained unchanged.
   - Existing image cache and account partitioning behavior must be regression-tested.

## Required verification before release

- [ ] CI unit tests pass.
- [ ] Debug and signed Release APK builds pass.
- [ ] APK package is `com.floustream.android`, versionCode 105, versionName 1.5.
- [ ] Release certificate matches the release passport.
- [ ] Guest session cannot list or download another user's photo/video album via UI, REST request, signed URL creation, or direct Storage object URL.
- [ ] Permanent signed-in user can still access their own album and other users' album sections according to profile visibility settings.
- [ ] Public profile avatars continue to load.
- [ ] Voice message: hold send, grant permission, record, release, upload, display, play back.
- [ ] Voice message recording works after cancelling a previous attempt and after returning from Android permission dialog.
- [ ] Photo and video message media have no visible borders or frames.
- [ ] Video message preview resolves automatically to a real first-frame poster; tap still plays video.
- [ ] Previously cached photos load without repeated downloads; sign-out/account switch does not leak another account's cached media.
- [ ] In-app updater discovers 1.5, verifies SHA-256, downloads and offers installation.
- [ ] User verifies the Release update on the OnePlus 10T before calling 1.5 complete.

## Server migration

Applied to Supabase project `qhpobdktlbhdqsnajypr` as migration:
`restrict_album_media_to_permanent_users`.

The SQL source is stored at:
`supabase/migrations/20261121222942_restrict_album_media_to_permanent_users.sql`.

Previously issued signed URLs may remain usable until their own expiry; newly generated URLs and new object reads are governed by the updated policies.