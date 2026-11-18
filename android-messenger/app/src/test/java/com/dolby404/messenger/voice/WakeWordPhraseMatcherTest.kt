package com.dolby404.messenger.voice

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WakeWordPhraseMatcherTest {
    @Test fun acceptsRussianAndEnglishWakePhrase() {
        assertTrue(WakeWordPhraseMatcher.isWakePhrase("Флоу"))
        assertTrue(WakeWordPhraseMatcher.isWakePhrase("flow"))
    }

    @Test fun ignoresCaseAndSurroundingPunctuation() {
        assertTrue(WakeWordPhraseMatcher.isWakePhrase("  ФЛОУ! "))
        assertTrue(WakeWordPhraseMatcher.isWakePhrase("Flow."))
    }

    @Test fun rejectsSentencesAndLookalikeWords() {
        assertFalse(WakeWordPhraseMatcher.isWakePhrase("Флоу открой чат"))
        assertFalse(WakeWordPhraseMatcher.isWakePhrase("флоустрим"))
        assertFalse(WakeWordPhraseMatcher.isWakePhrase("поток"))
        assertFalse(WakeWordPhraseMatcher.isWakePhrase(""))
    }
}
