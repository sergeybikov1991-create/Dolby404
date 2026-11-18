package com.dolby404.messenger.voice

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class PcmAudioFrameFanoutTest {

    @Test
    fun sendsTheSameBoundedPcmFrameToEveryConsumer() {
        val received = mutableListOf<List<Short>>()
        val fanout = PcmAudioFrameFanout(
            listOf(
                PcmAudioFrameConsumer { samples, length -> received += samples.take(length) },
                PcmAudioFrameConsumer { samples, length -> received += samples.take(length) }
            )
        )

        fanout.dispatch(shortArrayOf(10, 20, 30, 40), length = 3)

        assertEquals(listOf<Short>(10, 20, 30), received[0])
        assertEquals(received[0], received[1])
    }

    @Test
    fun consumersReceiveIndependentCopies() {
        var secondConsumerFrame: ShortArray? = null
        val fanout = PcmAudioFrameFanout(
            listOf(
                PcmAudioFrameConsumer { samples, _ -> samples[0] = 999 },
                PcmAudioFrameConsumer { samples, _ -> secondConsumerFrame = samples }
            )
        )

        fanout.dispatch(shortArrayOf(1, 2, 3))

        assertArrayEquals(shortArrayOf(1, 2, 3), secondConsumerFrame)
    }

    @Test
    fun oneConsumerFailureDoesNotBlockTheOtherConsumer() {
        val failures = mutableListOf<Pair<Int, String>>()
        var secondConsumerCalled = false
        val fanout = PcmAudioFrameFanout(
            listOf(
                PcmAudioFrameConsumer { _, _ -> error("recognizer failed") },
                PcmAudioFrameConsumer { _, _ -> secondConsumerCalled = true }
            ),
            onConsumerFailure = { index, error -> failures += index to (error.message ?: "") }
        )

        fanout.dispatch(shortArrayOf(1, 2))

        assertTrue(secondConsumerCalled)
        assertEquals(listOf(0 to "recognizer failed"), failures)
    }

    @Test
    fun rejectsEmptyConsumerListAndInvalidFrameLength() {
        assertThrows(IllegalArgumentException::class.java) {
            PcmAudioFrameFanout(emptyList())
        }
        val fanout = PcmAudioFrameFanout(
            listOf(PcmAudioFrameConsumer { _, _ -> })
        )
        assertThrows(IllegalArgumentException::class.java) {
            fanout.dispatch(shortArrayOf(1), length = 0)
        }
    }
}
