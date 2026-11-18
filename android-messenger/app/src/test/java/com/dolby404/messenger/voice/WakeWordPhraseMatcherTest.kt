package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WakeWordPhraseMatcherTest {

    @Test fun acceptsExactRussianWakePhrase() {
        assertTrue(WakeWordPhraseMatcher.isWakePhrase("Флоу"))
    }

    @Test fun acceptsEnglishWakePhraseCaseInsensitively() {
        assertTrue(WakeWordPhraseMatcher.isWakePhrase("FLOW"))
    }

    @Test fun acceptsPunctuationAroundWakePhrase() {
        assertTrue(WakeWordPhraseMatcher.isWakePhrase("— Флоу!"))
    }

    @Test fun extractsCompleteRussianCommandAfterWakeWord() {
        assertEquals("открой чат иван иванов", WakeWordPhraseMatcher.extractCommand("Флоу, открой чат Иван Иванов"))
    }

    @Test fun extractsEnglishWakeWordCommand() {
        assertEquals("открой", WakeWordPhraseMatcher.extractCommand("FLOW, открой"))
    }

    @Test fun returnsEmptyCommandForWakeWordOnly() {
        assertEquals("", WakeWordPhraseMatcher.extractCommand("Флоу"))
    }

    @Test fun rejectsSentencesWithoutWakeWordAtStart() {
        assertNull(WakeWordPhraseMatcher.extractCommand("пожалуйста, Флоу открой чат"))
        assertNull(WakeWordPhraseMatcher.extractCommand("флора открой чат"))
    }

    @Test fun rejectsSimilarButDifferentWords() {
        assertFalse(WakeWordPhraseMatcher.isWakePhrase("флора"))
        assertFalse(WakeWordPhraseMatcher.isWakePhrase("поток"))
    }

    @Test fun rejectsBlankTranscript() {
        assertFalse(WakeWordPhraseMatcher.isWakePhrase("   "))
        assertNull(WakeWordPhraseMatcher.extractCommand("   "))
    }
}
