# FLOUSTREAM voice wake-word implementation decision

Status: implementation in progress; not yet enabled in the app.

## Selected first prototype

Use Vosk Android 0.3.75 with the official small Russian model `vosk-model-small-ru-0.22` as the first offline prototype.

Reasons:
- Apache-2.0 model license.
- Approximately 45 MB model archive, downloaded only when the user enables hands-free mode; do not bundle it in the APK.
- Offline streaming recognition on Android.
- Vosk supports grammar-constrained recognition, allowing the first stage to listen only for the wake phrase and avoid interpreting arbitrary conversation as commands.
- Official Android artifact is available from Maven Central. JNA and Vosk must be declared as Android AAR dependencies.

## Important validation gate

The model card does not explicitly guarantee recognition of the FLOUSTREAM brand word "Флоу". Before enabling background listening, validate the exact spoken forms "Флоу" and "Flow" against real recordings on a phone. If the Russian small model cannot reliably recognize the wake phrase through a restricted grammar, do not ship a false-positive-prone detector; evaluate a custom pronunciation/lexicon or a dedicated trained wake-word model.

## Android lifecycle and microphone rules

A normal microphone foreground service is suitable only for an explicitly enabled, user-visible listening mode. It must be started while FLOUSTREAM is visible, after RECORD_AUDIO is granted, and it must show a persistent notification. It does not grant permission to launch MainActivity from the background, and it cannot be silently restarted from BOOT_COMPLETED on current Android versions.

The user's core requirement is stronger: say “Флоу” while FLOUSTREAM is not open, then have the assistant open FLOUSTREAM and navigate to a chat. Android restricts background activity launches. The system-supported path to investigate for that behavior is an optional VoiceInteractionService selected by the user as the device's default digital assistant. Android keeps the selected VoiceInteractionService running for hotwording. Before implementation, verify OnePlus/OxygenOS support, the assistant-role selection flow, microphone access rules for that service, and whether a software Vosk detector can legally/reliably run in that lifecycle. Do not claim a regular foreground service can open the app from background.

- Ask for RECORD_AUDIO through a visible app flow and explain that microphone listening is active.
- If offering a non-default-assistant fallback, start a microphone foreground service only from a visible FLOUSTREAM activity and show a persistent notification.
- Do not attempt to start a microphone foreground service from BOOT_COMPLETED on Android 14+.
- Keep wake-word capture mutually exclusive with assistant command capture, voice/video recording, and calls through VoiceAudioSessionCoordinator.
- When the wake phrase is detected, stop/release the wake-word recognizer and microphone before starting command recognition; reacquire wake-word listening only after the command session ends.
- A VoiceInteractionService should remain lightweight; create the heavy command/session work only after invocation.

## Release gates

1. Verify wake phrase accuracy and false activations on OnePlus 10T / Android 15.
2. Verify foreground-to-background continuity, notification controls, process death, battery impact, and microphone handoff.
3. Run unit tests and GitHub Actions build.
4. Only then enable the feature in a release. Existing chat cache, composer fan, voice messages, and gallery attachment behavior must remain untouched.
