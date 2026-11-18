package com.dolby404.messenger.voice

/**
 * Delivers each captured PCM16 frame to independent processing pipelines.
 *
 * Intended for the future single-microphone voice-message path:
 * - AAC encoder receives the frame to persist the message.
 * - Vosk receives the same frame to detect the spoken stop command.
 *
 * The fan-out owns no microphone, thread, codec, or recognizer lifecycle.
 * Call it synchronously from the one AudioRecord capture loop while the
 * VOICE_MESSAGE lease is held. Each consumer receives its own bounded copy,
 * so a native recognizer cannot mutate samples observed by the encoder.
 */
fun interface PcmAudioFrameConsumer {
    fun onFrame(samples: ShortArray, length: Int)
}

class PcmAudioFrameFanout(
    private val consumers: List<PcmAudioFrameConsumer>,
    private val onConsumerFailure: (index: Int, error: Exception) -> Unit = { _, _ -> }
) {
    init {
        require(consumers.isNotEmpty()) { "At least one PCM consumer is required" }
    }

    /**
     * Dispatches exactly [length] samples to every consumer.
     *
     * A failing secondary consumer is reported but does not prevent delivery
     * to the remaining consumers. The caller decides whether a failed primary
     * recording consumer should terminate the capture session.
     */
    fun dispatch(samples: ShortArray, length: Int = samples.size) {
        require(length in 1..samples.size) { "Invalid PCM frame length" }

        consumers.forEachIndexed { index, consumer ->
            val isolatedFrame = samples.copyOf(length)
            try {
                consumer.onFrame(isolatedFrame, isolatedFrame.size)
            } catch (error: Exception) {
                onConsumerFailure(index, error)
            }
        }
    }
}
