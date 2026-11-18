package com.dolby404.messenger.voice

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceAssistantEngineTest {
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

    private fun engine(dialogue: VoiceDialogueEngine, executed: MutableList<VoiceAction>) =
        VoiceAssistantEngine(
            dialogue,
            VoiceAssistantOrchestrator(
                VoiceIntentBinder(resolver),
                VoiceActionExecutor { action ->
                    executed += action
                    VoiceExecutionResult.Success("Готово")
                },
                VoiceConfirmationGate { "engine-token" },
                { 10L }
            ),
            maxHistoryTurns = 2
        )

    @Test fun passesTranscriptToDialogueAndExecutesSafeAction() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        var heard = ""
        val engine = engine(
            VoiceDialogueEngine { transcript, _, _ ->
                heard = transcript
                VoiceModelIntent("open_chats")
            },
            executed
        )
        val result = engine.onFinalTranscript("  Открой чаты  ", VoiceConversationContext())
        assertTrue(result is VoiceTurnResult.Executed)
        assertEquals("Открой чаты", heard)
        assertEquals(listOf(VoiceAction.OpenChats), executed)
        assertEquals(2, engine.historySnapshot().size)
    }

    @Test fun boundsHistoryAndClearsPendingContext() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val engine = engine(VoiceDialogueEngine { _, _, _ -> VoiceModelIntent("open_chats") }, executed)
        repeat(4) { engine.onFinalTranscript("Команда $it", VoiceConversationContext()) }
        assertEquals(4, engine.historySnapshot().size)
        engine.clearConversationMemory()
        assertTrue(engine.historySnapshot().isEmpty())
    }


    @Test fun spokenYesConfirmsPendingSendWithoutCallingDialogueAgain() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        var dialogueCalls = 0
        val engine = engine(
            VoiceDialogueEngine { _, _, _ ->
                dialogueCalls += 1
                VoiceModelIntent(
                    "send_message",
                    mapOf("conversation_ref" to "active", "text" to "Привет")
                )
            },
            executed
        )
        val context = VoiceConversationContext().enterConversation("chat-1")
        val pending = engine.onFinalTranscript("Отправь привет", context)
        assertTrue(pending is VoiceTurnResult.AwaitingConfirmation)

        val confirmed = engine.onFinalTranscript("Да", context)
        assertTrue(confirmed is VoiceTurnResult.Executed)
        assertEquals(1, dialogueCalls)
        assertEquals(listOf(VoiceAction.SendMessage("chat-1", "Привет")), executed)
    }

    @Test fun spokenNoCancelsPendingAction() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val engine = engine(
            VoiceDialogueEngine { _, _, _ ->
                VoiceModelIntent("send_message", mapOf("conversation_ref" to "active", "text" to "Привет"))
            },
            executed
        )
        val context = VoiceConversationContext().enterConversation("chat-1")
        engine.onFinalTranscript("Отправь привет", context)
        val cancelled = engine.onFinalTranscript("Нет", context)
        assertTrue(cancelled is VoiceTurnResult.Cancelled)
        assertTrue(executed.isEmpty())
    }

    @Test fun defaultConstructorUsesDeterministicOfflineCommands() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        val orchestrator = VoiceAssistantOrchestrator(
            VoiceIntentBinder(resolver),
            VoiceActionExecutor { action ->
                executed += action
                VoiceExecutionResult.Success("Открыл раздел чатов")
            },
            VoiceConfirmationGate { "default-engine-token" },
            { 10L }
        )
        val engine = VoiceAssistantEngine(orchestrator)
        val result = engine.onFinalTranscript("Открой чаты", VoiceConversationContext())
        assertTrue(result is VoiceTurnResult.Executed)
        assertEquals(listOf(VoiceAction.OpenChats), executed)
    }

    @Test fun emptyTranscriptDoesNotCallDialogue() = runBlocking {
        val executed = mutableListOf<VoiceAction>()
        var called = false
        val engine = engine(VoiceDialogueEngine { _, _, _ -> called = true; null }, executed)
        val result = engine.onFinalTranscript("  ", VoiceConversationContext())
        assertTrue(result is VoiceTurnResult.ClarificationRequired)
        assertEquals(false, called)
    }
}
