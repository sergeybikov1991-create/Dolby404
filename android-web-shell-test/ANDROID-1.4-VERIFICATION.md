# FLOUSTREAM Android 1.4 — implementation and verification

Release gate: publish v1.4 only after all seven checks below pass independently on the signed Release build. Do not publish a partial candidate.

## Work items

1. **Fullscreen video** — WebChromeClient custom-view lifecycle, immersive system bars, Back handling, and restoration of the previous window state. Implementation is on the 1.4 branch; device verification is pending.
2. **Guest photo isolation** — hide photo surfaces and album entry points in guest mode; block album-table and photo-object requests in the Android WebView before they reach Supabase. Implementation is on the 1.4 branch; guest/authenticated device checks are pending.
3. **Frameless chat media** — Android-only style override removes media borders, outlines, shadows, and the attachment bubble frame without changing the website. Implementation is on the 1.4 branch; device verification is pending.
4. **Persistent media cache** — account-scoped WebView Cache API for images and video posters across pages; cache hits display immediately while the source is revalidated in the background. Video streams are not cached. Implementation is in progress; persistence, account isolation, and offline checks are pending.
5. **Smart cache synchronization** — server remains the source of truth; refresh changed records/media, reflect deletions, and provide the last saved data while offline. Implementation and acceptance testing are still in progress; do not treat the media cache alone as completion.
6. **Voice messages** — native Android MediaRecorder (MPEG-4/AAC, .m4a, 44.1 kHz / 96 kbps) exposed to the trusted WebView chat page through a token-scoped bridge; Android RECORD_AUDIO permission; exclusive microphone lease copied from the 0.4.29 ownership model; recorded bytes return through a same-origin WebView resource and then use the existing attachment-input → message-media → direct_messages flow. Four coordinator unit tests pass; signed Release build and physical-device end-to-end checks remain pending.
7. **Gallery photo/video picker** — Android Photo Picker for images and videos, with a separate route to the existing file manager; existing capture/file flows must remain available. Implementation is on the 1.4 branch; device verification is pending.

## Independent release checks

- [ ] 1. Fullscreen video enters/exits correctly, including Back, rotation, and restored system bars.
- [ ] 2. Guest sees no photos or photo albums; no album/photo requests are fetched. Authenticated users retain allowed access.
- [ ] 3. Photo, video, and audio attachments have no decorative borders or wrapper frames.
- [ ] 4. Images/posters persist after force-stop/restart; cache is separated by account; videos themselves are not cached.
- [ ] 5. Online updates and deletions are reflected; offline view shows the last saved data; reconnect refreshes from the server.
- [ ] 6. Voice record, stop, upload, message display, and playback work end-to-end; microphone denial is handled cleanly.
- [ ] 7. Photo Picker selects images/videos; file manager and camera capture still work.

## Protected sources

- APK 2.0 baseline commit remains immutable.
- Website `main` branch remains untouched.
- No public `v1.4` release until every check above is green.
