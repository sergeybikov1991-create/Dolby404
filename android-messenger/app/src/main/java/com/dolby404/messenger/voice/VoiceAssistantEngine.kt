package com.dolby404.messenger.voice

/**
 * Runs the fixed offline command parser and the app-owned safe action pipeline.
 * No conversation history, LLM, free-form dialogue or spoken response exists here.
 */
class VoiceAssistantEngine(
    private val orchestrator: VoiceAssistantOrchestrator
) {
    private val parser = FloustreamVoiceCommandParser()

    suspend fun onFinalTranscript(
        transcript: String,
        context: VoiceConversationContext
    ): VoiceTurnResult {
        val intent = parser.parse(transcript)
            ?: return VoiceTurnResult.Rejected("Команда не распознана")
        return orchestrator.handle(intent, context)
    }
}
