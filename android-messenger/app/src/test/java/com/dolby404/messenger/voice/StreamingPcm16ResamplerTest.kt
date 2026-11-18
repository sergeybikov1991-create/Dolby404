package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class StreamingPcm16ResamplerTest {
    @Test
    fun converts44100SamplesTo16000HzStream() {
        val output = StreamingPcm16Resampler(44_100, 16_000)
            .process(ShortArray(44_100) { (it % 100).toShort() })
        assertEquals(16_001, output.size)
    }

    @Test
    fun chunkedInputMatchesContinuousInput() {
        val input = ShortArray(44_100) { ((it * 7) % 30_000).toShort() }
        val expected = StreamingPcm16Resampler(44_100, 16_000).process(input)
        val converter = StreamingPcm16Resampler(44_100, 16_000)
        val actual = input.asList().chunked(997).flatMap {
            converter.process(it.toShortArray()).toList()
        }
        assertEquals(expected.toList(), actual)
    }

    @Test
    fun resetStartsFreshStream() {
        val converter = StreamingPcm16Resampler(44_100, 16_000)
        val input = ShortArray(441) { 123 }
        val first = converter.process(input)
        converter.reset()
        val second = converter.process(input)
        assertEquals(first.toList(), second.toList())
        assertTrue(second.isNotEmpty())
    }
}
