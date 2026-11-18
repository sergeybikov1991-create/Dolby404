package com.dolby404.messenger.voice

import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import java.io.File

/**
 * Lightweight offline wake-phrase decoder.
 *
 * The model must already be completely installed in app-private storage.
 * Audio supplied to [acceptAudio] must be mono PCM16 at exactly 16 kHz.
 * This class never opens the microphone and must be used only while the
 * WAKE_WORD microphone lease is held by the capture owner.
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
        require(sampleRate == SAMPLE_RATE_HZ) {
            "Wake-word recognition requires 16 kHz audio"
        }
        require(modelDirectory.isDirectory) {
            "Каталог офлайн-модели не найден"
        }
        require(File(modelDirectory, "am").isDirectory ||
            File(modelDirectory, "conf").isDirectory) {
            "Каталог модели Vosk неполный или повреждён"
        }

        model = Model(modelDirectory.absolutePath)
        recognizer = try {
            Recognizer(model, sampleRate, WAKE_GRAMMAR)
        } catch (error: Throwable) {
            model.close()
            throw error
        }
    }

    /**
     * Returns true only when Vosk has finalized an exact wake phrase.
     * Partial hypotheses are deliberately ignored to reduce false activation.
     */
    @Synchronized
    fun acceptAudio(samples: ShortArray, length: Int = samples.size): Boolean {
        check(!closed) { "Wake-word detector is closed" }
        require(length in 1..samples.size) { "Invalid PCM frame length" }

        val completed = recognizer.acceptWaveForm(samples, length)
        if (!completed) return false

        val transcript = runCatching {
            JSONObject(recognizer.result).optString("text")
        }.getOrDefault("")
        recognizer.reset()
        return WakeWordPhraseMatcher.isWakePhrase(transcript)
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
