package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class FloustreamVoiceCommandParserTest {
    private val parser = FloustreamVoiceCommandParser()

    @Test fun acceptsOnlyApprovedHandsFreeCommands() {
        assertEquals("open_chats", parser.parse("Флоу, открой")?.name)
        assertEquals("open_chats", parser.parse("Флоу открой приложение")?.name)
        assertEquals("start_voice_recording", parser.parse("Флоу, запиши голосовое")?.name)
        assertEquals("active", parser.parse("Флоу, запиши голосовое")?.arguments?.get("conversation_ref"))
        assertEquals("stop_voice_recording", parser.parse("Стоп")?.name)
    }

    @Test fun opensOnlyExplicitlyNamedConversation() {
        val result = parser.parse("Флоу, открой чат Иван Иванов")
        assertEquals("open_conversation", result?.name)
        assertEquals("иван иванов", result?.arguments?.get("conversation_ref"))
        assertEquals(false, result?.arguments?.containsKey("conversation_id"))
    }

    @Test fun acceptsOptionalPrepositionBeforeConversationName() {
        assertEquals(
            "иван иванов",
            parser.parse("Флоу, открой чат с Иван Иванов")?.arguments?.get("conversation_ref")
        )
    }

    @Test fun rejectsUnsupportedOrAmbiguousCommands() {
        assertNull(parser.parse(""))
        assertNull(parser.parse("Флоу"))
        assertNull(parser.parse("найди человека Иван"))
        assertNull(parser.parse("создай чат с Иваном"))
        assertNull(parser.parse("отправь сообщение Ивану привет"))
        assertNull(parser.parse("удали всё"))
        assertNull(parser.parse("сделай что-нибудь"))
    }
}
