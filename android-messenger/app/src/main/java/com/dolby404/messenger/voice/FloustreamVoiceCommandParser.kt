package com.dolby404.messenger.voice

/**
 * Strict, deterministic parser for the first FLOUSTREAM hands-free release.
 * Only the explicitly approved commands are accepted. Unknown phrases never
 * trigger broad search, contact discovery, message generation or other actions.
 */
class FloustreamVoiceCommandParser {

    fun parse(transcript: String): VoiceModelIntent? {
        val text = normalize(transcript)
            .replace(Regex("^(?:флоу|flow)\\s+"), "")
            .trim()
        if (text.isEmpty()) return null

        return when {
            text in setOf("открой", "открой приложение", "открой чаты", "перейди в чаты") ->
                intent("open_chats")
            text in setOf("запиши голосовое", "начни запись голосового", "начни записывать голосовое") ->
                intent("start_voice_recording", "conversation_ref" to "active")
            text in setOf("стоп", "останови запись", "останови голосовое") ->
                intent("stop_voice_recording")
            else -> {
                val reference = Regex("^открой чат(?: с)?\\s+(.+)$")
                    .matchEntire(text)?.groupValues?.getOrNull(1)?.trim()
                if (reference.isNullOrBlank()) null
                else intent("open_conversation", "conversation_ref" to reference)
            }
        }
    }

    private fun normalize(value: String): String = value
        .lowercase()
        .replace('ё', 'е')
        .replace(Regex("[.!?,;:]+"), " ")
        .replace(Regex("\\s+"), " ")
        .trim()

    private fun intent(name: String, vararg args: Pair<String, String>) =
        VoiceModelIntent(name, args.toMap())
}
