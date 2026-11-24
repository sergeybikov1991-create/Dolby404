# FLOUSTREAM APK 2.1 — Development Roadmap

Repository: `sergeybikov1991-create/Dolby404`  
Development branch: `feature/android-2.0-from-1.6`  
Base branch: `feature/android-1.6-compact-audio-launcher`  
Base commit: `0177bd27a827e48dd1e3982048443b6382228b5d`

## Non-negotiable boundaries

- Android 2.1 work happens only on `feature/android-2.0-from-1.6`.
- The base 1.6 branch and its published Release remain unchanged.
- Website `main`, Supabase production schema/data, and unrelated backgammon reference branches are out of scope.
- Keep the production application ID and persistent signing certificate unchanged for in-place updates.
- Debug uses a separate application ID and is for CI only; the user receives no Debug build as a substitute for Release.
- Never claim physical-device verification from CI alone.
- Do not publish a public Release before all automated and emulator release gates pass. The owner has approved publishing v2.1 through the in-app updater for physical-device acceptance; the 1.6 Release remains the rollback point until device checks pass.

## Phase 0 — Baseline and repository safety

- Verify the 1.6 source branch, exact commit, project layout, Gradle configuration, signing passport and updater.
- Create the dedicated 2.1 branch directly from the verified 1.6 commit.
- Record source provenance and preserve the original branch.
- Acceptance: source commit and branch ancestry are confirmed; the 2.1 branch is isolated.

## Phase 1 — Version and Release pipeline

- Set production identity to `com.floustream.android`, versionName `2.1`, versionCode `111`.
- Keep Debug isolated as `com.floustream.android.debug`.
- Build a signed Release candidate with the existing persistent certificate.
- Verify package identity, certificate fingerprint, APK checksum and updater manifest.
- Acceptance: CI produces a signed 2.1 Release from the exact recorded commit, verifies package identity and certificate, then publishes v2.1 only on the explicit `[publish-v2.1]` commit marker after all gates pass.

## Phase 2 — Preserve the 1.6 foundation

- Audit every protected 1.6 behavior before changing implementation.
- Preserve authentication/session continuity, chat and media behavior, voice-message recording/playback, gallery/camera integration, cache, launcher identity and updater.
- Add regression checks before changing protected components.
- Acceptance: no protected behavior is silently removed or replaced; all available automated checks pass.

## Phase 3 — New Android 2.1 internals

- Review the current Android/WebView boundaries and native integrations.
- Keep the website as the source of truth for site UI and account data.
- Keep native Android responsibilities behind narrow, origin-restricted interfaces.
- Design new native capabilities around explicit lifecycle ownership, permission handling, cancellation, recovery and testable contracts.
- Acceptance: architecture changes are isolated, documented and covered by automated tests before integration.

## Phase 4 — Authentication, media and lifecycle

- Verify registration/login, saved sessions, WebView routing, Back navigation and process/activity lifecycle. Supabase JS on the website is the sole session-refresh owner; native Android must not refresh or rewrite Supabase tokens.
- Verify gallery, camera, uploads, downloads, photo/video playback and fullscreen behavior.
- Verify cache persistence, duplicate prevention and network interruption/recovery.
- Acceptance: protected 1.6 flows remain reliable through normal app lifecycle and network changes.

## Phase 5 — Network resilience and security

- Review WebView origin restrictions, JavaScript bridge exposure, mixed content, file access and external navigation.
- Test slow, interrupted and restored connectivity.
- Verify native permissions are requested only when needed and resources are released on route changes and app shutdown.
- Acceptance: safe defaults and recovery behavior are documented and tested.

## Phase 6 — Final Release and rollback point

- Run unit, integration and applicable instrumentation checks on the exact candidate commit.
- Verify signed Release identity and certificate, SHA-256, updater manifest and in-place update path.
- Deliver the first v2.1 installation through the in-app updater and complete physical-device validation on OnePlus 10T / Android 15.
- Record commit, CI run, APK checksum, signing fingerprint, test evidence and rollback reference.
- Acceptance: after device validation passes, the user-approved signed APK 2.1 is archived as the new immutable Android baseline; APK 1.6 remains the rollback reference.
