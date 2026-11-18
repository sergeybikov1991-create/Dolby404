package com.dolby404.messenger.voice

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Offline-only Android TTS adapter.
 *
 * It selects only a Russian voice that does not require a network connection.
 * If the device has no such voice installed, it reports unavailable instead
 * of silently falling back to a cloud voice.
 *
 * The owner must call close() when the voice feature is disposed.
 */
class AndroidOfflineRussianTts(
    context: Context,
    private val onReady: (Boolean) -> Unit = {}
) : TextToSpeech.OnInitListener {

    private var engine: TextToSpeech? = null

    private val _isReady = MutableStateFlow(false)
    val isReady: StateFlow<Boolean> = _isReady.asStateFlow()

    private val _status = MutableStateFlow("Озвучка ещё не проверена")
    val status: StateFlow<String> = _status.asStateFlow()

    init {
        engine = TextToSpeech(context.applicationContext, this)
    }

    override fun onInit(statusCode: Int) {
        val tts = engine
        if (statusCode != TextToSpeech.SUCCESS || tts == null) {
            setUnavailable("Не удалось запустить системную озвучку")
            return
        }

        val russianLocalVoice: Voice? = tts.voices
            ?.asSequence()
            ?.filter { it.locale.language.equals("ru", ignoreCase = true) }
            ?.filterNot { it.isNetworkConnectionRequired }
            ?.sortedBy { it.name.length }
            ?.firstOrNull()

        if (russianLocalVoice == null) {
            setUnavailable("На телефоне нет установленного русского голоса без интернета")
            return
        }

        if (tts.setVoice(russianLocalVoice) == TextToSpeech.SUCCESS) {
            _isReady.value = true
            _status.value = "Русская офлайн-озвучка готова"
            onReady(true)
        } else {
            setUnavailable("Не удалось выбрать установленный русский голос")
        }
    }

    fun speak(text: String): Boolean {
        val value = text.trim()
        val tts = engine
        if (value.isEmpty() || !_isReady.value || tts == null) return false

        return tts.speak(value, TextToSpeech.QUEUE_FLUSH, null, "floustream-voice") ==
            TextToSpeech.SUCCESS
    }

    fun stop() {
        engine?.stop()
    }

    fun close() {
        _isReady.value = false
        engine?.stop()
        engine?.shutdown()
        engine = null
    }

    private fun setUnavailable(message: String) {
        _isReady.value = false
        _status.value = message
        onReady(false)
    }
}
