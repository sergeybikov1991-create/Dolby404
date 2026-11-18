package com.dolby404.messenger.voice

/**
 * The only bridge from voice architecture into FLOUSTREAM application logic.
 * Production implementation must delegate to existing repositories/use-cases
 * and must not create parallel chat, media-upload or call persistence paths.
 */
fun interface VoiceActionExecutor {
    suspend fun execute(action: VoiceAction): VoiceExecutionResult
}

sealed interface VoiceExecutionResult {
    data class Success(val spokenSummary: String) : VoiceExecutionResult
    data class NeedsDisambiguation(val question: String) : VoiceExecutionResult
    data class Failure(val userMessage: String) : VoiceExecutionResult
}

/**
 * App-owned resolver. It turns user-facing references into authoritative IDs.
 * The LLM must never invent or supply database IDs directly.
 */
interface VoiceEntityResolver {
    suspend fun conversationId(reference: String, context: VoiceConversationContext): String?
    suspend fun messageId(reference: String, context: VoiceConversationContext): String?
    suspend fun attachmentId(reference: String, context: VoiceConversationContext): String?
    suspend fun contactId(reference: String, context: VoiceConversationContext): String?
}

sealed interface VoiceBindingResult {
    data class Bound(val intent: VoiceModelIntent) : VoiceBindingResult
    data class Clarify(val question: String) : VoiceBindingResult
    data class Reject(val reason: String) : VoiceBindingResult
}

/**
 * Converts model-facing references ("active", "last", "Анна") into IDs resolved
 * by app-owned state/repositories. Only Bound intents may enter VoiceCommandRouter.
 */
class VoiceIntentBinder(private val resolver: VoiceEntityResolver) {
    suspend fun bind(
        modelIntent: VoiceModelIntent,
        context: VoiceConversationContext
    ): VoiceBindingResult {
        val args = modelIntent.arguments.toMutableMap()

        suspend fun bindReference(
            sourceKey: String,
            targetKey: String,
            resolve: suspend (String, VoiceConversationContext) -> String?
        ): VoiceBindingResult? {
            val reference = args.remove(sourceKey)?.trim()?.takeIf { it.isNotEmpty() }
                ?: return VoiceBindingResult.Clarify("Не удалось определить, что именно выбрать")
            val id = resolve(reference, context)
                ?: return VoiceBindingResult.Clarify("Не нашёл точный объект. Уточните, пожалуйста")
            args[targetKey] = id
            return null
        }

        val conversationRequired = when (modelIntent.name) {
            "open_conversation", "mark_read", "mark_unread", "pin_conversation",
            "unpin_conversation", "archive_conversation", "unarchive_conversation",
            "mute_conversation", "unmute_conversation", "send_message",
            "reply_to_message", "start_voice_recording", "send_attachment" -> true
            else -> false
        }
        if (conversationRequired) {
            bindReference("conversation_ref", "conversation_id", resolver::conversationId)?.let { return it }
        } else if (modelIntent.name == "search_messages" && args.containsKey("conversation_ref")) {
            bindReference("conversation_ref", "conversation_id", resolver::conversationId)?.let { return it }
        }

        val messageRequired = modelIntent.name in setOf(
            "reply_to_message", "forward_message", "edit_message",
            "delete_message", "react_to_message", "play_voice_message"
        )
        if (messageRequired) {
            bindReference("message_ref", "message_id", resolver::messageId)?.let { return it }
        }

        if (modelIntent.name == "forward_message") {
            bindReference("target_conversation_ref", "target_conversation_id", resolver::conversationId)?.let { return it }
        }

        if (modelIntent.name == "open_attachment") {
            bindReference("attachment_ref", "attachment_id", resolver::attachmentId)?.let { return it }
        }
        if (modelIntent.name == "send_attachment") {
            bindReference("attachment_ref", "attachment_id", resolver::attachmentId)?.let { return it }
        }

        if (modelIntent.name in setOf("start_audio_call", "start_video_call")) {
            bindReference("contact_ref", "contact_id", resolver::contactId)?.let { return it }
        }

        return VoiceBindingResult.Bound(VoiceModelIntent(modelIntent.name, args))
    }
}
