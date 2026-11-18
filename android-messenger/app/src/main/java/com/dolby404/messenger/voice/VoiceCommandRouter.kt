package com.dolby404.messenger.voice

/**
 * Converts allow-listed model intents into typed app-owned decisions.
 * It never performs database, network, Android, or UI operations itself.
 */
object VoiceCommandRouter {
    private fun arg(intent: VoiceModelIntent, key: String): String =
        intent.arguments[key]?.trim().orEmpty()

    private fun required(intent: VoiceModelIntent, key: String): String? =
        arg(intent, key).takeIf { it.isNotBlank() }

    private fun safe(action: VoiceAction) = VoiceCommandDecision.ExecuteSafely(action)
    private fun missing(message: String) = VoiceCommandDecision.Reject(message)

    fun route(intent: VoiceModelIntent): VoiceCommandDecision {
        return when (intent.name) {
            "open_chats" -> safe(VoiceAction.OpenChats)
            "open_conversation" -> required(intent, "conversation_id")?.let {
                safe(VoiceAction.OpenConversation(it))
            } ?: missing("Не удалось определить сохранённую переписку")
            "start_voice_recording" -> required(intent, "conversation_id")?.let {
                safe(VoiceAction.StartVoiceMessageRecording(it))
            } ?: missing("Сначала откройте сохранённую переписку")
            "stop_voice_recording" -> safe(VoiceAction.StopVoiceMessageRecording)
            else -> missing("Эта голосовая команда не поддерживается")
        }
    }

}
