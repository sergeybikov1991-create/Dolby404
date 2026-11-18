package com.dolby404.messenger.voice

/** Adapts the offline-only Android TextToSpeech implementation to the runtime contract. */
class AndroidVoiceSpeechOutput(
    private val tts: AndroidOfflineRussianTts
) : VoiceSpeechOutput {
    override val isReady: Boolean
        get() = tts.isReady.value

    override fun speak(text: String): Boolean = tts.speak(text)

    override fun stop() = tts.stop()

    fun close() = tts.close()
}
