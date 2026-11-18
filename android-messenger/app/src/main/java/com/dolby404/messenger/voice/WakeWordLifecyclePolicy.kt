package com.dolby404.messenger.voice

/**
 * Android lifecycle gate for the always-available wake-word session.
 *
 * A microphone foreground service must be started while FLOUSTREAM is visible
 * and RECORD_AUDIO is granted. Once started legitimately, it may continue while
 * the activity is backgrounded. This policy never authorizes a background start.
 */
object WakeWordLifecyclePolicy {

    enum class StartDecision {
        START,
        ALREADY_RUNNING,
        REQUIRE_VISIBLE_APP,
        REQUIRE_MICROPHONE_PERMISSION
    }

    fun evaluateStart(
        activityVisible: Boolean,
        hasRecordAudioPermission: Boolean,
        serviceAlreadyRunning: Boolean
    ): StartDecision {
        if (serviceAlreadyRunning) return StartDecision.ALREADY_RUNNING
        if (!hasRecordAudioPermission) return StartDecision.REQUIRE_MICROPHONE_PERMISSION
        if (!activityVisible) return StartDecision.REQUIRE_VISIBLE_APP
        return StartDecision.START
    }

    /**
     * The wake-word detector yields the microphone to calls and recordings.
     * It must not compete with another active microphone owner.
     */
    fun mayUseMicrophone(owner: VoiceAudioOwner?): Boolean =
        owner == null || owner == VoiceAudioOwner.WAKE_WORD
}
