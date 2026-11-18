package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceCommandRouterTest {
    private fun route(name: String, vararg args: Pair<String, String>) =
        VoiceCommandRouter.route(VoiceModelIntent(name, args.toMap()))

    @Test fun allowsOnlyOpenChatsAndSavedConversation() {
        assertEquals(VoiceCommandDecision.ExecuteSafely(VoiceAction.OpenChats), route("open_chats"))
        assertEquals(
            VoiceCommandDecision.ExecuteSafely(VoiceAction.OpenConversation("saved-chat-id")),
            route("open_conversation", "conversation_id" to "saved-chat-id")
        )
        assertTrue(route("open_conversation") is VoiceCommandDecision.Reject)
    }

    @Test fun allowsVoiceMessageStartAndStopWithoutExtraConfirmation() {
        assertEquals(
            VoiceCommandDecision.ExecuteSafely(VoiceAction.StartVoiceMessageRecording("active-chat")),
            route("start_voice_recording", "conversation_id" to "active-chat")
        )
        assertTrue(route("start_voice_recording") is VoiceCommandDecision.Reject)
        assertEquals(
            VoiceCommandDecision.ExecuteSafely(VoiceAction.StopVoiceMessageRecording),
            route("stop_voice_recording")
        )
    }

    @Test fun rejectsEveryCommandOutsideTheApprovedPlan() {
        listOf(
            "open_contacts", "open_settings", "show_media", "search_conversations",
            "create_conversation", "send_message", "delete_message", "start_audio_call",
            "start_video_call", "pick_photo", "capture_video", "run_shell_command"
        ).forEach { assertTrue("$it must be rejected", route(it) is VoiceCommandDecision.Reject) }
    }
}
