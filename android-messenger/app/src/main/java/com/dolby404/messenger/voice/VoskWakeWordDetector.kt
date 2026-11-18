package com.dolby404.messenger.voice

import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import java.io.File

/**
 * Offline wake-phrase decoder backed by the small Russian Vosk model.
 *
 * The model directory must already be fully extracted in app-private storage.
 * Audio must be mono PCM16 at exactly 16 kHz. This class does not own the
 * microphone, download model files, or start an Android service.
 *
 * Keep this recognizer alive only while the WAKE_WORD microphone lease is held.
 */
class VoskWakeWordDetector(
    modelDirectory: File,
    sampleRate: Float = SAMPLE_RATE_HZ
) : AutoCloseable {

    companion object {
        const val SAMPLE_RATE_HZ = 16_000f
        private const val WAKE_GRAMMAR = """["флоу", "flow"]"""
    }

    private val model: Model
    private val recognizer: Recognizer
    private var closed = false

    init {
        require(modelDirectory.isDirectory) {
            "Каталог русской модели распознавания не найден"
        }
        model = Model(modelDirectory.absolutePath)
        try {
            recognizer = Recognizer(model, sampleRate, WAKE_GRAMMAR)
        } catch (error: Exception) {
            model.close()
            throw error
        }
    }

    /**
     * Feed the next PCM16 audio frame. Returns true only for an exact wake
     * phrase; all other speech is discarded by the restricted grammar and
     * WakeWordPhraseMatcher.
     */
    @Synchronized
    fun acceptAudio(samples: ShortArray, length: Int = samples.size): Boolean {
        check(!closed) { "Wake-word detector is closed" }
        require(length in 1..samples.size) { "Invalid PCM frame length" }

        val utteranceComplete = recognizer.acceptWaveForm(samples, length)
        val json = if (utteranceComplete) {
            recognizer.result
        } else {
            recognizer.partialResult
        }
        val field = if (utteranceComplete) "text" else "partial"
        val transcript = runCatching { JSONObject(json).optString(field) }
            .getOrDefault("")

        if (WakeWordPhraseMatcher.isWakePhrase(transcript)) {
            recognizer.reset()
            return true
        }

        if (utteranceComplete) recognizer.reset()
        return false
    }

    @Synchronized
    override fun close() {
        if (closed) return
        closed = true
        try {
            recognizer.close()
        } finally {
            model.close()
        }
    }
}
