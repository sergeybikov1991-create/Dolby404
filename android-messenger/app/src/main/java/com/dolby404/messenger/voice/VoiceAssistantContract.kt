package com.dolby404.messenger.voice

/** Runtime state and fixed typed actions for FLOUSTREAM hands-free commands. */
enum class VoicePhase {
    IDLE, LISTENING, TRANSCRIBING, THINKING, ERROR
}

data class VoiceAssistantState(
    val phase: VoicePhase = VoicePhase.IDLE,
    val recognizedText: String = "",
    val errorMessage: String? = null,
    val isModelReady: Boolean = false
)

enum class CallType { AUDIO, VIDEO }

sealed interface VoiceAction {
    data object OpenChats : VoiceAction
    data object OpenContacts : VoiceAction
    data object OpenSettings : VoiceAction
    data object ShowMedia : VoiceAction
    data object ShowUnreadConversations : VoiceAction

    data class OpenConversation(val conversationId: String) : VoiceAction
    data class SearchConversations(val query: String) : VoiceAction
    data class CreateConversation(val contactQuery: String) : VoiceAction
    data class SetConversationRead(val conversationId: String, val isRead: Boolean) : VoiceAction
    data class SetConversationPinned(val conversationId: String, val isPinned: Boolean) : VoiceAction
    data class SetConversationArchived(val conversationId: String, val isArchived: Boolean) : VoiceAction
    data class SetConversationMuted(val conversationId: String, val isMuted: Boolean) : VoiceAction
    data class DeleteConversation(val conversationId: String) : VoiceAction
    data class ClearConversationHistory(val conversationId: String) : VoiceAction

    data class SearchMessages(val conversationId: String?, val query: String) : VoiceAction
    data class SearchAttachments(val conversationId: String?, val mediaKind: MediaKind, val query: String?) : VoiceAction
    data class PrepareMessageDraft(val recipientQuery: String, val messageText: String) : VoiceAction
    data class SendMessage(val conversationId: String, val messageText: String) : VoiceAction
    data class ReplyToMessage(val conversationId: String, val messageId: String, val messageText: String) : VoiceAction
    data class ForwardMessage(val messageId: String, val targetConversationId: String) : VoiceAction
    data class EditMessage(val messageId: String, val newText: String) : VoiceAction
    data class DeleteMessage(val messageId: String) : VoiceAction
    data class ReactToMessage(val messageId: String, val reaction: String) : VoiceAction
    data class ReadMessage(val messageId: String) : VoiceAction

    data class PlayVoiceMessage(val messageId: String) : VoiceAction
    data class StartVoiceMessageRecording(val conversationId: String) : VoiceAction
    data object StopVoiceMessageRecording : VoiceAction
    data class PickAttachment(val mediaKind: MediaKind) : VoiceAction
    data object CapturePhoto : VoiceAction
    data object CaptureVideo : VoiceAction
    data class OpenAttachment(val attachmentId: String) : VoiceAction
    data class SendAttachment(val conversationId: String, val attachmentId: String) : VoiceAction
    data class SaveAttachmentToSiteMedia(val attachmentId: String) : VoiceAction
    data class ShareSiteMediaToConversation(val siteMediaId: String, val conversationId: String) : VoiceAction

    data class StartCall(val contactId: String, val callType: CallType) : VoiceAction
    data object AcceptCall : VoiceAction
    data object DeclineCall : VoiceAction
    data object ToggleCallMicrophone : VoiceAction
    data object ToggleCallCamera : VoiceAction

    data class ChangeSetting(val settingKey: String, val requestedValue: String) : VoiceAction
}

enum class MediaKind { PHOTO, VIDEO, FILE, ANY }

sealed interface VoiceCommandDecision {
    data class ExecuteSafely(val action: VoiceAction) : VoiceCommandDecision
    data class Reject(val reason: String) : VoiceCommandDecision
}

/** Parsed command; entity references are resolved by app-owned state before execution. */
data class VoiceModelIntent(
    val name: String,
    val arguments: Map<String, String> = emptyMap()
)
