# FLOUSTREAM — Working solutions

Reference archive of user-confirmed working behavior. Each solution receives a permanent feature ID and its own folder. Do not overwrite older references; add a new FIX folder for later revisions.

## Source baseline

- Repository: https://github.com/sergeybikov1991-create/Dolby404
- Branch: working-solutions
- Source commit: 9f77be49273b7f0ee014c75cd27e06cf3fc50b8d
- Version-neutral snapshot: [MainActivity.kt](source-snapshots/baseline-9f77be4/MainActivity.kt)

The commit SHA is technical provenance only. Folder names and solution identities do not depend on app release numbers. This historical source snapshot is not a version lock or a compatibility constraint for future releases.

## Archived solutions

- [FIX-001 — Chat message cache](FIX-001-chat-cache/README.md)
- [FIX-002 — F media button](FIX-002-f-button/README.md)
- [FIX-003 — Voice messages](FIX-003-voice-messages/README.md)
- [FIX-004 — Global activation](FIX-004-global-activation/README.md)
- [FIX-005 — Video from the media fan](FIX-005-video-from-fan/README.md)
- [FIX-006 — Chat photo sizing](FIX-006-chat-photo-sizing/README.md)
- [FIX-007 — Delivery and read receipts](FIX-007-message-receipts/README.md)
- [FIX-008 — Photo capture from the media fan](FIX-008-photo-from-fan/README.md)

## Evidence and release safety

The status of each feature records the user's confirmation. It does not claim a fresh device test during an archival operation. For FIX-004 through FIX-007, the exact implementation source still needs to be pinned to its originating commit before reuse or modification. Before using any solution in a release, compare the current source with the preserved baseline and run regression tests. Never copy an old app release number into a new release configuration.
