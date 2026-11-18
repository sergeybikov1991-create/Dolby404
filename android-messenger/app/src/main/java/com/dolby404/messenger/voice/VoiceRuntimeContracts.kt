package com.dolby404.messenger.voice

/**
 * Adapter boundary for sherpa-onnx streaming ASR. Audio frames are mono float
 * PCM in [-1, 1]; the runtime/model adapter owns native stream lifecycle.
 */
interface StreamingSpeechRecognizer {
    val isReady: Boolean
    fun startSession(
        onPartialResult: (String) -> Unit,
        onFinalResult: (String) -> Unit,
        onError: (String) -> Unit
    ): SpeechRecognitionSession
}

interface SpeechRecognitionSession : AutoCloseable {
    fun acceptAudioFrame(samples: FloatArray, sampleRate: Int)
    fun finish()
    fun cancel()
    override fun close()
}

/** Implemented by a local dialogue model or an explicitly opted-in provider. */
fun interface VoiceDialogueEngine {
    suspend fun interpret(
        transcript: String,
        context: VoiceDialogueContextView,
        history: List<VoiceDialogueTurn>
    ): VoiceModelIntent?
}

enum class VoiceDialogueRole { USER, ASSISTANT }

data class VoiceDialogueTurn(
    val role: VoiceDialogueRole,
    val text: String
)

/** Output adapter; Android TTS implementation must verify offline voice availability. */
interface VoiceSpeechOutput {
    val isReady: Boolean
    fun speak(text: String): Boolean
    fun speak(text: String, onDone: () -> Unit): Boolean = speak(text)
    fun stop()
}
