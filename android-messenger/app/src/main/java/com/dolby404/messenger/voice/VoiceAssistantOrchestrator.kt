package com.dolby404.messenger.voice

/** Result presented by the voice UI; spoken strings are supplied by the app layer. */
sealed interface VoiceTurnResult {
    data class Executed(val result: VoiceExecutionResult) : VoiceTurnResult
    data class AwaitingConfirmation(val token: String, val prompt: String) : VoiceTurnResult
    data class ClarificationRequired(val question: String) : VoiceTurnResult
    data class Rejected(val reason: String) : VoiceTurnResult
    data class Cancelled(val spokenMessage: String) : VoiceTurnResult
}

/**
 * Coordinates binding -> allow-list routing -> one-shot confirmation -> existing
 * app action executor. It does not parse natural language or own chat persistence.
 */
class VoiceAssistantOrchestrator(
    private val binder: VoiceIntentBinder,
    private val executor: VoiceActionExecutor,
    private val confirmationGate: VoiceConfirmationGate,
    private val nowMillis: () -> Long
) {
    suspend fun handle(
        modelIntent: VoiceModelIntent,
        context: VoiceConversationContext
    ): VoiceTurnResult {
        return when (val binding = binder.bind(modelIntent, context)) {
            is VoiceBindingResult.Clarify -> VoiceTurnResult.ClarificationRequired(binding.question)
            is VoiceBindingResult.Reject -> VoiceTurnResult.Rejected(binding.reason)
            is VoiceBindingResult.Bound -> when (val decision = VoiceCommandRouter.route(binding.intent)) {
                is VoiceCommandDecision.ExecuteSafely ->
                    VoiceTurnResult.Executed(executor.execute(decision.action))
                is VoiceCommandDecision.AskForConfirmation -> {
                    val pending = confirmationGate.request(
                        action = decision.action,
                        prompt = decision.prompt,
                        contextRevision = context.revision,
                        nowMillis = nowMillis()
                    )
                    VoiceTurnResult.AwaitingConfirmation(pending.token, pending.prompt)
                }
                is VoiceCommandDecision.Reject -> VoiceTurnResult.Rejected(decision.reason)
            }
        }
    }

    fun cancelPendingConfirmation() {
        confirmationGate.cancel()
    }

    suspend fun confirm(token: String, currentContext: VoiceConversationContext): VoiceTurnResult {
        val action = confirmationGate.confirm(
            token = token,
            contextRevision = currentContext.revision,
            nowMillis = nowMillis()
        ) ?: return VoiceTurnResult.Rejected("Подтверждение устарело. Повторите команду")
        return VoiceTurnResult.Executed(executor.execute(action))
    }

    fun cancelPendingConfirmation() = confirmationGate.cancel()
}
