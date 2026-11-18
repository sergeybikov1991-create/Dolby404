package com.dolby404.messenger.voice

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
