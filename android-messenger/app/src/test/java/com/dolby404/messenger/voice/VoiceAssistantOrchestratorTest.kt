package com.dolby404.messenger.voice

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceAssistantOrchestratorTest {
    private val resolver = object : VoiceEntityResolver {
        override suspend fun conversationId(reference: String, context: VoiceConversationContext) =
            if (reference == "active") context.activeConversationId else null
        override suspend fun messageId(reference: String, context: VoiceConversationContext) =
            if (reference == "last") context.lastMessageId else null
        override suspend fun attachmentId(reference: String, context: VoiceConversationContext) =
            if (reference == "selected") context.selectedAttachmentId else null
        override suspend fun contactId(reference: String, context: VoiceConversationContext) =
            if (reference == "current") context.activeContactId else null
        override suspend fun siteMediaId(reference: String, context: VoiceConversationContext) =
            if (reference == "featured") "site-media-1" else null
    }

    @Test fun safeNavigationExecutesWithoutConfirmation() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val orchestrator = VoiceAssistantOrchestrator(
            VoiceIntentBinder(resolver),
            VoiceActionExecutor { action -> executed += action; VoiceExecutionResult.Success("Готово") },
            VoiceConfirmationGate { "confirm-1" },
            { 100L }
        )
        val result = orchestrator.handle(VoiceModelIntent("open_chats"), VoiceConversationContext())
        assertTrue(result is VoiceTurnResult.Executed)
        assertEquals(listOf(VoiceAction.OpenChats), executed)
    }

    @Test fun sendMessageWaitsForExactConfirmation() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val orchestrator = VoiceAssistantOrchestrator(
            VoiceIntentBinder(resolver),
            VoiceActionExecutor { action -> executed += action; VoiceExecutionResult.Success("Отправлено") },
            VoiceConfirmationGate { "confirm-2" },
            { 100L }
        )
        val context = VoiceConversationContext().enterConversation("chat-1")
        val pending = orchestrator.handle(
            VoiceModelIntent("send_message", mapOf("conversation_ref" to "active", "text" to "Привет")),
            context
        ) as VoiceTurnResult.AwaitingConfirmation
        assertTrue(executed.isEmpty())
        assertEquals(VoiceAction.SendMessage("chat-1", "Привет"), 
            (orchestrator.confirm(pending.token, context) as VoiceTurnResult.Executed).let {
                executed.single()
            })
    }

    @Test fun navigationInvalidatesPendingConfirmation() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val orchestrator = VoiceAssistantOrchestrator(
            VoiceIntentBinder(resolver),
            VoiceActionExecutor { action -> executed += action; VoiceExecutionResult.Success("OK") },
            VoiceConfirmationGate { "confirm-3" },
            { 100L }
        )
        val context = VoiceConversationContext().enterConversation("chat-1")
        val pending = orchestrator.handle(
            VoiceModelIntent("send_message", mapOf("conversation_ref" to "active", "text" to "x")),
            context
        ) as VoiceTurnResult.AwaitingConfirmation
        val result = orchestrator.confirm(pending.token, context.leaveConversation())
        assertTrue(result is VoiceTurnResult.Rejected)
        assertTrue(executed.isEmpty())
    }
}
