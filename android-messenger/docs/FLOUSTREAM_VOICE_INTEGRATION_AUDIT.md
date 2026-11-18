# FLOUSTREAM VOICE — integration audit

Date: 2026-11-18
Target base: `release/floustream-0.4.30`
Working branch: `feature/floustream-voice-activation-0430`

## User-facing requirements

- Voice-first control: do not add a new microphone button to the chat composer.
- Wake phrase must be able to invoke FLOUSTREAM when the app is not currently open.
- Russian speech, spoken replies, and app commands.
- No mandatory paid cloud API; prefer local/offline processing.
- Keep chat cache, composer attachment fan, gallery photo/video sending and playback unchanged.
- Existing voice-message recording remains a separate feature and must not be repurposed.

## Source audit findings

1. `feature/floustream-voice-foundation` is based on `release/floustream-0.4.28`; it is not a safe direct merge into the current `0.4.30` line. It adds a large MainActivity diff and chat-composer voice UI.
2. Its `AndroidOnDeviceVoiceController` uses Android `SpeechRecognizer` with `EXTRA_PREFER_OFFLINE`. That depends on the device's installed on-device Russian recognizer; it is not the sherpa-onnx/T-one implementation described elsewhere in the plan.
3. The foundation branch's documentation mentions a sherpa runtime and model installer, but those source files are not present at the documented paths in that branch. Treat those claims as unverified until the source is restored and built.
4. `feature/floustream-global-voice-controls` adds a Vosk phrase detector, phrase matcher and lifecycle policy, but its diff removes the foundation branch's `VoiceRuntimeController`, T-one installer/recognizer and related tests. It does not provide a complete background service or a complete default-assistant integration.
5. The Vosk detector requires a separately installed model directory and PCM16 mono 16 kHz audio. The branch does not yet implement the complete model download, persistent service, lifecycle, invocation-to-command handoff or settings opt-in flow.
6. The existing voice-composer control in the foundation branch conflicts with the user's voice-first requirement and must not be copied into the chat composer.

## Android platform constraint

Android's `VoiceInteractionService` is kept alive by the system when selected as the user's active assistant. However, the Android documentation describes software hotword capture through protected system-only APIs/permissions for bundled applications. A normal third-party app must not assume it can use the system hotword audio path. A user-visible microphone foreground service is a separate fallback, but its start, notification, background activity-launch and OEM behavior must be validated on the target OnePlus device.

References:
- https://developer.android.com/reference/android/service/voice/VoiceInteractionService
- https://source.android.com/docs/automotive/voice/voice_interaction_guide/app_development
- https://developer.android.com/develop/background-work/services/fgs/service-types
- https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start

## Safe implementation order

1. Run the existing Android debug build and unit tests on this clean 0.4.30-based branch; record the baseline before touching app code.
2. Prototype wake-word feasibility on OnePlus 10T / Android 15, including whether the selected-assistant route is available to a third-party app and whether the user-visible foreground-service fallback can satisfy invocation.
3. Keep wake-word detection, command recognition and call/voice-message recording behind one exclusive microphone ownership coordinator. Release the detector fully before command recognition or calls.
4. Implement the chosen, policy-compliant activation path and settings opt-in. Do not add a chat-composer microphone button.
5. Only then port the typed command router and safe action confirmation flow, adapting to the current 0.4.30 MainActivity without replacing chat/media code.
6. Add local speech model/runtime only after verifying Android ARM64 build, Russian quality, model/runtime licenses, download integrity, memory, heat and battery.
7. Require green CI, regression tests and on-device validation before any in-app release.

## Release rule

This branch is development-only. Do not merge it into `main` or publish an APK until the voice feature is verified and the existing chat/media behavior remains intact.
