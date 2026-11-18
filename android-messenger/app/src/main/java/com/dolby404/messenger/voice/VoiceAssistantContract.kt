package com.dolby404.messenger.voice

/**
 * UI/runtime contract for FLOUSTREAM VOICE.
 *
 * This file intentionally has no Android, Compose, network, or model-runtime dependencies.
 * It is an isolated foundation; it does not touch the existing voice-message recorder.
 */

enum class VoicePhase {
    IDLE,
    LISTENING,
    TRANSCRIBING,
    THINKING,
    SPEAKING,
    ERROR
}

data class VoiceAssistantState(
    val phase: VoicePhase = VoicePhase.IDLE,
    val recognizedText: String = "",
    val responseText: String = "",
    val errorMessage: String? = null,
    val isModelReady: Boolean = false
)

sealed interface VoiceAction {
    data object OpenChats : VoiceAction
    data object OpenContacts : VoiceAction
    data object ShowMedia : VoiceAction

    data class PrepareMessageDraft(
        val recipientQuery: String,
        val messageText: String
    ) : VoiceAction

    data class SendMessage(
        val conversationId: String,
        val messageText: String
    ) : VoiceAction

    data class StartCall(
        val contactId: String,
        val callType: CallType
    ) : VoiceAction

    data class DeleteMessage(
        val messageId: String
    ) : VoiceAction

    data class ChangeSetting(
        val settingKey: String,
        val requestedValue: String
    ) : VoiceAction
}

enum class CallType {
    AUDIO,
    VIDEO
}

sealed interface VoiceCommandDecision {
    data class ExecuteSafely(val action: VoiceAction) : VoiceCommandDecision
    data class AskForConfirmation(val action: VoiceAction, val prompt: String) : VoiceCommandDecision
    data class Reject(val reason: String) : VoiceCommandDecision
}

/**
 * Only the application-owned router may turn model output into VoiceAction.
 * Model output itself must never be executed as an Android action.
 */
data class VoiceModelIntent(
    val name: String,
    val arguments: Map<String, String> = emptyMap()
)
