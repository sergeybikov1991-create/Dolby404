package com.floustream.webshelltest.audio

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertNotNull
import org.junit.Test

class VoiceAudioSessionCoordinatorTest {
    @Test
    fun onlyOneAudioOwnerCanHoldLeaseAtATime() {
        val coordinator = VoiceAudioSessionCoordinator()
        val assistant = coordinator.tryAcquire(VoiceAudioOwner.ASSISTANT)
        assertNotNull(assistant)
        assertEquals(VoiceAudioOwner.ASSISTANT, coordinator.currentOwner())
        assertNull(coordinator.tryAcquire(VoiceAudioOwner.CALL))
        assertNull(coordinator.tryAcquire(VoiceAudioOwner.VOICE_MESSAGE))
        assistant!!.close()
        assertNull(coordinator.currentOwner())
        val call = coordinator.tryAcquire(VoiceAudioOwner.CALL)
        assertNotNull(call)
        assertEquals(VoiceAudioOwner.CALL, coordinator.currentOwner())
        call!!.close()
    }

    @Test
    fun closingLeaseMoreThanOnceIsSafe() {
        val coordinator = VoiceAudioSessionCoordinator()
        val lease = coordinator.tryAcquire(VoiceAudioOwner.WAKE_WORD)!!
        lease.close()
        lease.close()
        assertNull(coordinator.currentOwner())
        assertNotNull(coordinator.tryAcquire(VoiceAudioOwner.ASSISTANT))
    }

    @Test
    fun staleLeaseCannotReleaseNewOwner() {
        val coordinator = VoiceAudioSessionCoordinator()
        val old = coordinator.tryAcquire(VoiceAudioOwner.VOICE_MESSAGE)!!
        old.close()
        val current = coordinator.tryAcquire(VoiceAudioOwner.CALL)!!
        old.close()
        assertEquals(VoiceAudioOwner.CALL, coordinator.currentOwner())
        current.close()
        assertNull(coordinator.currentOwner())
    }

    @Test
    fun videoMessageExcludesOtherMicrophoneUsers() {
        val coordinator = VoiceAudioSessionCoordinator()
        val video = coordinator.tryAcquire(VoiceAudioOwner.VIDEO_MESSAGE)!!
        assertNull(coordinator.tryAcquire(VoiceAudioOwner.ASSISTANT))
        assertNull(coordinator.tryAcquire(VoiceAudioOwner.VOICE_MESSAGE))
        video.close()
        assertNotNull(coordinator.tryAcquire(VoiceAudioOwner.ASSISTANT))
    }
}
