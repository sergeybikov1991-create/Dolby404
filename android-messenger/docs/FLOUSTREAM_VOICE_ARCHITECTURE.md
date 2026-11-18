# FLOUSTREAM VOICE — architecture and integration contract

Status: architecture foundation in progress; not yet wired to production chat UI or model runtime.
Branch: `feature/floustream-voice-foundation`
Baseline: `release/floustream-0.4.28`

## Product behavior

FLOUSTREAM VOICE is a Russian-language conversational assistant with two user entry modes:
- push-to-talk button (first implementation);
- optional local wake phrase "Привет, Флоу" (later, explicit opt-in only).

The assistant is not a dictation-only feature. It must understand follow-up references ("ей", "последнее фото", "в этом чате") using an app-owned conversation context and must be able to navigate and operate chat features.

## Layered architecture

1. **Audio session coordinator** — exclusive lease for ASSISTANT, VOICE_MESSAGE, CALL and WAKE_WORD. A microphone consumer must fully stop/release before another obtains the lease.
2. **Audio capture** — mono PCM16 at 16 kHz in 100 ms frames. Capture starts only from a visible Activity after runtime permission is granted. No hidden background listening.
3. **STT adapter** — streaming recognizer interface; runtime/model are versioned separately. The AAR is pinned and checksum-verified in CI. Russian model weights are opt-in downloads, not embedded in APK.
4. **Dialogue/context engine** — keeps a bounded conversation context, current screen, selected conversation/contact/message, pending confirmation and recent search result identifiers. The app, not the LLM, owns authoritative IDs.
5. **Intent parser** — returns structured intent name + primitive arguments only. It has no direct Android, SQL, Supabase, filesystem or shell access.
6. **Command router** — allow-list maps intents to typed VoiceAction values and classifies them as safe, confirmation-required or rejected.
7. **Application action adapter** — the only layer allowed to call existing app/repository/use-case functions. It resolves names to IDs, validates ownership/permissions, and calls the existing chat/media/call APIs. It must not duplicate message persistence or attachment upload logic.
8. **Response/TTS adapter** — returns concise Russian status and speaks it. Assistant TTS output must not be fed back into STT; apply playback ducking/mute and a short post-TTS cooldown.

## Supported intent surface

### Conversations
- Open chats, contacts, media and unread list.
- Search/open/create conversation.
- Mark read/unread; pin/unpin; archive/unarchive; mute/unmute.
- The resolver must ask a disambiguating question if multiple contacts/conversations match.

### Messages
- Search messages globally or in the active conversation.
- Prepare a draft, send, reply, forward, edit, delete and react.
- Read/describe the selected message and play a voice message.
- Sending, reply, forwarding, editing and deletion require a confirmation step. Reactions can be safe only after the exact target message is resolved.

### Media and voice messages
- Open picker for photo/video/file; capture photo/video; open received attachment.
- Start/stop voice-message recording and send a selected attachment.
- The adapter must reuse the existing gallery URI, upload, cache and player pipelines. It must not reimplement them.
- Sending an attachment requires confirmation and an explicit target conversation.

### Calls
- Start audio/video call; accept/decline; toggle microphone/camera.
- Starting/accepting/declining a call requires confirmation where applicable.
- Call and assistant audio capture are mutually exclusive through the coordinator.

### App settings
- Settings changes are allow-listed by setting key and validated against known values. All changes require confirmation.

## Security invariants

- Never execute free-form model output as a command.
- Reject unknown intent names, missing IDs and malformed arguments.
- The model may provide a display-name query; only the app resolver can turn it into an authoritative ID.
- Never infer the recipient solely from a stale transcript. Context references must be bound to a current conversation/session and expire on navigation or session end.
- Confirmation is bound to the exact action payload and expires after timeout/navigation; changing any argument requires a new confirmation.
- Check current-user ownership and backend authorization again at execution time.
- Destructive actions and external side effects are never auto-confirmed.
- Keep audio, transcript and model files in app-private storage; do not upload microphone audio by default.

## Android lifecycle and microphone

- Initial push-to-talk is foreground Activity capture; it does not require a microphone foreground service.
- Wake phrase is deferred. Before implementing it, add explicit opt-in, persistent notification, Android microphone foreground-service type/permission, lifecycle handling and a battery-use explanation.
- Do not start microphone capture from boot or a background callback.
- Do not overlap assistant, voice-message recorder, WebRTC call or wake-word capture.
- Existing voice-message recording implementation remains a separate owner and is not replaced.

## Model/runtime policy

- sherpa-onnx runtime AAR: pinned to v1.13.5, official release SHA-256 verified in CI.
- Russian ASR weights: not selected for release until sample-rate compatibility, model license, Russian names/noise accuracy, WER/CER, latency, RAM and thermal behavior are measured on OnePlus 10T.
- Dialogue model: local-first candidate evaluation; GGUF model weights are downloaded only after user consent, with size, free-space check, license notice, checksum and cancellation.
- Android TextToSpeech is only considered offline if the selected installed Russian voice is verified offline on the device.
- No mandatory paid cloud API.

## Test gates

1. CI verifies AAR download digest, assembles debug APK and runs unit tests.
2. Unit tests cover every router intent, missing arguments, unknown intents and confirmation policy.
3. Integration tests prove action adapter delegates to existing chat/media repositories rather than parallel persistence paths.
4. Device test on OnePlus 10T / Android 15 covers permissions, interruptions, mic handoff, TTS feedback suppression, offline operation and memory/thermal metrics.
5. Existing chat cache, F attachment fan, voice messages, gallery photo/video upload and playback are regression gates.
6. No user-facing release until the voice UI, real STT/model, action adapter and updater-delivered release are verified.

## Current implementation boundary

Implemented foundation: state/action contract, allow-list router, PCM capture, exclusive audio lease, Android TTS wrapper, unit-test foundation, CI runtime pinning.
Not yet implemented: sherpa recognizer adapter, model download manager, LLM runtime, dialogue/context engine, production action adapter, voice UI, wake phrase.
