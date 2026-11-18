# FLOUSTREAM Voice Assistant — Phase 1

## Product decision

Phase 1 is a reliable voice command interface, not a general-purpose AI chatbot.

- No Qwen, llama.cpp, cloud LLM, paid API, subscription, or server inference.
- Natural-language command handling is deterministic Kotlin code with a strict supported-command list.
- Unknown or ambiguous phrases must ask the user to repeat/clarify; never guess.
- Android TextToSpeech is used for spoken replies.
- Push-to-talk is the first activation mode. Wake phrase is postponed until foreground operation is stable.
- Navigation and search may execute immediately. Sending, deleting, forwarding, calling, and settings changes require explicit confirmation.

## Runtime pipeline

1. User presses and holds the microphone button.
2. The app acquires the exclusive microphone lease.
3. Local speech recognition returns partial/final Russian text.
4. RuleBasedVoiceDialogueEngine maps supported phrases to typed intents.
5. VoiceIntentBinder resolves names/references to app-owned IDs.
6. VoiceCommandRouter checks the allow-list and confirmation policy.
7. VoiceActionExecutor calls existing FLOUSTREAM use-cases.
8. Android TTS speaks the result after the microphone is released.

The language model adapter is optional future work and is not part of Phase 1.

## ASR strategy

First choice: Android's system on-device SpeechRecognizer on Android 12+.

- No FLOUSTREAM model download or extra model storage when the Russian on-device language pack is already installed.
- The app explicitly requests the on-device recognizer and Russian (ru-RU); it does not silently fall back to a network recognizer.
- The system may report that Russian is unsupported or its language pack is not installed. The app must explain this clearly.
- TTS is also Android system TextToSpeech, restricted to an installed offline Russian voice.

Fallback candidate if the system Russian pack is unavailable: sherpa-onnx streaming Zipformer small Russian Vosk-derived model, int8.

- Approximate model directory size: 29.3 MB.
- Streaming Russian recognition at 16 kHz.
- Apache-2.0 upstream model license.
- Model repository revision pinned in research: `d026150674759018524aad6dd585b8e1b65b2fc5`.
- Model card: https://huggingface.co/alphacep/vosk-model-small-streaming-ru
- sherpa-onnx converted model: https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-small-ru-vosk-int8-2025-08-16
- Kotlin API uses OnlineTransducerModelConfig with Zipformer2, BPE vocabulary, and tokens.

The existing T-one CTC model is about 138 MB and expects 8 kHz. It is not the default path. Do not replace the current installer until model files, hashes, license, and download behavior are verified.

## Initial supported commands

- Open chats, contacts, media, unread conversations.
- Open/search a conversation by contact name.
- Search messages and photos/videos.
- Capture a photo/video or pick an attachment.
- Start/stop a voice-message recording.
- Reply to the latest message.
- Start audio/video calls by contact name (confirmation required).

This is intentionally a limited first command vocabulary. Extend it only with tests for each new phrase and action.

## Integration gates before a phone test build

- Implement the production VoiceEntityResolver against existing chat/contact/media repositories.
- Implement VoiceActionExecutor by delegating to existing app operations; do not create parallel message/media paths.
- Wire VoiceRuntimeController and push-to-talk UI into the existing conversation screen.
- Confirm microphone lease exclusion against voice messages, video messages, and calls.
- Run Gradle build and unit tests on the exact final commit.
- Test on OnePlus 10T / Android 15 for recognition quality, latency, TTS, permissions, lifecycle, and battery behavior.
- No release APK until the in-app updater path is verified and the user has tested the build.

## Current implementation status

- Typed voice contracts, allow-list router, resolver boundary, confirmation gate, conversation context, audio lease coordinator, PCM capture, and TTS adapter exist.
- A deterministic Russian rule-based command parser and unit tests have been added.
- VoiceAssistantEngine now has a no-LLM constructor that uses the deterministic parser.
- An Android system on-device SpeechRecognizer controller has been added; it uses the system Russian language pack, holds the exclusive microphone lease, and releases the microphone before TTS.
- MainActivity now wires AndroidOnDeviceVoiceController into the conversation composer with a microphone button.
- The initial production resolver searches FLOUSTREAM profile display names/usernames and resolves message references only from app-owned conversation state.
- The initial action executor delegates to existing navigation, message sending, message search, media picker, camera, and video recorder flows. Message sends/replies and calls remain confirmation-gated by the router; calls are not yet implemented by the app executor.
- Push-to-talk is foreground-only. Listening is cancelled when the conversation pauses; no background microphone or wake phrase is enabled.
- The Android system service and Russian language-pack availability have not yet been checked on the OnePlus 10T.
- CI run #452 succeeded for commit `8975687a9247fbdf8fa3f2783cfbc76118811ea1`, before the rule-based parser commits. The parser commits have not yet had a confirmed CI run; do not describe them as tested or release-ready.
