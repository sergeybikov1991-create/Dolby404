package com.dolby404.messenger.voice

import java.text.Normalizer
import java.util.Locale

/** Extracts only utterances explicitly invoked with the FLOUSTREAM wake word. */
object WakeWordPhraseMatcher {
    private val acceptedPhrases = setOf("флоу", "flow")

    fun extractCommand(transcript: String): String? {
        val normalized = normalize(transcript)
        if (normalized.isBlank()) return null
        val firstWord = normalized.substringBefore(' ')
        if (firstWord !in acceptedPhrases) return null
        return normalized.substringAfter(' ', "").trim()
    }

    fun isWakePhrase(transcript: String): Boolean =
        normalize(transcript) in acceptedPhrases

    private fun normalize(value: String): String =
        Normalizer.normalize(value, Normalizer.Form.NFKC)
            .lowercase(Locale.ROOT)
            .replace(Regex("[^\\p{L}\\p{N}]+"), " ")
            .trim()
            .replace(Regex("\\s+"), " ")
}
