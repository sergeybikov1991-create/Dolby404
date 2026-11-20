# Phase 0 — APK 2.0 Baseline Audit

Branch under test: `APK-2.0`  
Scope: isolated `android-web-shell-test` module only.

## Verified repository state
- [x] Branch name and HEAD verified before this audit.
- [x] Test module is separate from the production messenger.
- [x] Test application ID is `com.floustream.webshelltest`; debug suffix is `.debug`.
- [x] The test page is loaded from local Android assets; the FLOUSTREAM website is not connected.
- [x] GitHub Actions workflow supports manual dispatch and pushes affecting this module or its workflow.
- [x] Java target is 17; compile SDK is 36; target SDK is 35; min SDK is 26.

## Source review notes
- WebView JavaScript and DOM storage are enabled for the local test page.
- Multiple windows and JavaScript-triggered window opening are disabled.
- Cleartext traffic is disabled in the manifest.
- Internet permission is present for the HTTPS connectivity test.
- Web contents debugging is enabled only in debug builds.
- The current Activity uses the legacy `onBackPressed()` override. This is acceptable for this isolated smoke-test baseline, but should be modernized before the production shell is designed.
- No camera, microphone, file chooser, upload bridge, or production-domain JavaScript bridge is present at this stage.

## Build verification
A successful build from another branch is not evidence that `APK-2.0` builds. The workflow run triggered by this audit commit must complete successfully on `APK-2.0` before Phase 0 is marked complete.

## Device verification remains pending
CI success does not prove behavior on a physical phone. Phase 1 requires installing the APK built from this branch on the OnePlus 10T / Android 15 and completing the device checklist in `README.md`.

## Phase 0 exit criteria
- [ ] GitHub Actions build on `APK-2.0` succeeds.
- [ ] Artifact is uploaded from that exact run.
- [ ] Physical-device testing is handed off as Phase 1.
