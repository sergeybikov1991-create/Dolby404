package com.dolby404.messenger.voice

/**
 * Converts a deliberately small set of model intents into app-owned decisions.
 * Unknown intent names and malformed arguments are rejected.
 *
 * This router does not execute actions. The app layer must resolve identifiers,
 * show confirmation UI where requested, and then perform the operation itself.
 */
object VoiceCommandRouter {

    fun route(intent: VoiceModelIntent): VoiceCommandDecision {
        return when (intent.name) {
            "open_chats" -> VoiceCommandDecision.ExecuteSafely(VoiceAction.OpenChats)
            "open_contacts" -> VoiceCommandDecision.ExecuteSafely(VoiceAction.OpenContacts)
            "show_media" -> VoiceCommandDecision.ExecuteSafely(VoiceAction.ShowMedia)

            "prepare_message_draft" -> {
                val recipient = intent.arguments["recipient"]?.trim().orEmpty()
                val message = intent.arguments["text"]?.trim().orEmpty()
                if (recipient.isBlank() || message.isBlank()) {
                    VoiceCommandDecision.Reject("Нужны получатель и текст сообщения")
                } else {
                    VoiceCommandDecision.ExecuteSafely(
                        VoiceAction.PrepareMessageDraft(recipient, message)
                    )
                }
            }

            "send_message" -> {
                val conversationId = intent.arguments["conversation_id"]?.trim().orEmpty()
                val message = intent.arguments["text"]?.trim().orEmpty()
                if (conversationId.isBlank() || message.isBlank()) {
                    VoiceCommandDecision.Reject("Не удалось определить чат или текст сообщения")
                } else {
                    VoiceCommandDecision.AskForConfirmation(
                        VoiceAction.SendMessage(conversationId, message),
                        "Отправить это сообщение?"
                    )
                }
            }

            "start_audio_call", "start_video_call" -> {
                val contactId = intent.arguments["contact_id"]?.trim().orEmpty()
                if (contactId.isBlank()) {
                    VoiceCommandDecision.Reject("Сначала нужно точно определить контакт")
                } else {
                    val callType = if (intent.name == "start_video_call") {
                        CallType.VIDEO
                    } else {
                        CallType.AUDIO
                    }
                    VoiceCommandDecision.AskForConfirmation(
                        VoiceAction.StartCall(contactId, callType),
                        if (callType == CallType.VIDEO) {
                            "Начать видеозвонок этому контакту?"
                        } else {
                            "Начать аудиозвонок этому контакту?"
                        }
                    )
                }
            }

            "delete_message" -> {
                val messageId = intent.arguments["message_id"]?.trim().orEmpty()
                if (messageId.isBlank()) {
                    VoiceCommandDecision.Reject("Не удалось определить сообщение для удаления")
                } else {
                    VoiceCommandDecision.AskForConfirmation(
                        VoiceAction.DeleteMessage(messageId),
                        "Удалить это сообщение?"
                    )
                }
            }

            "change_setting" -> {
                val key = intent.arguments["setting_key"]?.trim().orEmpty()
                val value = intent.arguments["value"]?.trim().orEmpty()
                if (key.isBlank() || value.isBlank()) {
                    VoiceCommandDecision.Reject("Не удалось определить настройку и новое значение")
                } else {
                    VoiceCommandDecision.AskForConfirmation(
                        VoiceAction.ChangeSetting(key, value),
                        "Изменить настройку?"
                    )
                }
            }

            else -> VoiceCommandDecision.Reject("Эта команда пока не поддерживается")
        }
    }
}
