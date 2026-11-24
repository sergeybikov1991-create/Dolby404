# FLOUSTREAM Android 1.9 — media, messaging, voice and startup corrections

Branch: `feature/apk-1.9-android-media-voice-performance`
Base: Android 1.8 Debug branch at commit `3c9be1b875a6834a505064acad46981798f0370e`
Version: `1.9` (versionCode `109`; Debug application ID `com.floustream.android.debug`)
Build target: Debug only. No Release signing or publication is authorized.

## Scope approved by the owner

1. Correct photo full-screen positioning so the image stays inside the visible Android viewport.
2. Restore video previews and playback in chat; do not wait for a full video download before showing the player.
3. Restore the existing send arrow for text and queued media attachments.
4. Restore press-and-hold voice recording on the existing send arrow, with the native Android recorder.
5. Reduce interface delays caused by WebView media and IndexedDB cache work.

## Android-only implementation

- Apply Android system-bar insets to the WebView. The visible website viewport now excludes Android 15 status/navigation bars; custom fullscreen video continues to use the native fullscreen callback.
- Synchronize photo viewers with `visualViewport` and correct the photo viewer CSS inside the active route root, including Shadow DOM routes.
- For signed `message-media` video URLs, bypass the website's full-Blob prefetch path on Android. The site's existing fallback supplies the signed URL to the HTML video element so it can use progressive/range playback.
- Set video previews to preload enough data to decode a first frame, keep album previews muted/inline, and allow muted preview playback in WebView.
- Preserve the existing submit handler. A quick tap sends text or queued attachments; the long-press click is suppressed only after the hold threshold is reached. Pending attachments never start voice recording.
- Keep voice capture on the existing send arrow in Android. Hide the browser-only microphone control in the Android WebView and pass native M4A recordings through the existing attachment input/upload flow.
- Do not block successful Supabase responses on IndexedDB cache writes. Defer media-cache pruning and background image refresh work.
- The live website, website Main branch, Supabase schema/data, and immutable APK 2.0 baseline are out of scope and must remain unchanged.

## Verification gates

- [ ] Android unit tests pass.
- [ ] Debug 1.9 APK builds successfully.
- [ ] APK identity is `com.floustream.android.debug`, versionCode `109`, versionName `1.9-debug`.
- [ ] APK artifact is uploaded and its checksum is recorded.
- [ ] Android emulator startup smoke test passes.
- [ ] Emulator confirms progressive-video compatibility hook and photo-viewport synchronization are installed.
- [ ] Verify full-screen photo alignment on a real Android 15 device.
- [ ] Verify a chat video shows its first frame and plays without waiting for a full-file Blob download.
- [ ] Verify text messages and media-only messages send from the existing arrow.
- [ ] Verify hold-to-record, release-to-finish, preview, and send of a voice message.
- [ ] Verify startup, opening a conversation, and media rendering are materially faster without losing authentication or cache isolation.

A green build and emulator smoke test are necessary but do not by themselves prove real-device media behavior. Do not mark the owner-reported defects fully closed until the real-device checks are confirmed.
