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
        assertEquals("Анной", result?.arguments?.get("conversation_ref"))
        assertEquals(false, result?.arguments?.containsKey("conversation_id"))
    }

    @Test fun mapsMediaCommands() {
        assertEquals("capture_photo", parser.parse("Сфотографируй")?.name)
        assertEquals("capture_video", parser.parse("Сними видео")?.name)
        assertEquals("pick_photo", parser.parse("Прикрепи фото")?.name)
        assertEquals("pick_video", parser.parse("Выбери видео")?.name)
        assertEquals("photo", parser.parse("Найди фото")?.arguments?.get("media_kind"))
    }

    @Test fun mapsVoiceRecordingCommands() {
        assertEquals("start_voice_recording", parser.parse("Запиши голосовое")?.name)
        assertEquals("stop_voice_recording", parser.parse("Останови запись")?.name)
    }

    @Test fun mapsCallCommandsToContactReferences() {
        assertEquals("start_audio_call", parser.parse("Позвони Анне")?.name)
        assertEquals("Анне", parser.parse("Позвони Анне")?.arguments?.get("contact_ref"))
        assertEquals("start_video_call", parser.parse("Начни видеозвонок Анне")?.name)
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
