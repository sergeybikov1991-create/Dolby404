package com.dolby404.messenger.voice

import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Enforces one microphone consumer at a time across assistant, voice messages,
 * calls and (later) wake-word detection.
 *
 * This is an in-process ownership guard. It does not itself open or close the
 * Android microphone; callers must hold the lease for the full capture lifetime
 * and close it only after their AudioRecord/native pipeline has fully stopped.
 */
class VoiceAudioSessionCoordinator {

    private val _currentOwner = MutableStateFlow<VoiceAudioOwner?>(null)
    val currentOwner: StateFlow<VoiceAudioOwner?> = _currentOwner.asStateFlow()

    private var nextLeaseId = 1L
    private var activeLeaseId: Long? = null

    @Synchronized
    fun tryAcquire(owner: VoiceAudioOwner): Lease? {
        if (activeLeaseId != null) return null

        val leaseId = nextLeaseId++
        activeLeaseId = leaseId
        _currentOwner.value = owner
        return Lease(owner) { release(leaseId) }
    }

    @Synchronized
    private fun release(leaseId: Long) {
        if (activeLeaseId != leaseId) return
        activeLeaseId = null
        _currentOwner.value = null
    }

    class Lease internal constructor(
        val owner: VoiceAudioOwner,
        private val releaseAction: () -> Unit
    ) : AutoCloseable {
        private val closed = AtomicBoolean(false)

        override fun close() {
            if (closed.compareAndSet(false, true)) {
                releaseAction()
            }
        }
    }
}

enum class VoiceAudioOwner {
    ASSISTANT,
    VOICE_MESSAGE,
    CALL,
    WAKE_WORD
}
