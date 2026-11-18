package com.dolby404.messenger.voice

/**
 * Joins recognized text, bounded dialogue history and the safe command pipeline.
 * It deliberately knows nothing about Android Views, Supabase or chat storage.
 */
class VoiceAssistantEngine(
    private val dialogue: VoiceDialogueEngine,
    private val orchestrator: VoiceAssistantOrchestrator,
    private val maxHistoryTurns: Int = 8
) {
    private val historyLock = Any()
    private val history = mutableListOf<VoiceDialogueTurn>()

    init {
        require(maxHistoryTurns > 0)
    }

    suspend fun onFinalTranscript(
        transcript: String,
        context: VoiceConversationContext
    ): VoiceTurnResult {
        val clean = transcript.trim()
        if (clean.isEmpty()) {
            return VoiceTurnResult.ClarificationRequired("Я не расслышал команду. Повторите, пожалуйста")
        }

        val snapshot = synchronized(historyLock) { history.toList() }
        val intent = dialogue.interpret(clean, context, snapshot)
            ?: return rememberAndReturn(
                clean,
                VoiceTurnResult.ClarificationRequired("Уточните, пожалуйста, что нужно сделать")
            )

        return rememberAndReturn(clean, orchestrator.handle(intent, context))
    }

    suspend fun confirm(
        token: String,
        context: VoiceConversationContext
    ): VoiceTurnResult = orchestrator.confirm(token, context)

    fun cancelPendingConfirmation() = orchestrator.cancelPendingConfirmation()

    fun clearConversationMemory() {
        synchronized(historyLock) { history.clear() }
        orchestrator.cancelPendingConfirmation()
    }

    fun historySnapshot(): List<VoiceDialogueTurn> =
        synchronized(historyLock) { history.toList() }

    private fun rememberAndReturn(
        transcript: String,
        result: VoiceTurnResult
    ): VoiceTurnResult {
        val response = when (result) {
            is VoiceTurnResult.Executed -> when (val execution = result.result) {
                is VoiceExecutionResult.Success -> execution.spokenSummary
                is VoiceExecutionResult.NeedsDisambiguation -> execution.question
                is VoiceExecutionResult.Failure -> execution.userMessage
            }
            is VoiceTurnResult.AwaitingConfirmation -> result.prompt
            is VoiceTurnResult.ClarificationRequired -> result.question
            is VoiceTurnResult.Rejected -> result.reason
        }
        synchronized(historyLock) {
            history += VoiceDialogueTurn(VoiceDialogueRole.USER, transcript)
            history += VoiceDialogueTurn(VoiceDialogueRole.ASSISTANT, response)
            val maxEntries = maxHistoryTurns * 2
            while (history.size > maxEntries) history.removeAt(0)
        }
        return result
    }
}
