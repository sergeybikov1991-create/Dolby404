# FLOUSTREAM wake-word implementation status

Base: `release/floustream-0.4.30`
Development branch: `feature/floustream-voice-activation-0430`

## Implemented in this branch

- Strict transcript matcher for exact `флоу` and `flow` wake phrases, with unit tests.
- Vosk wake-phrase decoder. It accepts only finalized phrases and requires mono PCM16 at 16 kHz.
- Foreground microphone service registered as a non-exported Android microphone service.
- The service acquires the process-wide `WAKE_WORD` lease, captures audio through `AudioRecord`, and releases the recorder and lease after detection or failure.
- The shared microphone coordinator is now used by the app UI and service.
- A settings card can download and install the small Russian Vosk model, verify its exact archive size and SHA-256, safely extract it into app-private storage, and let the user enable or disable the foreground listener.
- After detecting the wake phrase, the service releases the microphone, emits a package-scoped broadcast, and leaves an actionable notification rather than trying to launch an Activity from the background. If a conversation screen is already active in FLOUSTREAM, that screen can hand the wake event to its existing command recognizer; the app-wide assistant is not yet implemented.

## Model source and integrity

- Model: `vosk-model-small-ru-0.22`, approximately 45 MB, Apache-2.0.
- Official archive URL: `https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip`
- Expected archive size: `46,236,750` bytes.
- Pinned SHA-256: `961d5ff98a17f4aa6de69864d0aa71fa5bac682301d2b5d17a3f24c5c99a46d4`.
- The model is not bundled into the APK. It is downloaded only after the user chooses installation.
- Extraction is constrained to the expected ZIP root and rejects path traversal, unexpected archive structure, truncated downloads, hash mismatch and excessive expanded size.

## Important limitations not yet closed

1. Wake handoff currently reaches only the assistant hosted inside an already-open conversation. The app-wide assistant controller is still missing. If the app is backgrounded, tapping the notification opens FLOUSTREAM; if no conversation is active, the wake event waits until a conversation screen is opened. Seamless global command listening is not yet complete.
2. The service must be started by the user from a visible Activity after microphone permission is granted. Android 14+ microphone foreground-service restrictions prohibit assuming that a third-party app can silently start microphone capture from the background or at boot.
3. The notification permission flow and behavior on denied notification permission still need UX validation.
4. Microphone ownership is exclusive, but automatic preemption of wake listening when a voice message or call starts is not yet wired. Until that handoff is implemented, wake mode can occupy the microphone and block another capture request; this must be fixed before release.
5. Model download and extraction have not yet been exercised on a real phone or across restrictive networks.
6. No CI build, unit-test run, APK, or OnePlus 10T runtime test has been verified for this branch.

## Next implementation order

1. Run the Android CI build and unit tests; fix all compiler, lint and dependency issues.
2. Add safe microphone preemption so voice messages, video messages and calls pause wake capture and automatically re-arm it after the other session ends.
3. Add the top-level voice assistant controller so the wake event can open chats and operate app-wide commands, not only commands inside an already open conversation.
4. Wire the service broadcast and notification intent to that controller with a safe foreground handoff.
5. Validate model installation, service start/stop, false positives, microphone arbitration and notification behavior on OnePlus 10T / Android 15.
6. Test background, screen-off, lock-screen, Doze and battery-saver behavior. Document any Android/OEM restrictions instead of promising unsupported behavior.
7. Run existing chat-cache, attachment, voice-message and gallery-media regression tests.

## Release gate

Do not merge to `main` or publish a candidate APK until CI is green and the complete wake-to-global-command flow has been tested on the OnePlus 10T. The in-app updater remains the only user-facing test distribution path.
