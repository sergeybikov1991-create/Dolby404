# FLOUSTREAM app-wide voice assistant — implementation audit

## Current verified architecture (base: feature/floustream-voice-activation-0430)

- `MainActivity.onStart()` resumes `WakeWordForegroundService` when the saved hands-free preference is enabled, microphone permission is granted, the wake-word model is installed, and the audio coordinator is idle.
- `WakeWordForegroundService.ACTION_WAKE_DETECTED` is received by the activity and forwarded as `wakeWordPending` through `MessengerApp` and `MessengerHome`.
- The actual `AndroidOnDeviceVoiceController`, `VoiceAssistantEngine`, speech output, wake-word event consumer, and wake-word re-arm effects currently live inside `RealConversationScreen`.
- The conversation-specific executor closes over chat-only Compose state and callbacks (message list, draft, attachment picker, camera, recording, selected message, current peer). Moving this block verbatim to the home screen would break scope and could silently route chat actions against stale or missing context.
- `VoiceConversationContext` already supports screen values: UNKNOWN, CHATS, CONVERSATION, CONTACTS, MEDIA, SETTINGS.
- `VoiceAudioSessionCoordinator` is the existing shared microphone ownership boundary and must remain authoritative.

## Required refactor — do not move chat executor blindly

### Phase A — app-level runtime shell
1. Add an app-scoped runtime owner at `MessengerHome` (or a lifecycle-aware owner retained by the activity) for wake-word event consumption, speech controller lifecycle, TTS, and re-arm policy.
2. Keep the activity receiver as the sole bridge from foreground service to Compose state. Consume each wake event once; clear it on success, cancellation, or a surfaced error so it cannot retrigger on recomposition.
3. Build a current-screen context provider from navigation state. When no conversation is open, pass `VoiceScreen.CHATS` (or CONTACTS/MEDIA/SETTINGS as appropriate) with conversation/message IDs null.
4. Ensure only one speech controller instance owns the microphone at a time. Close/release on lifecycle destruction and stop listening before navigation changes that require microphone ownership.

### Phase B — split command execution by scope
1. Extract chat-bound actions into a conversation command handler that receives a validated active conversation context and delegates to existing repositories/use-cases.
2. Add a home/navigation handler for safe app-wide commands (navigate to chats, contacts, media, settings; open a resolved contact/conversation; search conversations).
3. Compose the handlers behind one app-level `VoiceActionExecutor`. Commands requiring a conversation must ask which conversation when no active conversation exists; never infer or fabricate an ID.
4. Preserve the existing `VoiceIntentBinder`, `VoiceCommandRouter`, confirmation gate, and safe ID resolution. Do not create parallel Supabase persistence paths.

### Phase C — microphone and hands-free policy
1. Keep wake-word detection, command recognition, TTS, voice-message recording, and calls mutually exclusive through `VoiceAudioSessionCoordinator`.
2. Suspend wake-word capture before command recognition and TTS; re-arm only after speech output has completed, the app is resumed, hands-free is enabled, permission/model are ready, and the coordinator is idle.
3. Avoid duplicate start requests from both activity lifecycle and Compose effects; centralize the policy in one owner.
4. Do not attempt to launch the UI from a background microphone service in violation of Android background activity launch restrictions. For a fully closed app, validate the supported notification / user-visible activation flow separately.

## Acceptance tests
- Wake phrase while on Chats, Contacts, Media, Settings, and inside a conversation.
- Home-level navigation commands work without an active conversation.
- Chat-specific commands with no active conversation ask a clarification and do not execute.
- Opening a named conversation resolves the contact through app-owned data, not model-supplied IDs.
- Wake-word does not restart during TTS, voice-message recording, or calls.
- Re-arm occurs once after the assistant turn; no duplicate recognizer/service starts.
- Permission denied, model absent/downloading, recognizer unavailable, process recreation, and rapid screen navigation are handled without crash or microphone leak.
- Debug build and unit/instrumentation tests pass before Release; Release must be delivered through the in-app updater and verified on OnePlus 10T / Android 15.

## Scope protection
Do not modify the chat cache/preload behavior, gallery/media sending, attachment rendering/player, F fan menu, or voice-message playback fixes during this refactor. Keep the change isolated to voice runtime and routing.
