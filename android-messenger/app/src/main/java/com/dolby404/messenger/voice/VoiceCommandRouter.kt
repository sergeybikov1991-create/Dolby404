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
    private fun confirm(action: VoiceAction, prompt: String) =
        VoiceCommandDecision.AskForConfirmation(action, prompt)
    private fun missing(message: String) = VoiceCommandDecision.Reject(message)

    fun route(intent: VoiceModelIntent): VoiceCommandDecision {
        val a = intent
        return when (a.name) {
            "open_chats" -> safe(VoiceAction.OpenChats)
            "open_contacts" -> safe(VoiceAction.OpenContacts)
            "show_media" -> safe(VoiceAction.ShowMedia)
            "show_unread" -> safe(VoiceAction.ShowUnreadConversations)

            "open_conversation" -> required(a, "conversation_id")?.let {
                safe(VoiceAction.OpenConversation(it))
            } ?: missing("Не удалось определить переписку")
            "search_conversations" -> required(a, "query")?.let {
                safe(VoiceAction.SearchConversations(it))
            } ?: missing("Что искать среди переписок?")
            "create_conversation" -> required(a, "contact")?.let {
                safe(VoiceAction.CreateConversation(it))
            } ?: missing("С кем создать переписку?")
            "mark_read", "mark_unread", "pin_conversation", "unpin_conversation",
            "archive_conversation", "unarchive_conversation", "mute_conversation",
            "unmute_conversation" -> {
                val id = required(a, "conversation_id")
                    ?: return missing("Не удалось определить переписку")
                val action = when (a.name) {
                    "mark_read" -> VoiceAction.SetConversationRead(id, true)
                    "mark_unread" -> VoiceAction.SetConversationRead(id, false)
                    "pin_conversation" -> VoiceAction.SetConversationPinned(id, true)
                    "unpin_conversation" -> VoiceAction.SetConversationPinned(id, false)
                    "archive_conversation" -> VoiceAction.SetConversationArchived(id, true)
                    "unarchive_conversation" -> VoiceAction.SetConversationArchived(id, false)
                    "mute_conversation" -> VoiceAction.SetConversationMuted(id, true)
                    else -> VoiceAction.SetConversationMuted(id, false)
                }
                safe(action)
            }

            "search_messages" -> {
                val query = required(a, "query") ?: return missing("Что найти в сообщениях?")
                safe(VoiceAction.SearchMessages(required(a, "conversation_id"), query))
            }
            "prepare_message_draft" -> {
                val recipient = required(a, "recipient") ?: return missing("Кому адресовать сообщение?")
                val message = required(a, "text") ?: return missing("Продиктуйте текст сообщения")
                safe(VoiceAction.PrepareMessageDraft(recipient, message))
            }
            "send_message" -> {
                val chat = required(a, "conversation_id") ?: return missing("Не удалось определить чат")
                val text = required(a, "text") ?: return missing("Нет текста для отправки")
                confirm(VoiceAction.SendMessage(chat, text), "Отправить это сообщение?")
            }
            "reply_to_message" -> {
                val chat = required(a, "conversation_id") ?: return missing("Не удалось определить чат")
                val message = required(a, "message_id") ?: return missing("Не удалось определить сообщение")
                val text = required(a, "text") ?: return missing("Продиктуйте ответ")
                confirm(VoiceAction.ReplyToMessage(chat, message, text), "Отправить ответ на это сообщение?")
            }
            "forward_message" -> {
                val message = required(a, "message_id") ?: return missing("Какое сообщение переслать?")
                val target = required(a, "target_conversation_id") ?: return missing("Куда переслать сообщение?")
                confirm(VoiceAction.ForwardMessage(message, target), "Переслать выбранное сообщение?")
            }
            "edit_message" -> {
                val message = required(a, "message_id") ?: return missing("Не удалось определить сообщение")
                val text = required(a, "text") ?: return missing("Продиктуйте новый текст")
                confirm(VoiceAction.EditMessage(message, text), "Сохранить изменения сообщения?")
            }
            "delete_message" -> required(a, "message_id")?.let {
                confirm(VoiceAction.DeleteMessage(it), "Удалить это сообщение?")
            } ?: missing("Не удалось определить сообщение для удаления")
            "react_to_message" -> {
                val message = required(a, "message_id") ?: return missing("Не удалось определить сообщение")
                val reaction = required(a, "reaction") ?: return missing("Какую реакцию поставить?")
                safe(VoiceAction.ReactToMessage(message, reaction))
            }
            "play_voice_message" -> required(a, "message_id")?.let {
                safe(VoiceAction.PlayVoiceMessage(it))
            } ?: missing("Не удалось определить голосовое сообщение")
            "start_voice_recording" -> required(a, "conversation_id")?.let {
                safe(VoiceAction.StartVoiceMessageRecording(it))
            } ?: missing("Сначала откройте переписку")
            "stop_voice_recording" -> safe(VoiceAction.StopVoiceMessageRecording)

            "pick_photo", "pick_video", "pick_file", "pick_attachment" -> {
                val kind = when (a.name) {
                    "pick_photo" -> MediaKind.PHOTO
                    "pick_video" -> MediaKind.VIDEO
                    "pick_file" -> MediaKind.FILE
                    else -> MediaKind.ANY
                }
                safe(VoiceAction.PickAttachment(kind))
            }
            "capture_photo" -> safe(VoiceAction.CapturePhoto)
            "capture_video" -> safe(VoiceAction.CaptureVideo)
            "open_attachment" -> required(a, "attachment_id")?.let {
                safe(VoiceAction.OpenAttachment(it))
            } ?: missing("Не удалось определить вложение")
            "send_attachment" -> {
                val chat = required(a, "conversation_id") ?: return missing("Не удалось определить чат")
                val attachment = required(a, "attachment_id") ?: return missing("Не удалось определить файл")
                confirm(VoiceAction.SendAttachment(chat, attachment), "Отправить выбранное вложение?")
            }

            "start_audio_call", "start_video_call" -> {
                val contact = required(a, "contact_id") ?: return missing("Сначала нужно точно определить контакт")
                val type = if (a.name == "start_video_call") CallType.VIDEO else CallType.AUDIO
                confirm(
                    VoiceAction.StartCall(contact, type),
                    if (type == CallType.VIDEO) "Начать видеозвонок этому контакту?" else "Начать аудиозвонок этому контакту?"
                )
            }
            "accept_call" -> confirm(VoiceAction.AcceptCall, "Принять входящий звонок?")
            "decline_call" -> confirm(VoiceAction.DeclineCall, "Отклонить входящий звонок?")
            "toggle_call_microphone" -> safe(VoiceAction.ToggleCallMicrophone)
            "toggle_call_camera" -> safe(VoiceAction.ToggleCallCamera)

            "change_setting" -> {
                val key = required(a, "setting_key") ?: return missing("Не удалось определить настройку")
                val value = required(a, "value") ?: return missing("Не удалось определить новое значение")
                confirm(VoiceAction.ChangeSetting(key, value), "Изменить настройку?")
            }
            else -> missing("Эта команда пока не поддерживается")
        }
    }
}
