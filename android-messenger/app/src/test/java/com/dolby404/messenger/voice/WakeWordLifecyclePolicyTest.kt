package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WakeWordLifecyclePolicyTest {

    @Test fun refusesToStartFromBackground() {
        assertEquals(
            WakeWordLifecyclePolicy.StartDecision.REQUIRE_VISIBLE_APP,
            WakeWordLifecyclePolicy.evaluateStart(
                activityVisible = false,
                hasRecordAudioPermission = true,
                serviceAlreadyRunning = false
            )
        )
    }

    @Test fun requiresMicrophonePermissionBeforeStarting() {
        assertEquals(
            WakeWordLifecyclePolicy.StartDecision.REQUIRE_MICROPHONE_PERMISSION,
            WakeWordLifecyclePolicy.evaluateStart(
                activityVisible = true,
                hasRecordAudioPermission = false,
                serviceAlreadyRunning = false
            )
        )
    }

    @Test fun allowsForegroundStartAndKeepsExistingSessionAcrossBackgrounding() {
        assertEquals(
            WakeWordLifecyclePolicy.StartDecision.START,
            WakeWordLifecyclePolicy.evaluateStart(
                activityVisible = true,
                hasRecordAudioPermission = true,
                serviceAlreadyRunning = false
            )
        )
        assertEquals(
            WakeWordLifecyclePolicy.StartDecision.ALREADY_RUNNING,
            WakeWordLifecyclePolicy.evaluateStart(
                activityVisible = false,
                hasRecordAudioPermission = true,
                serviceAlreadyRunning = true
            )
        )
    }

    @Test fun wakeWordYieldsMicrophoneToCallsAndRecordings() {
        assertTrue(WakeWordLifecyclePolicy.mayUseMicrophone(null))
        assertTrue(WakeWordLifecyclePolicy.mayUseMicrophone(VoiceAudioOwner.WAKE_WORD))
        assertFalse(WakeWordLifecyclePolicy.mayUseMicrophone(VoiceAudioOwner.ASSISTANT))
        assertFalse(WakeWordLifecyclePolicy.mayUseMicrophone(VoiceAudioOwner.VOICE_MESSAGE))
        assertFalse(WakeWordLifecyclePolicy.mayUseMicrophone(VoiceAudioOwner.VIDEO_MESSAGE))
        assertFalse(WakeWordLifecyclePolicy.mayUseMicrophone(VoiceAudioOwner.CALL))
    }
}
