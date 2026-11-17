# FLOUSTREAM — release guardrails

These rules are mandatory for every release candidate. A release is not considered ready merely because CI produced an APK.

## 1. FIX.zip is the approved implementation library

- Add an implementation to FIX.zip only after the owner explicitly says: **"Фиксируй в ZIP"**.
- Do not add experiments, partial work, unapproved code, or merely CI-passing changes.
- Never edit or overwrite a previously fixed snapshot. A later implementation gets a new versioned folder.
- Every fixed item must include a passport: purpose, exact source paths, app version, source commit, SHA-256 hashes, validation performed, device/OS, and known limitations.
- Before changing a feature, inspect the current FIX index and the relevant fixed snapshot. Reuse/copy the approved implementation rather than recreating it.
- If FIX is unavailable or its contents cannot be inspected, stop and report that; do not pretend the comparison happened.

## 2. Protect existing behavior

- Treat all approved FIX snapshots and previously working release behavior as regression-protected.
- Keep changes isolated; do not refactor unrelated working code.
- Any intentional change to a protected implementation must be called out explicitly and separately validated.
- If a protected feature regresses, block the release and restore/reconcile against its approved snapshot.

## 3. Source-to-release provenance and integrity

For each candidate:
- Record the exact source commit SHA, branch/tag, versionName, and versionCode.
- Build from that exact commit; do not build from a moving branch after recording the SHA.
- Compare the candidate source against each relevant FIX snapshot at file level. Confirm protected files are unchanged, or document and test each intentional difference.
- Record SHA-256 for the source snapshot, APK, and each fixed source file (or a deterministic manifest of them).
- Verify the APK signature and the APK checksum independently.
- Do not claim that an APK hash proves source equivalence. Source commit provenance, file-level comparison, and artifact checksums are separate checks.

## 4. Mandatory regression matrix

Run tests for every affected feature and every relevant protected feature, not only the new feature:
- App launch, sign-in/session refresh, user search, inbox, opening conversations, sending/receiving messages.
- Photo preview and image loading/cache.
- Video from gallery, round camera, albums, and forwarding; one upload must produce one remote object and one chat message, never fragmented chat messages.
- Video upload progress, leaving the chat/app, process restart, network loss/recovery, retry/resume, duplicate prevention, and final local cleanup.
- Chat cache persistence and media playback/cache.
- Media fan button and animation.
- In-app update discovery, checksum/signature validation, download, install handoff.
- Push notifications and foreground/background transitions.
- Android 15 behavior and foreground-service/WorkManager limits.

Record pass/fail, device, Android version, network/operator, and evidence. A skipped test is not a pass.

## 5. Release gates

A candidate may be offered for device testing only after:
- Debug CI passes.
- Signed release build and signature verification pass.
- Relevant unit/instrumentation checks pass.
- FIX comparison and regression report are complete.
- No known critical CI errors remain.

A public release may be published only after:
- Owner's physical device test passes on the target device/OS.
- Real video upload and interruption/resume tests pass on the target network.
- Protected features pass regression testing.
- Release notes, APK checksum, signature, and in-app updater path are verified.
- Owner explicitly authorizes publication.

Never merge a pull request, publish a GitHub Release, or replace the in-app update target without explicit authorization.

## 6. Candidate status

CI success means only that the tested build steps passed. It does not establish real-device behavior, network compatibility, or release readiness. Label candidates honestly and list all remaining tests.
