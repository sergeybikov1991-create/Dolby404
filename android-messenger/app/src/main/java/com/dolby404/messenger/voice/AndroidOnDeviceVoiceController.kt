package com.dolby404.messenger.voice

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Locale
import java.util.concurrent.Executor

/**
 * First-choice Android 12+ on-device speech path.
 *
 * This uses the system's local recognizer and its installed Russian language
 * pack; it does not download or bundle an app-owned neural model. If the
 * device has no on-device recognizer or Russian pack, the user gets an explicit
 * error and the app can later offer the compact Vosk fallback.
 *
 * SpeechRecognizer owns the microphone itself, so this controller must not be
 * combined with AndroidPcmAudioCapture. The coordinator lease still prevents
 * simultaneous use by voice messages, video messages and calls.
 */
class AndroidOnDeviceVoiceController(
    context: Context,
    private val coordinator: VoiceAudioSessionCoordinator,
    private val assistant: VoiceAssistantEngine,
    private val speechOutput: VoiceSpeechOutput,
    private val contextProvider: () -> VoiceConversationContext,
    private val hasRecordAudioPermission: () -> Boolean,
    private val isActivityForeground: () -> Boolean,
    private val scope: CoroutineScope
) : AutoCloseable {

    private val appContext = context.applicationContext
    private val lock = Any()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val mainExecutor = Executor { command -> mainHandler.post(command) }
    private val _state = MutableStateFlow(VoiceAssistantState())
    val state: StateFlow<VoiceAssistantState> = _state.asStateFlow()

    private var recognizer: SpeechRecognizer? = null
    private var microphoneLease: VoiceAudioSessionCoordinator.Lease? = null
    private var listening = false
    private var closed = false
    private var modelCheckInProgress = false
    private var modelDownloadRequested = false

    init {
        refreshRussianModelSupport()
    }

    /** Android 13+ reports installed and supported offline language packs. */
    fun refreshRussianModelSupport() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            _state.value = _state.value.copy(isModelReady = isOnDeviceServiceAvailable(appContext))
            return
        }
        if (!isOnDeviceServiceAvailable(appContext)) {
            _state.value = _state.value.copy(isModelReady = false, errorMessage = "На телефоне нет системного офлайн-распознавателя речи")
            return
        }
        synchronized(lock) {
            if (closed || modelCheckInProgress) return
            modelCheckInProgress = true
        }
        mainHandler.post {
            val probe = try {
                SpeechRecognizer.createOnDeviceSpeechRecognizer(appContext)
            } catch (error: Exception) {
                finishModelCheck(false, error.message ?: "Не удалось проверить русский офлайн-пакет")
                return@post
            }
            try {
                probe.checkRecognitionSupport(createRussianIntent(), mainExecutor,
                    object : SpeechRecognizer.RecognitionSupportCallback {
                        override fun onSupportResult(support: android.speech.RecognitionSupport) {
                            val supported = support.supportedOnDeviceLanguages.any(::isRussianTag)
                            val installed = support.installedOnDeviceLanguages.any(::isRussianTag)
                            when {
                                installed -> finishModelCheck(true, null)
                                supported -> {
                                    val shouldRequest = synchronized(lock) {
                                        if (modelDownloadRequested) false else { modelDownloadRequested = true; true }
                                    }
                                    if (shouldRequest) {
                                        try {
                                            probe.triggerModelDownload(createRussianIntent())
                                            finishModelCheck(false, "Русский офлайн-пакет ещё не установлен. Запрошена загрузка; проверь позже.")
                                        } catch (error: Exception) {
                                            finishModelCheck(false, "Не удалось запросить загрузку русского офлайн-пакета")
                                        }
                                    } else finishModelCheck(false, "Загрузка русского офлайн-пакета запрошена. Проверь позже.")
                                }
                                else -> finishModelCheck(false, "Системный офлайн-распознаватель не предлагает русский язык")
                            }
                            runCatching { probe.destroy() }
                        }
                        override fun onError(error: Int) {
                            finishModelCheck(false, "Не удалось проверить русский офлайн-пакет (код $error)")
                            runCatching { probe.destroy() }
                        }
                    })
            } catch (error: Exception) {
                runCatching { probe.destroy() }
                finishModelCheck(false, error.message ?: "Не удалось проверить русский офлайн-пакет")
            }
        }
    }

    private fun isRussianTag(tag: String): Boolean =
        Locale.forLanguageTag(tag).language.equals("ru", ignoreCase = true)

    private fun finishModelCheck(ready: Boolean, message: String?) {
        synchronized(lock) { modelCheckInProgress = false }
        _state.value = _state.value.copy(isModelReady = ready, errorMessage = message)
    }

    fun startListening(): Boolean {
        if (_state.value.phase == VoicePhase.SPEAKING) {
            setError("Подожди, пока помощник закончит ответ")
            return false
        }
        if (!hasRecordAudioPermission()) {
            setError("Нужно разрешение на микрофон")
            return false
        }
        if (!isActivityForeground()) {
            setError("Голосовое управление запускается только в открытом приложении")
            return false
        }
        if (!isOnDeviceServiceAvailable(appContext)) {
            setError("На телефоне нет системного офлайн-распознавателя речи")
            return false
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !_state.value.isModelReady) {
            refreshRussianModelSupport()
            _state.value = _state.value.copy(phase = VoicePhase.ERROR,
                errorMessage = _state.value.errorMessage ?: "Русский офлайн-пакет ещё не готов. Проверь загрузку и попробуй снова.")
            return false
        }

        speechOutput.stop()
        synchronized(lock) {
            if (closed || listening) return false
            val lease = coordinator.tryAcquire(VoiceAudioOwner.ASSISTANT)
            if (lease == null) {
                setError("Микрофон сейчас занят записью или звонком")
                return false
            }
            microphoneLease = lease
            listening = true
        }

        return try {
            val activeRecognizer = synchronized(lock) {
                recognizer ?: SpeechRecognizer.createOnDeviceSpeechRecognizer(appContext).also {
                    it.setRecognitionListener(createListener())
                    recognizer = it
                }
            }
            _state.value = VoiceAssistantState(
                phase = VoicePhase.LISTENING,
                isModelReady = true
            )
            activeRecognizer.startListening(createRussianIntent())
            true
        } catch (error: Exception) {
            releaseMicrophone()
            setError(error.message ?: "Не удалось запустить офлайн-распознавание")
            false
        }
    }

    /** Call on a second tap to finish the current phrase and process its result. */
    fun stopListening() {
        val active = synchronized(lock) {
            if (!listening) return
            recognizer
        }
        _state.value = _state.value.copy(phase = VoicePhase.TRANSCRIBING)
        try {
            active?.stopListening()
        } catch (error: Exception) {
            releaseMicrophone()
            setError(error.message ?: "Не удалось завершить распознавание")
        }
    }

    fun cancelListening() {
        val active = synchronized(lock) {
            if (listening) {
                listening = false
                microphoneLease?.close()
                microphoneLease = null
            }
            recognizer
        }
        runCatching { active?.cancel() }
        assistant.cancelPendingConfirmation()
        speechOutput.stop()
        _state.value = VoiceAssistantState(
            isModelReady = _state.value.isModelReady
        )
    }

    fun confirmPending(token: String) {
        scope.launch {
            val result = try {
                assistant.confirm(token, contextProvider())
            } catch (error: Exception) {
                if (error is kotlinx.coroutines.CancellationException) throw error
                VoiceTurnResult.Rejected(error.message ?: "Не удалось подтвердить действие")
            }
            presentResult(result)
        }
    }

    fun cancelPendingConfirmation() {
        assistant.cancelPendingConfirmation()
    }

    private fun createRussianIntent() = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ru-RU")
        putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
    }

    private fun createListener() = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {
            _state.value = _state.value.copy(phase = VoicePhase.LISTENING)
        }

        override fun onBeginningOfSpeech() = Unit
        override fun onRmsChanged(rmsdB: Float) = Unit
        override fun onBufferReceived(buffer: ByteArray?) = Unit

        override fun onEndOfSpeech() {
            _state.value = _state.value.copy(phase = VoicePhase.TRANSCRIBING)
        }

        override fun onError(error: Int) {
            if (!releaseMicrophone()) return
            setError(errorMessage(error))
        }

        override fun onResults(results: Bundle?) {
            if (!releaseMicrophone()) return
            val transcript = results
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                ?.firstOrNull()
                ?.trim()
                .orEmpty()
            if (transcript.isBlank()) {
                _state.value = VoiceAssistantState(
                    phase = VoicePhase.IDLE,
                    errorMessage = "Не удалось распознать фразу. Попробуй ещё раз.",
                    isModelReady = true
                )
                return
            }
            scope.launch {
                _state.value = VoiceAssistantState(
                    phase = VoicePhase.THINKING,
                    recognizedText = transcript,
                    isModelReady = true
                )
                val result = try {
                    assistant.onFinalTranscript(transcript, contextProvider())
                } catch (error: Exception) {
                    if (error is kotlinx.coroutines.CancellationException) throw error
                    VoiceTurnResult.Rejected(error.message ?: "Не удалось выполнить голосовую команду")
                }
                presentResult(result, transcript)
            }
        }

        override fun onPartialResults(partialResults: Bundle?) {
            val partial = partialResults
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                ?.firstOrNull()
                .orEmpty()
            if (partial.isNotBlank()) {
                _state.value = _state.value.copy(
                    phase = VoicePhase.LISTENING,
                    recognizedText = partial
                )
            }
        }

        override fun onEvent(eventType: Int, params: Bundle?) = Unit
    }

    private fun presentResult(
        result: VoiceTurnResult,
        transcript: String = _state.value.recognizedText
    ) {
        val response = when (result) {
            is VoiceTurnResult.Executed -> when (val execution = result.result) {
                is VoiceExecutionResult.Success -> execution.spokenSummary
                is VoiceExecutionResult.NeedsDisambiguation -> execution.question
                is VoiceExecutionResult.Failure -> execution.userMessage
            }
            is VoiceTurnResult.AwaitingConfirmation -> result.prompt
            is VoiceTurnResult.ClarificationRequired -> result.question
            is VoiceTurnResult.Rejected -> result.reason
            is VoiceTurnResult.Cancelled -> result.spokenMessage
        }
        val ready = speechOutput.isReady
        _state.value = VoiceAssistantState(
            phase = if (ready) VoicePhase.SPEAKING else VoicePhase.IDLE,
            recognizedText = transcript,
            responseText = response,
            isModelReady = _state.value.isModelReady
        )
        val spoken = ready && speechOutput.speak(response) {
            _state.value = _state.value.copy(phase = VoicePhase.IDLE)
        }
        if (!spoken) _state.value = _state.value.copy(phase = VoicePhase.IDLE)
    }

    private fun errorMessage(code: Int): String = when (code) {
        SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE ->
            "Русский офлайн-пакет распознавания не установлен на телефоне"
        SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED ->
            "Системный офлайн-распознаватель не поддерживает русский язык"
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS ->
            "Нет разрешения на микрофон"
        SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT ->
            "Не расслышал. Повтори команду"
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY ->
            "Распознаватель занят. Попробуй ещё раз"
        else -> "Ошибка офлайн-распознавания речи (код $code)"
    }

    private fun releaseMicrophone(): Boolean = synchronized(lock) {
        if (!listening) return@synchronized false
        listening = false
        microphoneLease?.close()
        microphoneLease = null
        true
    }

    private fun setError(message: String) {
        _state.value = VoiceAssistantState(
            phase = VoicePhase.ERROR,
            errorMessage = message,
            isModelReady = _state.value.isModelReady
        )
    }

    override fun close() {
        val active = synchronized(lock) {
            if (closed) return
            closed = true
            listening = false
            microphoneLease?.close()
            microphoneLease = null
            recognizer.also { recognizer = null }
        }
        runCatching { active?.cancel() }
        active?.destroy()
        speechOutput.stop()
        (speechOutput as? AndroidVoiceSpeechOutput)?.close()
    }

    companion object {
        fun isOnDeviceServiceAvailable(context: Context): Boolean =
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                runCatching {
                    SpeechRecognizer.isOnDeviceRecognitionAvailable(context)
                }.getOrDefault(false)
    }
}
