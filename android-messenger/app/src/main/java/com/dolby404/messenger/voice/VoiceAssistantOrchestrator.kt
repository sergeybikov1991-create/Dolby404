package com.dolby404.messenger.voice

sealed interface VoiceTurnResult {
    data class Executed(val result: VoiceExecutionResult) : VoiceTurnResult
    data class ClarificationRequired(val question: String) : VoiceTurnResult
    data class Rejected(val reason: String) : VoiceTurnResult
}

/** Binds a fixed parsed command to app-owned IDs and executes its allow-listed action. */
class VoiceAssistantOrchestrator(
    private val binder: VoiceIntentBinder,
    private val executor: VoiceActionExecutor
) {
    suspend fun handle(
        command: VoiceModelIntent,
        context: VoiceConversationContext
    ): VoiceTurnResult {
        return when (val binding = binder.bind(command, context)) {
            is VoiceBindingResult.Clarify -> VoiceTurnResult.ClarificationRequired(binding.question)
            is VoiceBindingResult.Reject -> VoiceTurnResult.Rejected(binding.reason)
            is VoiceBindingResult.Bound -> when (val decision = VoiceCommandRouter.route(binding.intent)) {
                is VoiceCommandDecision.ExecuteSafely ->
                    VoiceTurnResult.Executed(executor.execute(decision.action))
                is VoiceCommandDecision.Reject -> VoiceTurnResult.Rejected(decision.reason)
            }
        }
    }
}
