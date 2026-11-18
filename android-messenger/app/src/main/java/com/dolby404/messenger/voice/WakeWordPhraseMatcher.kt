package com.dolby404.messenger.voice

import java.text.Normalizer
import java.util.Locale

/**
 * Strict second-stage gate for a wake phrase emitted by a speech recognizer.
 *
 * This class does not listen to the microphone or perform speech recognition.
 * It only accepts a transcript that consists entirely of the configured
 * invocation phrase, reducing accidental activations from ordinary speech.
 */
object WakeWordPhraseMatcher {
    private val acceptedPhrases = setOf("флоу", "flow")

    fun isWakePhrase(transcript: String): Boolean {
        val normalized = Normalizer.normalize(transcript, Normalizer.Form.NFKC)
            .lowercase(Locale.ROOT)
            .replace(Regex("[^\\p{L}\\p{N}]+"), " ")
            .trim()
            .replace(Regex("\\s+"), " ")

        return normalized in acceptedPhrases
    }
}
