package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceCommandRouterTest {
    @Test fun navigationCommandsAreSafeToExecute() {
        assertEquals(VoiceCommandDecision.ExecuteSafely(VoiceAction.OpenChats), VoiceCommandRouter.route(VoiceModelIntent("open_chats")))
        assertEquals(VoiceCommandDecision.ExecuteSafely(VoiceAction.OpenContacts), VoiceCommandRouter.route(VoiceModelIntent("open_contacts")))
        assertEquals(VoiceCommandDecision.ExecuteSafely(VoiceAction.ShowMedia), VoiceCommandRouter.route(VoiceModelIntent("show_media")))
    }

    @Test fun sendMessageAlwaysRequiresConfirmation() {
        val result = VoiceCommandRouter.route(VoiceModelIntent("send_message", mapOf("conversation_id" to "chat-123", "text" to "Привет")))
        assertTrue(result is VoiceCommandDecision.AskForConfirmation)
        assertTrue((result as VoiceCommandDecision.AskForConfirmation).action is VoiceAction.SendMessage)
    }

    @Test fun callsAlwaysRequireConfirmationAndPreserveType() {
        val audio = VoiceCommandRouter.route(VoiceModelIntent("start_audio_call", mapOf("contact_id" to "user-1")))
        val video = VoiceCommandRouter.route(VoiceModelIntent("start_video_call", mapOf("contact_id" to "user-1")))
        assertTrue(audio is VoiceCommandDecision.AskForConfirmation)
        assertEquals(CallType.AUDIO, ((audio as VoiceCommandDecision.AskForConfirmation).action as VoiceAction.StartCall).callType)
        assertTrue(video is VoiceCommandDecision.AskForConfirmation)
        assertEquals(CallType.VIDEO, ((video as VoiceCommandDecision.AskForConfirmation).action as VoiceAction.StartCall).callType)
    }

    @Test fun destructiveAndSettingsActionsRequireConfirmation() {
        val delete = VoiceCommandRouter.route(VoiceModelIntent("delete_message", mapOf("message_id" to "message-1")))
        val setting = VoiceCommandRouter.route(VoiceModelIntent("change_setting", mapOf("setting_key" to "theme", "value" to "dark")))
        assertTrue(delete is VoiceCommandDecision.AskForConfirmation)
        assertTrue(setting is VoiceCommandDecision.AskForConfirmation)
    }

    @Test fun missingArgumentsAreRejected() {
        assertTrue(VoiceCommandRouter.route(VoiceModelIntent("send_message")) is VoiceCommandDecision.Reject)
        assertTrue(VoiceCommandRouter.route(VoiceModelIntent("start_video_call")) is VoiceCommandDecision.Reject)
    }

    @Test fun unknownIntentsAreRejected() {
        assertTrue(VoiceCommandRouter.route(VoiceModelIntent("run_shell_command")) is VoiceCommandDecision.Reject)
    }
}
