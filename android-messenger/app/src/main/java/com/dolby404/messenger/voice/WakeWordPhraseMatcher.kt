package com.dolby404.messenger.voice

import java.util.Locale

/**
 * Exact wake-phrase gate for transcripts emitted by the offline recognizer.
 *
 * This deliberately rejects sentences and approximate matches. The Vosk
 * grammar narrows decoding; this gate is the second check before waking the
 * command assistant.
 */
object WakeWordPhraseMatcher {
    private val acceptedPhrases = setOf("флоу", "flow")

    fun isWakePhrase(transcript: String): Boolean {
        val normalized = transcript
            .lowercase(Locale.ROOT)
            .replace(Regex("[^\\p{L}\\p{N}]+"), " ")
            .trim()
            .replace(Regex("\\s+"), " ")
        return normalized in acceptedPhrases
    }
}
