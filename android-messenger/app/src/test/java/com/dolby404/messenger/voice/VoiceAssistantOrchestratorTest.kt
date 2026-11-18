package com.dolby404.messenger.voice

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceAssistantOrchestratorTest {
    private val resolver = object : VoiceEntityResolver {
        override suspend fun conversationId(reference: String, context: VoiceConversationContext) =
            if (reference == "active") context.activeConversationId else null
        override suspend fun messageId(reference: String, context: VoiceConversationContext) = null
        override suspend fun attachmentId(reference: String, context: VoiceConversationContext) = null
        override suspend fun contactId(reference: String, context: VoiceConversationContext) = null
        override suspend fun siteMediaId(reference: String, context: VoiceConversationContext) = null
    }

    @Test fun safelyExecutesAllowListedNavigation() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val orchestrator = VoiceAssistantOrchestrator(
            VoiceIntentBinder(resolver),
            VoiceActionExecutor { action -> executed += action; VoiceExecutionResult.Success("ok") }
        )
        val result = orchestrator.handle(VoiceModelIntent("open_chats"), VoiceConversationContext())
        assertTrue(result is VoiceTurnResult.Executed)
        assertEquals(listOf(VoiceAction.OpenChats), executed)
    }

    @Test fun rejectsUnsupportedIntentWithoutCallingExecutor() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val orchestrator = VoiceAssistantOrchestrator(
            VoiceIntentBinder(resolver),
            VoiceActionExecutor { action -> executed += action; VoiceExecutionResult.Success("unexpected") }
        )
        val result = orchestrator.handle(VoiceModelIntent("run_shell_command"), VoiceConversationContext())
        assertTrue(result is VoiceTurnResult.Rejected)
        assertTrue(executed.isEmpty())
    }
}
