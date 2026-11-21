package com.floustream.webshelltest.audio

import java.util.concurrent.atomic.AtomicBoolean

/**
 * One in-process microphone owner at a time.
 *
 * Every microphone feature (voice messages, assistant, calls, video capture
 * with audio, wake-word detection) must hold a lease for its complete capture
 * lifetime and release it only after the capture stream has stopped.
 */
class VoiceAudioSessionCoordinator {
    private var nextLeaseId = 1L
    private var activeLeaseId: Long? = null
    private var activeOwner: VoiceAudioOwner? = null

    @Synchronized
    fun tryAcquire(owner: VoiceAudioOwner): Lease? {
        if (activeLeaseId != null) return null
        val id = nextLeaseId++
        activeLeaseId = id
        activeOwner = owner
        return Lease(owner) { release(id) }
    }

    @Synchronized
    fun currentOwner(): VoiceAudioOwner? = activeOwner

    @Synchronized
    private fun release(id: Long) {
        if (activeLeaseId != id) return
        activeLeaseId = null
        activeOwner = null
    }

    class Lease internal constructor(
        val owner: VoiceAudioOwner,
        private val releaseAction: () -> Unit
    ) : AutoCloseable {
        private val closed = AtomicBoolean(false)

        override fun close() {
            if (closed.compareAndSet(false, true)) releaseAction()
        }
    }
}

enum class VoiceAudioOwner {
    ASSISTANT,
    VOICE_MESSAGE,
    VIDEO_MESSAGE,
    CALL,
    WAKE_WORD
}
