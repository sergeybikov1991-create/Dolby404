# FLOUSTREAM VOICE — Android field notes

Checked: 2026-11-18. These notes capture implementation risks found in current Android documentation and developer discussions. Forum reports are field evidence, not platform guarantees.

## Microphone ownership is exclusive

A recent r/androiddev engineering report about handing off a wake-word engine to a WebRTC call describes AudioRecord and WebRTC capture competing for the same microphone, including silent audio loss and delayed native-resource release.

For FLOUSTREAM:
- Phase 1 remains push-to-talk only.
- Do not run wake-word detection alongside voice-message recording or a call.
- When wake-word support is eventually added, stop the detector and wait for its capture pipeline to finish releasing the device before starting call capture. Do not treat a fixed 200 ms sleep from one forum report as a universal guarantee; prefer an explicit stopped/released state and test across devices.
- Add a cooldown after assistant speech before re-arming wake-word detection, to avoid the assistant hearing its own TTS output.

Community discussion:
https://www.reddit.com/r/androiddev/comments/1tr5ww3/what_we_learned_about_androids_audiorecord_while/

## Android 14/15 background microphone constraints

Current Android documentation states that microphone foreground services require the microphone service type, FOREGROUND_SERVICE_MICROPHONE, and granted RECORD_AUDIO. Because microphone permission is while-in-use, such a service generally must be started while the app has a visible activity; it cannot simply be started from the background or at boot.

For FLOUSTREAM:
- Do not promise always-listening from a normal background process.
- Wake phrase activation must be an explicit opt-in and start from a visible user action, with a foreground-service notification and clear microphone indicator.
- Keep wake-word activation as a later milestone, after the push-to-talk assistant is stable.
- Re-check target SDK and current Android policy before implementation.

Official references:
https://developer.android.com/develop/background-work/services/fgs/service-types
https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
https://developer.android.com/about/versions/15/changes/foreground-service-types

## sherpa-onnx integration direction

The upstream project currently documents Android support, Kotlin/Java APIs, streaming ASR, TTS, VAD and keyword spotting, and publishes Android example apps including streaming ASR and keyword spotting. Its Android guide also documents local/offline recognition.

For FLOUSTREAM:
- Use the upstream Android sample as the reference implementation, not a guessed Maven coordinate or hand-written JNI layer.
- First validate an arm64 sample with a Russian model on the OnePlus 10T; record model license, exact archive checksum, model size, sample rate, latency, memory and thermal behavior.
- Keep model weights out of the base APK; download only after the user chooses to enable the feature, with size and checksum displayed.
- Keep the speech engine behind an interface so the model/runtime can be replaced without touching chat UI.

References:
https://github.com/k2-fsa/sherpa-onnx
https://github.com/k2-fsa/sherpa-onnx/tree/master/android
https://k2-fsa.github.io/sherpa/onnx/android/index.html

## Next implementation step

Implement a serialized audio-session coordinator and tests before adding a native speech runtime. Then add sherpa-onnx from its current official Android sample, wire a push-to-talk capture path, and test on the target phone. Do not change existing voice-message capture or call capture as part of the first integration.
