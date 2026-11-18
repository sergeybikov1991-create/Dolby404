package com.dolby404.messenger.voice

/**
 * Ephemeral, app-owned context for follow-up references such as "ей", "последнее
 * сообщение" and "это фото". Never populate these IDs from model output.
 */
data class VoiceConversationContext(
    val screen: VoiceScreen = VoiceScreen.UNKNOWN,
    val activeConversationId: String? = null,
    val activeContactId: String? = null,
    val selectedMessageId: String? = null,
    val lastMessageId: String? = null,
    val selectedAttachmentId: String? = null,
    /** Incremented whenever navigation or selection changes. */
    val revision: Long = 0L
) {
    fun enterConversation(conversationId: String, contactId: String? = null) =
        copy(
            screen = VoiceScreen.CONVERSATION,
            activeConversationId = conversationId,
            activeContactId = contactId,
            selectedMessageId = null,
            lastMessageId = null,
            selectedAttachmentId = null,
            revision = revision + 1
        )

    fun selectMessage(messageId: String, isLatest: Boolean = false) =
        copy(
            selectedMessageId = messageId,
            lastMessageId = if (isLatest) messageId else lastMessageId,
            revision = revision + 1
        )

    fun observeLatestMessage(messageId: String) =
        copy(lastMessageId = messageId, revision = revision + 1)

    fun selectAttachment(attachmentId: String) =
        copy(selectedAttachmentId = attachmentId, revision = revision + 1)

    fun leaveConversation() =
        copy(
            screen = VoiceScreen.CHATS,
            activeConversationId = null,
            activeContactId = null,
            selectedMessageId = null,
            lastMessageId = null,
            selectedAttachmentId = null,
            revision = revision + 1
        )
}

enum class VoiceScreen { UNKNOWN, CHATS, CONVERSATION, CONTACTS, MEDIA, SETTINGS }
