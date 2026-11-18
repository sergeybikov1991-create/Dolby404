# FLOUSTREAM voice-message stop-command POC

Status: isolated PCM fan-out primitive added; production recorder is intentionally unchanged.

## Current verified limitation

The chat recorder uses Android `MediaRecorder` to create AAC/MPEG-4 audio at 44.1 kHz. It owns the `VOICE_MESSAGE` lease for the full recording. The wake-word service opens a separate `AudioRecord` at 16 kHz and requests the `WAKE_WORD` lease. The shared coordinator correctly prevents both from opening the microphone simultaneously.

Consequently, the parser/router support for `Стоп` does not mean the phrase can be heard during an active voice-message recording.

## Safe target architecture

One capture loop owns the microphone and distributes each PCM16 frame to two independent consumers:

1. AAC recording pipeline: encode the frame and mux AAC access units into an MPEG-4/M4A file.
2. Vosk command pipeline: inspect the same audio stream for the stop phrase.

The new `PcmAudioFrameFanout` is a small, JVM-testable primitive for the data handoff only. It copies each bounded frame per consumer, isolates consumer mutation, and reports a consumer exception without starving the other consumer. It does not open the microphone, own the lease, or implement codec lifecycle.

## Integration constraints

- Do not change the current `MediaRecorder` implementation until the replacement passes device tests.
- Prototype AAC encoding with `MediaCodec` and MP4 muxing with `MediaMuxer`; retain the current M4A file contract used by upload/playback.
- Start with mono 16 kHz PCM so the Vosk input is native-rate; verify AAC-LC encoder support and playback compatibility on OnePlus 10T / Android 15. If encoder support is unreliable, add a tested resampling stage rather than silently feeding the recognizer 44.1 kHz.
- Feed monotonically increasing presentation timestamps to the muxer. Drain encoder output until end-of-stream before finalizing the muxer.
- Keep the existing `VOICE_MESSAGE` lease for the complete AudioRecord + encoder + Vosk lifetime. Do not acquire a second `WAKE_WORD` lease.
- A Vosk failure must disable command detection and surface a controlled error, not corrupt or silently discard the recording.
- An AAC/MediaCodec failure must stop the new pipeline, release all codec/muxer/AudioRecord resources, and leave the old recorder available as fallback.
- A detected stop command must be debounced and acted on once. Stop capture, drain/finalize M4A, release microphone lease, then reuse the existing upload/send path.
- Never send a zero-length, truncated, or unfinalized M4A file.

## Required gates before switching production

1. Unit tests for PCM frame fan-out and failure isolation.
2. Instrumented/device test: one-minute recording, Vosk recognition active, no frame loss, valid M4A duration and playback.
3. Recognition test for Russian `Стоп` at different distances/volumes while preserving the recording.
4. Interruption tests: permission revocation, app backgrounding, incoming call, screen rotation, process teardown, codec error and user cancellation.
5. Regression test the existing voice-message send/upload/playback path and the protected gallery/cache/F-menu behavior.
6. Only after these gates pass, introduce a feature-gated recorder adapter with the existing `MediaRecorder` implementation as fallback.
