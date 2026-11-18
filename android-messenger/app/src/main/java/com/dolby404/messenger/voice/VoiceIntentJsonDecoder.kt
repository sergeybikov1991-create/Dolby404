package com.dolby404.messenger.voice

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json

sealed interface VoiceIntentDecodeResult {
    data class Decoded(val intent: VoiceModelIntent) : VoiceIntentDecodeResult
    data class Invalid(val reason: String) : VoiceIntentDecodeResult
}

/** Strict JSON envelope emitted by the local dialogue model. */
@Serializable
private data class StructuredVoiceIntentPayload(
    val intent: String,
    val arguments: Map<String, String> = emptyMap()
)

/**
 * Strictly decodes model output. Unknown JSON fields, non-string arguments,
 * malformed names, oversized values and control characters are rejected.
 */
class VoiceIntentJsonDecoder(
    private val json: Json = Json {
        ignoreUnknownKeys = false
        isLenient = false
        coerceInputValues = false
    }
) {
    fun decode(raw: String): VoiceIntentDecodeResult {
        if (raw.length !in 1..8_192) {
            return VoiceIntentDecodeResult.Invalid("Ответ модели пустой или слишком большой")
        }
        return try {
            val payload = json.decodeFromString<StructuredVoiceIntentPayload>(raw)
            val name = payload.intent
            if (!name.matches(Regex("[a-z][a-z0-9_]{0,63}"))) {
                return VoiceIntentDecodeResult.Invalid("Некорректное имя команды")
            }
            if (payload.arguments.size > 32) {
                return VoiceIntentDecodeResult.Invalid("Слишком много параметров команды")
            }
            for ((key, value) in payload.arguments) {
                if (!key.matches(Regex("[a-z][a-z0-9_]{0,63}"))) {
                    return VoiceIntentDecodeResult.Invalid("Некорректное имя параметра")
                }
                if (value.length > 2_000 || value.any { it == '\u0000' || (it.isISOControl() && it !in "\n\r\t") }) {
                    return VoiceIntentDecodeResult.Invalid("Параметр команды содержит недопустимые данные")
                }
            }
            VoiceIntentDecodeResult.Decoded(VoiceModelIntent(name, payload.arguments))
        } catch (_: SerializationException) {
            VoiceIntentDecodeResult.Invalid("Модель вернула некорректный формат команды")
        } catch (_: IllegalArgumentException) {
            VoiceIntentDecodeResult.Invalid("Не удалось проверить параметры команды")
        }
    }
}

/** Adapter boundary for a local LLM runtime such as llama.cpp Android. */
fun interface LocalVoiceLanguageModel {
    suspend fun generateIntentJson(
        transcript: String,
        context: VoiceConversationContext,
        history: List<VoiceDialogueTurn>
    ): String
}

/** Turns strict JSON from a local model into the app's typed intent contract. */
class StructuredLocalVoiceDialogueEngine(
    private val model: LocalVoiceLanguageModel,
    private val decoder: VoiceIntentJsonDecoder = VoiceIntentJsonDecoder()
) : VoiceDialogueEngine {
    override suspend fun interpret(
        transcript: String,
        context: VoiceConversationContext,
        history: List<VoiceDialogueTurn>
    ): VoiceModelIntent? {
        val raw = model.generateIntentJson(transcript, context, history)
        return (decoder.decode(raw) as? VoiceIntentDecodeResult.Decoded)?.intent
    }
}
