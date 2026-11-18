package com.dolby404.messenger.voice

import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import java.io.File

/**
 * Offline stop-command recognizer for an already-running voice-message capture.
 *
 * Receives mono PCM16 at 16 kHz from the shared capture pipeline. It never
 * opens the microphone or acquires a lease, so it can coexist with the AAC
 * encoder on the same captured frames.
 */
class VoskStopCommandDetector(
    modelDirectory: File,
    sampleRate: Float = SAMPLE_RATE_HZ,
    private val parser: FloustreamVoiceCommandParser = FloustreamVoiceCommandParser()
) : AutoCloseable {

    companion object {
        const val SAMPLE_RATE_HZ = 16_000f
        private const val STOP_ACTION = "stop_voice_recording"
    }

    private val model: Model
    private val recognizer: Recognizer
    private var closed = false

    init {
        require(sampleRate == SAMPLE_RATE_HZ) {
            "Stop-command recognition requires 16 kHz audio"
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
            Recognizer(model, sampleRate)
        } catch (error: Throwable) {
            model.close()
            throw error
        }
    }

    /**
     * Returns true only after Vosk finalizes an utterance that exactly maps
     * to the allow-listed stop-recording action. Partial hypotheses are ignored.
     */
    @Synchronized
    fun acceptAudio(samples: ShortArray, length: Int = samples.size): Boolean {
        check(!closed) { "Stop-command detector is closed" }
        require(length in 1..samples.size) { "Invalid PCM frame length" }

        if (!recognizer.acceptWaveForm(samples, length)) return false

        val transcript = runCatching {
            JSONObject(recognizer.result).optString("text")
        }.getOrDefault("")
        recognizer.reset()
        return parser.parse(transcript)?.action == STOP_ACTION
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
