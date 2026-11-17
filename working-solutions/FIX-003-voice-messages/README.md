# FIX-003 — Voice messages

**Status:** previously confirmed by the user as working.

**Source of truth:** [MainActivity.kt](../source-snapshots/0.4.24-9f77be4/MainActivity.kt)

**Repository base commit:** 9f77be49273b7f0ee014c75cd27e06cf3fc50b8d

## Relevant code in the source snapshot

- Recording logic in DirectChatScreen: approximately lines 3420–3560.
- Uses MediaRecorder, AAC/MPEG-4, a temporary .m4a file, RECORD_AUDIO permission, recorder stop/release, Supabase Storage upload, and attachment sending.

The complete source file is preserved because recording is tied to screen state, permissions, coroutine scope, and attachment sending. This is an archived source snapshot, not a standalone patch.

## Verification

The user previously confirmed that voice messages work. No fresh device runtime test was performed during this archival operation.
