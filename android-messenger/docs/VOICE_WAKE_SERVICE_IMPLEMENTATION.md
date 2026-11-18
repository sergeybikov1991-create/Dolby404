# FLOUSTREAM wake-word service implementation contract

Status: design gate for the next implementation step. This document does not claim that background wake-word capture is implemented.

## Verified starting point

- The 0.4.30 baseline targets Android 36 and has `RECORD_AUDIO`, but its manifest does not declare `FOREGROUND_SERVICE_MICROPHONE` or a microphone foreground service.
- The current `AndroidOnDeviceVoiceController` uses Android `SpeechRecognizer`, rejects starts while the activity is not foreground, and releases listening on activity pause. It is an in-app command recognizer, not a wake-word listener.
- `VoiceAudioSessionCoordinator` is an in-process lease guard. It does not capture audio.
- The other experimental branch contains a Vosk detector and declares Vosk/JNA dependencies, but the detector requires a model directory already extracted into app-private storage. That branch does not provide a verified end-to-end model installer + foreground microphone service + activity handoff. It must not be merged wholesale.
- The current development branch only has an exact phrase matcher and unit tests. No microphone capture or background service is present yet.

## Required architecture

1. User explicitly enables hands-free mode while FLOUSTREAM is visible and grants microphone permission. Explain the persistent microphone notification and battery cost.
2. Download the selected Russian wake-word model over HTTPS into app-private temporary storage. Verify a pinned SHA-256 before extraction; reject path traversal, unexpected archive entries, truncated files and insufficient storage. Extract atomically and mark ready only after validation.
3. Start a dedicated, non-exported `WakeWordForegroundService` from the visible activity. It must call `startForeground` immediately with a truthful persistent notification and use `foregroundServiceType="microphone"`.
4. Declare `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, and `RECORD_AUDIO`. Request runtime microphone permission before service start. Handle Android 14+ while-in-use restrictions and Android 15 target-SDK restrictions; do not attempt to silently start microphone capture from background or boot.
5. The service owns one PCM16 mono 16 kHz `AudioRecord` pipeline and a `WAKE_WORD` lease for its entire capture lifetime. The detector receives frames only while that lease is held.
6. On exact wake phrase, stop and release the wake-word capture before handing off. Do not run Vosk and `SpeechRecognizer` concurrently. Transfer to the existing assistant only through an explicit coordinator handoff after verifying the app's activation path is allowed.
7. If Android blocks opening the activity from the background/lock screen, announce the limitation and show a notification action or use an explicitly selected system-assistant role. Never promise silent lock-screen launch until device-tested.
8. Stop wake listening before voice messages, video messages and calls; restart only after the other owner releases the microphone. A failed handoff must release all resources and leave a recoverable notification state.

## Acceptance tests before any release

- Enable/disable and permission denial/revocation.
- Model download interruption, checksum mismatch, low storage and corrupt archive.
- Exact Russian and English wake phrase; false-positive phrases; background noise.
- Screen on, app backgrounded, screen locked, Doze, battery saver, process recreation.
- OnePlus 10T / Android 15: start restrictions, persistent notification, thermal and battery behavior.
- Mutual exclusion with assistant command recognition, voice message, video message and call capture.
- Stop service, force-stop, reboot and app update behavior.
- Existing chat cache, attachment fan, voice messages and gallery media regression suite.

## Release gate

Do not merge this feature or publish an APK until a clean CI build and unit tests pass, model integrity is verified, and the wake-to-command handoff has been exercised on the OnePlus 10T. The app's in-app updater remains the only user-facing test distribution path.
