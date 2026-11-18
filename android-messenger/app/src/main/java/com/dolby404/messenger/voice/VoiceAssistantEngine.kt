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
    private var pendingConfirmationToken: String? = null

    /** First-release constructor: deterministic offline commands, no LLM required. */
    constructor(
        orchestrator: VoiceAssistantOrchestrator,
        maxHistoryTurns: Int = 8
    ) : this(
        dialogue = RuleBasedVoiceDialogueEngine(),
        orchestrator = orchestrator,
        maxHistoryTurns = maxHistoryTurns
    )

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

        val pending = synchronized(historyLock) { pendingConfirmationToken }
        if (pending != null) {
            if (isConfirmation(clean)) {
                return rememberAndReturn(clean, confirm(pending, context))
            }
            if (isCancellation(clean)) {
                cancelPendingConfirmation()
                return rememberAndReturn(clean, VoiceTurnResult.Cancelled("Хорошо, отменил действие"))
            }
            // A new command replaces the old unconfirmed action; it is never executed.
            cancelPendingConfirmation()
        }

        val snapshot = synchronized(historyLock) { history.toList() }
        val intent = dialogue.interpret(clean, context.toDialogueView(), snapshot)
            ?: return rememberAndReturn(
                clean,
                VoiceTurnResult.ClarificationRequired("Уточните, пожалуйста, что нужно сделать")
            )

        val result = orchestrator.handle(intent, context)
        if (result is VoiceTurnResult.AwaitingConfirmation) {
            synchronized(historyLock) { pendingConfirmationToken = result.token }
        }
        return rememberAndReturn(clean, result)
    }

    suspend fun confirm(token: String, context: VoiceConversationContext): VoiceTurnResult {
        synchronized(historyLock) {
            if (pendingConfirmationToken != token) {
                return VoiceTurnResult.Rejected("Подтверждение уже недействительно")
            }
            pendingConfirmationToken = null
        }
        return orchestrator.confirm(token, context)
    }

    fun cancelPendingConfirmation() {
        synchronized(historyLock) { pendingConfirmationToken = null }
        orchestrator.cancelPendingConfirmation()
    }

    fun clearConversationMemory() {
        synchronized(historyLock) {
            history.clear()
            pendingConfirmationToken = null
        }
        orchestrator.cancelPendingConfirmation()
    }

    fun historySnapshot(): List<VoiceDialogueTurn> =
        synchronized(historyLock) { history.toList() }

    private fun isConfirmation(text: String): Boolean =
        text.lowercase().replace(Regex("[.!?,]+"), "").trim() in setOf(
            "да", "да подтверждаю", "подтверждаю", "подтвердить",
            "отправляй", "начинай", "принимаю"
        )

    private fun isCancellation(text: String): Boolean =
        text.lowercase().replace(Regex("[.!?,]+"), "").trim() in setOf(
            "нет", "отмена", "отмени", "не надо", "не подтверждаю"
        )

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
            is VoiceTurnResult.Cancelled -> result.spokenMessage
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
