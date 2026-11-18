package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceCommandRouterTest {
    private fun route(name: String, vararg args: Pair<String, String>) =
        VoiceCommandRouter.route(VoiceModelIntent(name, mapOf(*args)))

    @Test fun navigationAndSearchAreSafe() {
        assertEquals(VoiceCommandDecision.ExecuteSafely(VoiceAction.OpenChats), route("open_chats"))
        assertEquals(VoiceCommandDecision.ExecuteSafely(VoiceAction.OpenContacts), route("open_contacts"))
        assertEquals(VoiceCommandDecision.ExecuteSafely(VoiceAction.ShowMedia), route("show_media"))
        assertEquals(VoiceCommandDecision.ExecuteSafely(VoiceAction.ShowUnreadConversations), route("show_unread"))
        assertTrue(route("search_conversations", "query" to "Анна") is VoiceCommandDecision.ExecuteSafely)
        assertTrue(route("search_messages", "query" to "фото") is VoiceCommandDecision.ExecuteSafely)
        assertTrue(route("search_attachments", "media_kind" to "photo") is VoiceCommandDecision.ExecuteSafely)
        assertEquals(
            VoiceAction.ReadMessage("m1"),
            (route("read_message", "message_id" to "m1") as VoiceCommandDecision.ExecuteSafely).action
        )
    }

    @Test fun conversationManagementMapsToTypedActions() {
        assertEquals(VoiceAction.OpenConversation("c1"), (route("open_conversation", "conversation_id" to "c1") as VoiceCommandDecision.ExecuteSafely).action)
        assertEquals(VoiceAction.SetConversationPinned("c1", true), (route("pin_conversation", "conversation_id" to "c1") as VoiceCommandDecision.ExecuteSafely).action)
        assertEquals(VoiceAction.SetConversationArchived("c1", true), (route("archive_conversation", "conversation_id" to "c1") as VoiceCommandDecision.ExecuteSafely).action)
        assertEquals(VoiceAction.SetConversationMuted("c1", true), (route("mute_conversation", "conversation_id" to "c1") as VoiceCommandDecision.ExecuteSafely).action)
    }

    @Test fun outboundAndDestructiveMessageActionsRequireConfirmation() {
        val commands = listOf(
            route("send_message", "conversation_id" to "c1", "text" to "Привет"),
            route("reply_to_message", "conversation_id" to "c1", "message_id" to "m1", "text" to "Ответ"),
            route("forward_message", "message_id" to "m1", "target_conversation_id" to "c2"),
            route("edit_message", "message_id" to "m1", "text" to "Новый текст"),
            route("delete_message", "message_id" to "m1"),
            route("send_attachment", "conversation_id" to "c1", "attachment_id" to "a1"),
            route("start_audio_call", "contact_id" to "u1"),
            route("start_video_call", "contact_id" to "u1"),
            route("change_setting", "setting_key" to "theme", "value" to "dark"),
            route("delete_conversation", "conversation_id" to "c1"),
            route("clear_conversation_history", "conversation_id" to "c1"),
            route("save_attachment_to_site_media", "attachment_id" to "a1"),
            route("share_site_media", "site_media_id" to "s1", "conversation_id" to "c1")
        )
        commands.forEach { assertTrue("Expected confirmation for $it", it is VoiceCommandDecision.AskForConfirmation) }
    }

    @Test fun inboundAndLocalMediaActionsAreTypedAndSafe() {
        assertTrue(route("react_to_message", "message_id" to "m1", "reaction" to "❤️") is VoiceCommandDecision.ExecuteSafely)
        assertTrue(route("play_voice_message", "message_id" to "m1") is VoiceCommandDecision.ExecuteSafely)
        assertTrue(route("pick_photo") is VoiceCommandDecision.ExecuteSafely)
        assertTrue(route("pick_video") is VoiceCommandDecision.ExecuteSafely)
        assertTrue(route("pick_file") is VoiceCommandDecision.ExecuteSafely)
        assertTrue(route("capture_photo") is VoiceCommandDecision.ExecuteSafely)
        assertTrue(route("capture_video") is VoiceCommandDecision.ExecuteSafely)
        assertTrue(route("open_attachment", "attachment_id" to "a1") is VoiceCommandDecision.ExecuteSafely)
    }

    @Test fun callsAndRecordingHaveExplicitTypedActions() {
        assertEquals(VoiceAction.ToggleCallMicrophone, (route("toggle_call_microphone") as VoiceCommandDecision.ExecuteSafely).action)
        assertEquals(VoiceAction.ToggleCallCamera, (route("toggle_call_camera") as VoiceCommandDecision.ExecuteSafely).action)
        assertEquals(
            VoiceCommandDecision.AskForConfirmation(
                VoiceAction.StopVoiceMessageRecording,
                "Отправить записанное голосовое сообщение?"
            ),
            route("stop_voice_recording")
        )
    }

    @Test fun malformedAndUnknownIntentsAreRejected() {
        assertTrue(route("send_message") is VoiceCommandDecision.Reject)
        assertTrue(route("start_video_call") is VoiceCommandDecision.Reject)
        assertTrue(route("search_messages") is VoiceCommandDecision.Reject)
        assertTrue(route("delete_message", "message_id" to " ") is VoiceCommandDecision.Reject)
        assertTrue(route("run_shell_command") is VoiceCommandDecision.Reject)
    }
}
