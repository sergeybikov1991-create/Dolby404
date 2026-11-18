package com.dolby404.messenger.voice

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WakeWordPhraseMatcherTest {

    @Test
    fun acceptsExactRussianWakePhrase() {
        assertTrue(WakeWordPhraseMatcher.isWakePhrase("Флоу"))
    }

    @Test
    fun acceptsEnglishWakePhraseCaseInsensitively() {
        assertTrue(WakeWordPhraseMatcher.isWakePhrase("FLOW"))
    }

    @Test
    fun acceptsPunctuationAroundWakePhrase() {
        assertTrue(WakeWordPhraseMatcher.isWakePhrase("— Флоу!"))
    }

    @Test
    fun rejectsWakePhraseInsideLongerSentence() {
        assertFalse(WakeWordPhraseMatcher.isWakePhrase("Флоу, открой чат"))
    }

    @Test
    fun rejectsSimilarButDifferentWords() {
        assertFalse(WakeWordPhraseMatcher.isWakePhrase("флора"))
        assertFalse(WakeWordPhraseMatcher.isWakePhrase("поток"))
    }

    @Test
    fun rejectsBlankTranscript() {
        assertFalse(WakeWordPhraseMatcher.isWakePhrase("   "))
    }
}
