package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceAudioSessionCoordinatorTest {

    @Test
    fun onlyOneAudioOwnerCanHoldLeaseAtATime() {
        val coordinator = VoiceAudioSessionCoordinator()
        val assistant = coordinator.tryAcquire(VoiceAudioOwner.ASSISTANT)

        assertNotNull(assistant)
        assertEquals(VoiceAudioOwner.ASSISTANT, coordinator.currentOwner.value)
        assertNull(coordinator.tryAcquire(VoiceAudioOwner.CALL))
        assertNull(coordinator.tryAcquire(VoiceAudioOwner.VOICE_MESSAGE))

        assistant!!.close()
        assertNull(coordinator.currentOwner.value)

        val call = coordinator.tryAcquire(VoiceAudioOwner.CALL)
        assertNotNull(call)
        assertEquals(VoiceAudioOwner.CALL, coordinator.currentOwner.value)
        call!!.close()
    }

    @Test
    fun closingLeaseMoreThanOnceIsSafe() {
        val coordinator = VoiceAudioSessionCoordinator()
        val lease = coordinator.tryAcquire(VoiceAudioOwner.WAKE_WORD)

        assertNotNull(lease)
        lease!!.close()
        lease.close()

        assertNull(coordinator.currentOwner.value)
        assertTrue(coordinator.tryAcquire(VoiceAudioOwner.ASSISTANT) != null)
    }


    @Test
    fun videoMessageRecordingExcludesAssistantAndVoiceMessageCapture() {
        val coordinator = VoiceAudioSessionCoordinator()
        val video = coordinator.tryAcquire(VoiceAudioOwner.VIDEO_MESSAGE)
        assertNotNull(video)
        assertEquals(VoiceAudioOwner.VIDEO_MESSAGE, coordinator.currentOwner.value)
        assertNull(coordinator.tryAcquire(VoiceAudioOwner.ASSISTANT))
        assertNull(coordinator.tryAcquire(VoiceAudioOwner.VOICE_MESSAGE))
        video!!.close()
        assertNotNull(coordinator.tryAcquire(VoiceAudioOwner.ASSISTANT))
    }

    @Test
    fun ownerIsClearedOnlyWhenCurrentLeaseIsClosed() {
        val coordinator = VoiceAudioSessionCoordinator()
        val first = coordinator.tryAcquire(VoiceAudioOwner.VOICE_MESSAGE)!!

        assertEquals(VoiceAudioOwner.VOICE_MESSAGE, coordinator.currentOwner.value)
        first.close()
        assertNull(coordinator.currentOwner.value)
    }
}
