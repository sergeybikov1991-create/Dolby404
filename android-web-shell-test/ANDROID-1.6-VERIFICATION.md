# FLOUSTREAM Android 1.6 — verification checklist

Source branch: `feature/android-1.6-compact-audio-launcher`
Base: `feature/android-1.5-repair-from-1.4`
App version: `1.6` (`versionCode 106`)
Release status: candidate only; publish only after CI and OnePlus 10T verification.

## Changes in 1.6

1. **Launcher icon**
   - Connect `@mipmap/ic_launcher` and `@mipmap/ic_launcher_round` in the Android application manifest.
   - Keep the existing original-derived lowercase neon `f` artwork and existing icon generator unchanged.

2. **Voice-message playback**
   - Replace the large browser-native audio controls in Android chat with a compact inline player.
   - One play button toggles to stop; pressing it again pauses and resets playback to the beginning.
   - Playback completion automatically stops and resets the player.
   - A thin seek track and elapsed time remain visible.
   - Only one voice message plays at a time.
   - Recording and sending remain on the existing press-and-hold send button; no separate microphone control.

3. **Chat media presentation**
   - Keep photo/video/audio/file message bubble border, outline and shadow at 0.
   - Keep media bubble padding at 0; photo and video elements have no border or frame.

4. **Preserved behavior**
   - Retain guest album restrictions, video preview behavior, persistent per-account media cache, gallery attachments and existing audio recording/upload flow from 1.5.

## Required checks before release

- [ ] CI unit tests pass.
- [ ] Debug and signed Release APK builds pass.
- [ ] APK identity is `com.floustream.android`, versionCode 106, versionName 1.6.
- [ ] APK signature matches the release passport.
- [ ] Launcher icon appears on the Android home screen and app drawer as the original lowercase neon `f`.
- [ ] Hold existing send button, record, release, upload and send a voice message.
- [ ] Voice message renders as a compact player with play/stop toggle, seek track and elapsed time.
- [ ] Tapping stop resets playback; natural completion also resets and returns to play.
- [ ] Starting another voice message stops and resets the previous one.
- [ ] Photos and videos in chat show 0 px borders/frames and no visible bubble outline.
- [ ] Video preview, gallery sending, persistent cache, sign-in and guest restrictions continue to work.
- [ ] In-app updater detects 1.6, verifies SHA-256, downloads and offers installation.
- [ ] User validates the signed Release update on OnePlus 10T before public publication.

## Release

The workflow produces a signed Release candidate and updater manifest for v1.6. Public GitHub Release publication remains gated until the candidate passes CI and device checks.
