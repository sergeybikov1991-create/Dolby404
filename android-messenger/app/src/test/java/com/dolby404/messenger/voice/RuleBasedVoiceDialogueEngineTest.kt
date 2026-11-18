package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class RuleBasedVoiceDialogueEngineTest {
    private val parser = RuleBasedVoiceDialogueEngine()

    @Test fun opensCommonSectionsWithoutModel() {
        assertEquals("open_chats", parser.parse("Открой чаты")?.name)
        assertEquals("open_contacts", parser.parse("Покажи контакты")?.name)
        assertEquals("show_media", parser.parse("Открой галерею")?.name)
        assertEquals("show_unread", parser.parse("Покажи непрочитанные чаты")?.name)
    }

    @Test fun keepsContactNamesAsReferencesNotDatabaseIds() {
        val result = parser.parse("Открой чат с Анной")
        assertEquals("open_conversation", result?.name)
        assertEquals("анной", result?.arguments?.get("conversation_ref"))
        assertEquals(false, result?.arguments?.containsKey("conversation_id"))
    }

    @Test fun mapsMediaCommands() {
        assertEquals("capture_photo", parser.parse("Сфотографируй")?.name)
        assertEquals("capture_video", parser.parse("Сними видео")?.name)
        assertEquals("pick_photo", parser.parse("Прикрепи фото")?.name)
        assertEquals("pick_video", parser.parse("Выбери видео")?.name)
        assertEquals("photo", parser.parse("Найди фото")?.arguments?.get("media_kind"))
    }

    @Test fun doesNotUseAssistantMicrophoneToControlVoiceMessageRecording() {
        assertNull(parser.parse("Запиши голосовое"))
        assertNull(parser.parse("Останови запись"))
    }

    @Test fun mapsCallCommandsToContactReferences() {
        assertEquals("start_audio_call", parser.parse("Позвони Анне")?.name)
        assertEquals("анне", parser.parse("Позвони Анне")?.arguments?.get("contact_ref"))
        assertEquals("start_video_call", parser.parse("Начни видеозвонок Анне")?.name)
    }

    @Test fun preparesDraftAndRequestsConfirmedSendWithoutGeneratingIds() {
        val draft = parser.parse("Напиши сообщение Анне: скоро буду")
        assertEquals("prepare_message_draft", draft?.name)
        assertEquals("анне", draft?.arguments?.get("recipient"))
        assertEquals("скоро буду", draft?.arguments?.get("text"))

        val send = parser.parse("Отправь Анне: я уже подъехал")
        assertEquals("send_message", send?.name)
        assertEquals("анне", send?.arguments?.get("conversation_ref"))
        assertEquals("я уже подъехал", send?.arguments?.get("text"))
        assertEquals(false, send?.arguments?.containsKey("conversation_id"))
    }

    @Test fun mapsReplyToLastMessageWithoutInventingIds() {
        val result = parser.parse("Ответь на последнее сообщение скоро буду")
        assertEquals("reply_to_message", result?.name)
        assertEquals("last", result?.arguments?.get("message_ref"))
        assertEquals("скоро буду", result?.arguments?.get("text"))
        assertEquals(false, result?.arguments?.containsKey("message_id"))
    }

    @Test fun normalizesRussianYoAndPunctuation() {
        assertEquals("open_chats", parser.parse("Открой чаты!")?.name)
    }

    @Test fun doesNotGuessUnknownOrAmbiguousCommands() {
        assertNull(parser.parse(""))
        assertNull(parser.parse("удали всё"))
        assertNull(parser.parse("сделай что-нибудь"))
    }
}
