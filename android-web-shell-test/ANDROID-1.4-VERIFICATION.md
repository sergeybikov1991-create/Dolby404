# FLOUSTREAM Android 1.4 — implementation and verification

Release gate: publish v1.4 only after all seven checks below pass independently on the signed Release build. Do not publish a partial candidate.

## Work items

1. **Fullscreen video** — WebChromeClient custom-view lifecycle, immersive system bars, Back handling, and restoration of the previous window state. Implementation is on the 1.4 branch; device verification is pending.
2. **Guest photo isolation** — hide photo surfaces and album entry points in guest mode; block `photo_album_photos` / `private_album_photos` and `photo-albums` / `private-albums` object requests in the Android WebView before they reach Supabase. Native gate now follows live Supabase sign-in/sign-out events through a token-scoped bridge rather than relying only on startup auth state. Four policy unit tests cover guest blocking, both album buckets, profile/post images, unrelated files, and authenticated access; device checks are pending.
3. **Frameless chat media** — Android WebView applies an Android-only override to the attachment bubble and media/file elements: border, outline, shadow, wrapper background, and padding are removed without touching the hosted site. Device verification is pending.
4. **Persistent media cache** — account-scoped WebView Cache API for images and video posters across pages; cache hits display immediately while the source is revalidated in the background. Video streams are not cached. Implementation is in progress; Cache Storage is now partitioned by active account and stale account caches are purged on account changes. Persistence, offline, and quota-behavior checks are pending.
5. **Smart cache synchronization** — server remains the source of truth; refresh changed records/media, reflect deletions, and provide the last saved data while offline. An account-scoped IndexedDB fallback now stores successful Supabase REST JSON GET responses, always tries the server first, and falls back to the last saved response on network failure/5xx; account switches purge other users' records. Immediate stale-first rendering plus background revalidation/UI refresh, deletion propagation, and offline device checks are still pending; do not treat this first fallback layer as completion.
6. **Voice messages** — native Android MediaRecorder (MPEG-4/AAC, .m4a, 44.1 kHz / 96 kbps) exposed to the trusted WebView chat page through a token-scoped bridge; Android RECORD_AUDIO permission; exclusive microphone lease copied from the 0.4.29 ownership model; recorded bytes return through a same-origin WebView resource and then use the existing attachment-input → message-media → direct_messages flow. Four coordinator unit tests pass; signed Release build and physical-device end-to-end checks remain pending.
7. **Gallery photo/video picker** — Android `PickVisualMedia` / `PickMultipleVisualMedia` now route accepted image/video inputs to the system Photo Picker; the choice sheet retains camera capture and the generic file manager. Device verification is pending.

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
