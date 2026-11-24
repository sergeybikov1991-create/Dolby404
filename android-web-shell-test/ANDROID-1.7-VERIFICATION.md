# FLOUSTREAM Android 1.7 — implementation and verification

Source branch: `feature/apk-1.7-full-site-vk-integration`
Immutable lineage: APK 2.0 baseline `ff7313622a3a68bf961a6ee1ebec7fdbf71667cc`
Starting point: Android 1.6, versionCode 106
App version: `1.7` (`versionCode 107`)
Release status: Debug candidate only. No public Release until Debug is approved.

## Implementation scope

1. **Full live-site integration**
   - Keep the live FLOUSTREAM website as the single source of truth inside the native WebView.
   - Keep the website's current SPA route modules, lazy imports, route prefetching, and route performance metrics.
   - Keep website Main untouched; APK 1.7 consumes the published Main 0.9 site.

2. **VK-inspired SPA lifecycle integration**
   - Subscribe the Android shell to the website's `floustream:route-metric` event.
   - Re-apply Android-only capabilities when SPA routes mount, instead of relying only on full page loads.
   - Keep the native JavaScript bridge token-scoped and restricted to known FLOUSTREAM routes.

   - Reuse the existing route-module map, lazy module imports, route prefetching, and performance metrics already implemented by the website; do not replace the current frontend with a different framework.

7. **Video technology boundary**
   - The current website stores and plays MP4/WebM media; repository inspection found no HLS/DASH manifests or server-side FFmpeg/transcoding pipeline.
   - APK 1.7 preserves the website's current video upload, display, and playback behavior.
   - Adaptive multi-quality HLS/DASH transcoding requires a separate server-side processing service and storage/CDN contract. It is not silently introduced into this APK-only change or the shared Supabase backend.

3. **Shadow DOM support**
   - Resolve the chat composer inside the open ShadowRoot used by the SPA router.
   - Install the native hold-to-record voice-message behavior per composer instance, including when the user leaves and re-enters Messages.
   - Cancel an active native recording when the user leaves the Messages route.

4. **Camera and microphone permissions**
   - Allow only audio/video capture requests from the trusted FLOUSTREAM site origin and site path.
   - Request Android runtime permissions for the exact requested resources.
   - Continue denying permissions from external or untrusted origins.

5. **Correct post-login destination**
   - After Supabase confirms the saved session, the app's Continue action opens the website's `home.html` feed rather than the personal `profile.html` page.

6. **Preserved Android 1.6 features**
   - FCM push registration and notification handling.
   - Existing signed in-app updater and SHA-256 verification.
   - Voice-message native recorder and audio ownership lease.
   - Gallery Photo Picker, multi-select, camera capture, and file manager.
   - Fullscreen video and Android Back handling.
   - Per-account media/data cache and guest album request restrictions.
   - Existing FLOUSTREAM launcher icon and frameless chat media.

## Required verification before Release

- [ ] Android unit tests pass, including trusted-origin and SPA route policy tests.
- [ ] Debug APK builds as `com.floustream.android.debug`, versionName `1.7-debug`, versionCode `107`.
- [ ] Debug can be installed alongside the current Release app without replacing it.
- [ ] Debug Firebase configuration resolves the `.debug` application ID; FCM token registration and notification delivery are checked without changing the production Firebase configuration.
- [ ] Signed Release later builds as `com.floustream.android`, versionName `1.7`, versionCode `107`.
- [ ] Release signer matches the existing signing passport fingerprint.
- [ ] App opens the Main 0.9 website without browser chrome.
- [ ] Saved session opens the FLOUSTREAM home feed; sign-out and re-login remain correct.
- [ ] Navigate Home → Friends → Public profile → Messages → Music → Backgammon and back; route content remains visible and responsive.
- [ ] Native voice recording works after navigating to Messages through SPA navigation, not only after a cold page load.
- [ ] Switching chat targets while staying in Messages disposes the previous recorder and attaches the new composer safely.
- [ ] Leaving Messages during recording cancels capture and releases the microphone lease.
- [ ] Website camera opens in Android; photo capture and video capture work after runtime permission is granted.
- [ ] Microphone and camera requests from untrusted origins are denied.
- [ ] Gallery multi-select, external camera capture, generic file selection, and uploads remain functional.
- [ ] Voice messages record, send, display, play, stop, seek, and reset correctly.
- [ ] Fullscreen video, cache, guest restrictions, and FCM continue working.
- [ ] After publication, the installed Release app discovers 1.7, downloads it, verifies SHA-256, and offers Android installation through the in-app updater.
- [ ] Confirm the in-app update path on OnePlus 10T; do not use a direct APK install as a substitute for updater verification.

## Release gates

- Pushes to this branch build Debug and run unit tests only.
- A signed Release candidate is built manually only after Debug approval.
- Public GitHub Release `v1.7` is published only after explicit owner approval.
- APK 2.0 baseline and website Main remain unchanged.
