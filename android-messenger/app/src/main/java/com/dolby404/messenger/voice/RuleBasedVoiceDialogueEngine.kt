package com.dolby404.messenger.voice

/**
 * Deterministic Russian command parser for the first FLOUSTREAM voice release.
 *
 * No LLM, network request, model weights or runtime download is required.
 * Unknown or ambiguous phrases are deliberately left unsupported instead of
 * guessing. Entity names are user-facing references; VoiceIntentBinder resolves
 * them through app-owned repositories before any action can execute.
 */
class RuleBasedVoiceDialogueEngine : VoiceDialogueEngine {

    override suspend fun interpret(
        transcript: String,
        context: VoiceDialogueContextView,
        history: List<VoiceDialogueTurn>
    ): VoiceModelIntent? = parse(transcript)

    fun parse(transcript: String): VoiceModelIntent? {
        val text = normalize(transcript)
        if (text.isEmpty()) return null

        when (text) {
            "открой чаты", "открой чат", "перейди в чаты", "покажи чаты" ->
                return intent("open_chats")
            "открой контакты", "перейди в контакты", "покажи контакты" ->
                return intent("open_contacts")
            "открой медиа", "покажи медиа", "открой галерею", "покажи галерею" ->
                return intent("show_media")
            "покажи непрочитанные", "покажи непрочитанные чаты", "открой непрочитанные" ->
                return intent("show_unread")
            "сфотографируй", "сделай фото", "сделай фотографию", "открой камеру фото" ->
                return intent("capture_photo")
            "сними видео", "запиши видео", "открой камеру видео" ->
                return intent("capture_video")
            "выбери фото", "выбери фотографию", "прикрепи фото", "добавь фото" ->
                return intent("pick_photo")
            "выбери видео", "прикрепи видео", "добавь видео" ->
                return intent("pick_video")
            "выбери файл", "прикрепи файл", "добавь файл" ->
                return intent("pick_file")
        }

        match(text, "^(?:открой|открой чат с|перейди в переписку с) (?:чат с )?(.+)$")?.let {
            return intent("open_conversation", "conversation_ref" to it)
        }
        match(text, "^(?:найди|поищи) (?:чат|переписку) с (.+)$")?.let {
            return intent("search_conversations", "query" to it)
        }
        match(text, "^(?:найди|поищи) сообщение (.+)$")?.let {
            return intent("search_messages", "query" to it)
        }
        if (text in setOf("найди фото", "покажи фото", "найди мои фото", "покажи мои фото")) {
            return intent("search_attachments", "media_kind" to "photo")
        }
        if (text in setOf("найди видео", "покажи видео", "найди мои видео", "покажи мои видео")) {
            return intent("search_attachments", "media_kind" to "video")
        }
        match(text, "^(?:позвони|начни аудиозвонок|позвони по аудио) (?:контакту )?(.+)$")?.let {
            return intent("start_audio_call", "contact_ref" to it)
        }
        match(text, "^(?:начни видеозвонок|позвони по видео|видеозвонок) (?:контакту )?(.+)$")?.let {
            return intent("start_video_call", "contact_ref" to it)
        }
        match(text, "^(?:ответь на последнее сообщение|ответь) (.+)$")?.let {
            return intent("reply_to_message", "message_ref" to "last", "text" to it)
        }

        return null
    }

    private fun normalize(value: String): String = value
        .lowercase()
        .replace('ё', 'е')
        .replace(Regex("[.!?,;:]+"), " ")
        .replace(Regex("\\s+"), " ")
        .trim()

    private fun match(value: String, pattern: String): String? =
        Regex(pattern).matchEntire(value)?.groupValues?.getOrNull(1)
            ?.trim()
            ?.takeIf { it.isNotEmpty() }

    private fun intent(name: String, vararg args: Pair<String, String>) =
        VoiceModelIntent(name, args.toMap())
}
