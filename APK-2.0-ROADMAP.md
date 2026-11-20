# FLOUSTREAM APK 2.0 — Development Roadmap

Target branch: `APK-2.0`  
Repository: `sergeybikov1991-create/Dolby404`

## Working rules

- All APK 2.0 work happens only on `APK-2.0`.
- Keep the website, Android messenger, and backgammon reference separate.
- Preserve the isolated WebView test app until device testing is complete.
- Do not connect the production FLOUSTREAM website before the WebView test passes on a real Android device.
- Make changes in small, reviewable stages; build and verify each stage before moving on.
- Prefer current Android platform APIs and official documentation; validate community recommendations against primary sources.
- Never claim device verification based only on a successful CI build.

## Phases and acceptance criteria

### Phase 0 — Baseline and repository safety
- Verify this branch, its starting commit, project layout, Gradle configuration, and CI workflow.
- Confirm the test app remains isolated from production apps.
- Acceptance: branch and project structure are verified; a build can be run from this branch.

### Phase 1 — WebView engine test on a physical device
- Install the test APK on the OnePlus 10T (Android 15).
- Test scrolling, fixed/moving backgrounds, viewport sizing, links, Back navigation, reload, rotation, app pause/resume, and long-session stability.
- Acceptance: no blocking layout/navigation issues on the device.

### Phase 2 — Connect the FLOUSTREAM website
- Configure the production site origin and navigation allowlist.
- Verify home page, internal routes, responsive layout, and error/offline states.
- Acceptance: core site pages work inside the shell without breaking external-link handling.

### Phase 3 — Authentication and session continuity
- Test registration, sign-in, sign-out, password recovery, cookies, and session persistence after app restart.
- Acceptance: account flows work end-to-end and sessions behave predictably.

### Phase 4 — Media and Android permissions
- Test image/video display and playback, file selection, downloads, gallery access, camera, and permission denial/retry paths.
- Acceptance: supported media flows work on the device and permissions are requested only when needed.

### Phase 5 — Android integration
- Verify Back behavior, external links, keyboard and input fields, file chooser, downloads, fullscreen media, orientation, status/navigation bars, and lifecycle handling.
- Acceptance: common Android interactions behave consistently.

### Phase 6 — Network resilience and security
- Test slow, interrupted, and restored connectivity.
- Review WebView settings, navigation restrictions, mixed content policy, JavaScript bridge exposure, file access, and origin validation.
- Acceptance: safe defaults are documented and network failures recover cleanly.

### Phase 7 — FLOUSTREAM visual identity
- Apply app name, launcher icon, splash/startup presentation, and approved visual styling.
- Check multiple screen sizes and display densities.
- Acceptance: the shell looks and feels like FLOUSTREAM without harming site layout.

### Phase 8 — Release and update pipeline
- Configure release signing, versioning, artifact naming, and update delivery.
- Test clean install and in-place update; verify that login/session state is retained where expected.
- Acceptance: signed release installs and updates reliably.

### Phase 9 — Final acceptance and rollback point
- Run the complete install-to-daily-use checklist on a physical device.
- Record tested commit, APK checksum, CI run, known limitations, and rollback reference.
- Acceptance: user-approved stable build is archived as the APK 2.0 baseline.

## Current known starting point

The isolated WebView test project is under `android-web-shell-test/`. It uses Android System WebView with a local test page; the FLOUSTREAM website is not connected yet. The existing successful artifact was built from the earlier branch `feature/floustream-android-web-shell`; it must not be described as a build produced from `APK-2.0`.
