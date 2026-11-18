# FLOUSTREAM VOICE — architecture and integration contract

Status: typed voice pipeline foundation implemented and unit-tested in source; production UI, speech-model runtime and chat action adapter remain unintegrated.
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
4. **Dialogue/context engine** — `VoiceConversationContext` keeps current screen, active conversation/contact, selected/latest message and selected attachment. Context revisions invalidate stale follow-up references and confirmations. The app, not the LLM, owns authoritative IDs.
5. **Intent parser** — local dialogue model returns a strict JSON envelope with intent name + user-facing references (for example `active`, `last`, or a contact name), never database IDs. `VoiceIntentJsonDecoder` rejects unknown fields, non-string arguments, malformed keys, control characters and oversized output. It has no direct Android, SQL, Supabase, filesystem or shell access.
6. **Intent binder + command router** — `VoiceIntentBinder` resolves model references through `VoiceEntityResolver`, discards raw model-supplied ID fields, then the allow-list router maps bound intents to typed `VoiceAction` values and classifies them as safe, confirmation-required or rejected.
7. **Application action adapter** — `VoiceActionExecutor` is the only bridge allowed to call existing app/repository/use-case functions. Its production implementation must validate ownership/permissions and delegate to existing chat/media/call APIs. It must not duplicate message persistence or attachment upload logic.
8. **Dialogue engine + orchestrator + response/TTS adapter** — `VoiceAssistantEngine` sends final transcripts to a `VoiceDialogueEngine`, keeps a bounded history, and handles exact spoken confirmations/cancellations locally without asking the LLM. `VoiceAssistantOrchestrator` coordinates binding, routing, one-shot confirmation and executor dispatch. `StreamingSpeechRecognizer`, `SpeechRecognitionSession` and `VoiceSpeechOutput` define runtime boundaries.
9. **Foreground runtime controller** — `VoiceRuntimeController` checks microphone permission and Activity foreground state, owns push-to-talk capture/session lifecycle, accumulates final transcript segments, releases AudioRecord before TTS, and exposes a StateFlow for the UI.

## Supported intent surface

### Conversations
- Open chats, contacts, media and unread list.
- Search/open/create conversation.
- Mark read/unread; pin/unpin; archive/unarchive; mute/unmute; delete a conversation or clear its history (confirmation required).
- The resolver must ask a disambiguating question if multiple contacts/conversations match.

### Messages
- Search messages and photo/video/file attachments globally or in the active conversation.
- Read a selected message aloud.
- Prepare a draft, send, reply, forward, edit, delete and react.
- Read/describe the selected message and play a voice message.
- Sending, reply, forwarding, editing and deletion require a confirmation step. Reactions can be safe only after the exact target message is resolved.

### Media and voice messages
- Open picker for photo/video/file; capture photo/video; open received attachment.
- Start/stop voice-message recording and send a selected attachment.
- Save chat attachments into FLOUSTREAM site media, or share site media into a chat (both require confirmation).
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
- The LLM receives a display-only `VoiceDialogueContextView`; it never receives conversation, contact, message, attachment or site-media database IDs. It may provide a display-name/reference query; only the app resolver can turn it into an authoritative ID.
- Never infer the recipient solely from a stale transcript. Context references must be bound to a current conversation/session and expire on navigation or session end.
- `VoiceConfirmationGate` binds confirmation to the exact typed action and context revision; it is one-shot and expires after 30 seconds or navigation. Changing any argument requires a new confirmation.
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
- Russian streaming ASR prototype: sherpa-onnx T-one CTC 2025-09-08. Archive size 128,468,156 bytes; SHA-256 pinned in `RussianAsrModelInstaller`; sample rate is 8 kHz. The model is downloaded only after explicit user action and its LICENSE file is retained in app-private storage.
- T-one is not release-approved until ordinary-phone-microphone quality, Russian names/noise accuracy, WER/CER, latency, RAM and thermal behavior are measured on OnePlus 10T.
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

Implemented foundation: state/action contract, allow-list router, strict JSON intent decoder, local-LLM dialogue adapter boundary, ID-free dialogue context view, app-owned entity-reference binder, ephemeral conversation context, one-shot spoken confirmation/cancellation, bounded dialogue engine, foreground push-to-talk runtime controller, configurable PCM capture, exclusive audio lease, offline Android TTS adapter, sherpa-onnx v1.13.5 T-one recognizer adapter, checksum-verified opt-in model installer and unit tests.
Not yet implemented: concrete llama.cpp/other local LLM runtime and GGUF model installer, production VoiceEntityResolver and VoiceActionExecutor implementations, MainActivity/Compose UI integration, device-tested end-to-end operation, wake phrase.
