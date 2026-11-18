package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class VoiceConversationContextTest {

    @Test fun dialogueViewContainsDisplayContextButNoDatabaseIdentifiers() {
        val context = VoiceConversationContext()
            .enterConversation("private-chat-id", "private-contact-id", "Чат с Анной", "Анна")
            .selectMessage("private-message-id", isLatest = true, preview = "Привет")
            .selectAttachment("private-attachment-id", "photo.jpg")
        val view = context.toDialogueView()
        assertEquals("Чат с Анной", view.activeConversationTitle)
        assertEquals("Анна", view.activeContactDisplayName)
        assertEquals("Привет", view.lastMessagePreview)
        assertEquals("photo.jpg", view.selectedAttachmentName)
        assertEquals(true, view.hasActiveConversation)
    }

    @Test fun enteringAndLeavingConversationUpdatesScopedReferences() {
        val opened = VoiceConversationContext().enterConversation("c-1", "u-1")
        assertEquals(VoiceScreen.CONVERSATION, opened.screen)
        assertEquals("c-1", opened.activeConversationId)
        assertEquals("u-1", opened.activeContactId)

        val selected = opened.selectMessage("m-1", isLatest = true).selectAttachment("a-1")
        assertEquals("m-1", selected.selectedMessageId)
        assertEquals("m-1", selected.lastMessageId)
        assertEquals("a-1", selected.selectedAttachmentId)

        val left = selected.leaveConversation()
        assertEquals(VoiceScreen.CHATS, left.screen)
        assertNull(left.activeConversationId)
        assertNull(left.lastMessageId)
        assertNull(left.selectedAttachmentId)
        assertEquals(true, left.revision > opened.revision)
    }
}
