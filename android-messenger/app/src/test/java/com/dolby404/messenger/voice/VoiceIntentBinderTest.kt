package com.dolby404.messenger.voice

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceIntentBinderTest {
    private val resolver = object : VoiceEntityResolver {
        override suspend fun conversationId(reference: String, context: VoiceConversationContext) =
            when (reference) {
                "active" -> context.activeConversationId
                "Анна" -> "conversation-anna"
                else -> null
            }
        override suspend fun messageId(reference: String, context: VoiceConversationContext) =
            when (reference) {
                "last" -> context.lastMessageId
                "selected" -> context.selectedMessageId
                else -> null
            }
        override suspend fun attachmentId(reference: String, context: VoiceConversationContext) =
            if (reference == "selected") context.selectedAttachmentId else null
        override suspend fun contactId(reference: String, context: VoiceConversationContext) =
            when (reference) {
                "Анна" -> "contact-anna"
                "current" -> context.activeContactId
                else -> null
            }
        override suspend fun siteMediaId(reference: String, context: VoiceConversationContext) =
            if (reference == "featured") "site-media-1" else null
    }

    @Test fun bindsActiveConversationFromAppContext() = runBlocking {
        val context = VoiceConversationContext().enterConversation("trusted-chat-id")
        val result = VoiceIntentBinder(resolver).bind(
            VoiceModelIntent("send_message", mapOf("conversation_ref" to "active", "text" to "Привет")),
            context
        ) as VoiceBindingResult.Bound
        assertEquals("trusted-chat-id", result.intent.arguments["conversation_id"])
    }

    @Test fun discardsDatabaseIdsInventedByModel() = runBlocking {
        val result = VoiceIntentBinder(resolver).bind(
            VoiceModelIntent("send_message", mapOf("conversation_id" to "attacker-chosen-id", "text" to "x")),
            VoiceConversationContext()
        )
        assertTrue(result is VoiceBindingResult.Clarify)
        if (result is VoiceBindingResult.Bound) {
            assertFalse(result.intent.arguments.containsKey("conversation_id"))
        }
    }

    @Test fun resolvesMessageAndTargetConversationFromReferences() = runBlocking {
        val context = VoiceConversationContext()
            .enterConversation("trusted-chat")
            .selectMessage("trusted-message", isLatest = true)
        val result = VoiceIntentBinder(resolver).bind(
            VoiceModelIntent(
                "forward_message",
                mapOf("message_ref" to "last", "target_conversation_ref" to "Анна")
            ),
            context
        ) as VoiceBindingResult.Bound
        assertEquals("trusted-message", result.intent.arguments["message_id"])
        assertEquals("conversation-anna", result.intent.arguments["target_conversation_id"])
    }


    @Test fun followsActiveChatAndLastMessageWithoutRepeatingNames() = runBlocking {
        val context = VoiceConversationContext()
            .enterConversation("trusted-chat", "trusted-contact")
            .selectMessage("trusted-last", isLatest = true)
        val binder = VoiceIntentBinder(resolver)

        val reply = binder.bind(
            VoiceModelIntent("reply_to_message", mapOf("text" to "Спасибо")),
            context
        ) as VoiceBindingResult.Bound
        assertEquals("trusted-chat", reply.intent.arguments["conversation_id"])
        assertEquals("trusted-last", reply.intent.arguments["message_id"])

        val call = binder.bind(
            VoiceModelIntent("start_audio_call"),
            context
        ) as VoiceBindingResult.Bound
        assertEquals("trusted-contact", call.intent.arguments["contact_id"])
    }

    @Test fun unresolvedReferencesRequireClarification() = runBlocking {
        val result = VoiceIntentBinder(resolver).bind(
            VoiceModelIntent("open_conversation", mapOf("conversation_ref" to "неизвестный контакт")),
            VoiceConversationContext()
        )
        assertTrue(result is VoiceBindingResult.Clarify)
    }
}
