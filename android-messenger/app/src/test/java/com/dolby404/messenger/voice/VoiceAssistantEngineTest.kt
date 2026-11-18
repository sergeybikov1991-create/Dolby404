package com.dolby404.messenger.voice

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceAssistantEngineTest {
    private val resolver = object : VoiceEntityResolver {
        override suspend fun conversationId(reference: String, context: VoiceConversationContext): String? =
            when (reference) {
                "active" -> context.activeConversationId
                "иван иванов" -> "saved-chat-1"
                else -> null
            }
        override suspend fun messageId(reference: String, context: VoiceConversationContext): String? = null
        override suspend fun attachmentId(reference: String, context: VoiceConversationContext): String? = null
        override suspend fun contactId(reference: String, context: VoiceConversationContext): String? = null
        override suspend fun siteMediaId(reference: String, context: VoiceConversationContext): String? = null
    }

    private fun engine(executed: MutableList<VoiceAction>) = VoiceAssistantEngine(
        VoiceAssistantOrchestrator(
            binder = VoiceIntentBinder(resolver),
            executor = VoiceActionExecutor { action ->
                executed += action
                VoiceExecutionResult.Success("ok")
            },
        )
    )

    @Test fun opensChatList() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val result = engine(executed).onFinalTranscript("Флоу, открой", VoiceConversationContext())
        assertTrue(result is VoiceTurnResult.Executed)
        assertEquals(listOf(VoiceAction.OpenChats), executed)
    }

    @Test fun opensOnlyResolvedSavedConversation() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val result = engine(executed).onFinalTranscript(
            "открой чат Иван Иванов",
            VoiceConversationContext()
        )
        assertTrue(result is VoiceTurnResult.Executed)
        assertEquals(listOf(VoiceAction.OpenConversation("saved-chat-1")), executed)
    }

    @Test fun refusesConversationNotFoundInSavedInbox() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val result = engine(executed).onFinalTranscript(
            "открой чат Пётр Петров",
            VoiceConversationContext()
        )
        assertTrue(result is VoiceTurnResult.ClarificationRequired)
        assertTrue(executed.isEmpty())
    }

    @Test fun startsAndStopsVoiceMessageRecordingWithCommands() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val engine = engine(executed)
        val context = VoiceConversationContext().enterConversation("chat-1")
        assertTrue(engine.onFinalTranscript("запиши голосовое", context) is VoiceTurnResult.Executed)
        assertTrue(engine.onFinalTranscript("Стоп", context) is VoiceTurnResult.Executed)
        assertEquals(
            listOf(
                VoiceAction.StartVoiceMessageRecording("chat-1"),
                VoiceAction.StopVoiceMessageRecording
            ),
            executed
        )
    }

    @Test fun rejectsEverythingOutsideTheApprovedCommandSet() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val result = engine(executed).onFinalTranscript("отправь сообщение привет", VoiceConversationContext())
        assertTrue(result is VoiceTurnResult.Rejected)
        assertTrue(executed.isEmpty())
    }
}
