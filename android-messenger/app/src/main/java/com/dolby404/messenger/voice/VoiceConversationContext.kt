package com.dolby404.messenger.voice

/**
 * Ephemeral, app-owned context. Stable database IDs remain inside the app and
 * are never passed to the language model.
 */
data class VoiceConversationContext(
    val screen: VoiceScreen = VoiceScreen.UNKNOWN,
    val activeConversationId: String? = null,
    val activeContactId: String? = null,
    val selectedMessageId: String? = null,
    val lastMessageId: String? = null,
    val selectedAttachmentId: String? = null,
    val activeConversationTitle: String? = null,
    val activeContactDisplayName: String? = null,
    val selectedMessagePreview: String? = null,
    val lastMessagePreview: String? = null,
    val selectedAttachmentName: String? = null,
    /** Incremented whenever navigation or selection changes. */
    val revision: Long = 0L
) {
    fun enterConversation(
        conversationId: String,
        contactId: String? = null,
        conversationTitle: String? = null,
        contactDisplayName: String? = null
    ) = copy(
        screen = VoiceScreen.CONVERSATION,
        activeConversationId = conversationId,
        activeContactId = contactId,
        selectedMessageId = null,
        lastMessageId = null,
        selectedAttachmentId = null,
        activeConversationTitle = conversationTitle,
        activeContactDisplayName = contactDisplayName,
        selectedMessagePreview = null,
        lastMessagePreview = null,
        selectedAttachmentName = null,
        revision = revision + 1
    )

    fun selectMessage(
        messageId: String,
        isLatest: Boolean = false,
        preview: String? = null
    ) = copy(
        selectedMessageId = messageId,
        selectedMessagePreview = preview,
        lastMessageId = if (isLatest) messageId else lastMessageId,
        lastMessagePreview = if (isLatest) preview else lastMessagePreview,
        revision = revision + 1
    )

    fun observeLatestMessage(messageId: String, preview: String? = null) =
        copy(lastMessageId = messageId, lastMessagePreview = preview, revision = revision + 1)

    fun selectAttachment(attachmentId: String, displayName: String? = null) =
        copy(selectedAttachmentId = attachmentId, selectedAttachmentName = displayName, revision = revision + 1)

    fun leaveConversation() =
        copy(
            screen = VoiceScreen.CHATS,
            activeConversationId = null,
            activeContactId = null,
            selectedMessageId = null,
            lastMessageId = null,
            selectedAttachmentId = null,
            activeConversationTitle = null,
            activeContactDisplayName = null,
            selectedMessagePreview = null,
            lastMessagePreview = null,
            selectedAttachmentName = null,
            revision = revision + 1
        )

    /** Safe, display-only context passed to the local LLM; it contains no IDs. */
    fun toDialogueView() = VoiceDialogueContextView(
        screen = screen,
        activeConversationTitle = activeConversationTitle,
        activeContactDisplayName = activeContactDisplayName,
        hasActiveConversation = activeConversationId != null,
        selectedMessagePreview = selectedMessagePreview,
        lastMessagePreview = lastMessagePreview,
        hasSelectedMessage = selectedMessageId != null,
        hasLastMessage = lastMessageId != null,
        selectedAttachmentName = selectedAttachmentName,
        hasSelectedAttachment = selectedAttachmentId != null
    )
}

data class VoiceDialogueContextView(
    val screen: VoiceScreen,
    val activeConversationTitle: String?,
    val activeContactDisplayName: String?,
    val hasActiveConversation: Boolean,
    val selectedMessagePreview: String?,
    val lastMessagePreview: String?,
    val hasSelectedMessage: Boolean,
    val hasLastMessage: Boolean,
    val selectedAttachmentName: String?,
    val hasSelectedAttachment: Boolean
)

enum class VoiceScreen { UNKNOWN, CHATS, CONVERSATION, CONTACTS, MEDIA, SETTINGS }
