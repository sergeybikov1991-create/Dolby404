package com.dolby404.messenger.voice

/**
 * Stateful mono PCM16 downsampler. Phase is retained across AudioRecord frame
 * boundaries, so chunked processing is continuous. This class owns no I/O.
 */
class StreamingPcm16Resampler(
    private val inputRateHz: Int,
    private val outputRateHz: Int
) {
    private var previousSample: Short? = null
    private var phase = 0L

    init {
        require(inputRateHz > 0 && outputRateHz > 0)
        require(outputRateHz <= inputRateHz) { "Downsampling only" }
    }

    @Synchronized
    fun process(input: ShortArray, length: Int = input.size): ShortArray {
        require(length in 0..input.size)
        if (length == 0) return ShortArray(0)
        val output = ArrayList<Short>(
            ((length.toLong() * outputRateHz) / inputRateHz + 2L).toInt()
        )
        var previous = previousSample
        for (index in 0 until length) {
            val current = input[index]
            if (previous == null) {
                output.add(current)
                previous = current
                continue
            }
            val oldPhase = phase
            phase += outputRateHz.toLong()
            if (phase >= inputRateHz) {
                phase -= inputRateHz
                val fraction = (inputRateHz.toLong() - oldPhase).toDouble() /
                    outputRateHz.toDouble()
                val value = previous.toDouble() +
                    (current.toDouble() - previous.toDouble()) * fraction
                output.add(value.toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort())
            }
            previous = current
        }
        previousSample = previous
        return output.toShortArray()
    }

    @Synchronized
    fun reset() {
        previousSample = null
        phase = 0L
    }
}
