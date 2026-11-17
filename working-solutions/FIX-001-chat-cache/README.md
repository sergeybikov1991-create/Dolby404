# FIX-001 — Chat message cache

**Status:** previously confirmed by the user as working.

**Source of truth:** [MainActivity.kt](../source-snapshots/0.4.24-9f77be4/MainActivity.kt)

**Repository base commit:** 9f77be49273b7f0ee014c75cd27e06cf3fc50b8d

## Relevant code in the source snapshot

- Local cache file and read logic: approximately lines 342–366.
- writeCachedChatMessages: approximately lines 368–390.
- loadInboxThreads: approximately lines 1059–1163.
- Cache read when opening a chat: approximately lines 3795–3805.
- Cache writes after loading and loading older messages: approximately lines 3376 and 4062.

The complete source file is preserved because these functions share models and MainActivity state. This is an archived source snapshot, not a standalone patch.

## Verification

The user previously confirmed that chat history preloading into the local cache works. No fresh device runtime test was performed during this archival operation.
