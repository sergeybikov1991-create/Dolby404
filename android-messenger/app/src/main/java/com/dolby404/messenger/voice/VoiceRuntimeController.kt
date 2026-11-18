package com.dolby404.messenger.voice

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Foreground push-to-talk runtime. The Activity supplies permission/foreground
 * checks and a CoroutineScope tied to its lifecycle. No wake-word/background
 * microphone service is started here.
 */
class VoiceRuntimeController(
    private val coordinator: VoiceAudioSessionCoordinator,
    private val recognizer: StreamingSpeechRecognizer,
    private val assistant: VoiceAssistantEngine,
    private val speechOutput: VoiceSpeechOutput,
    private val contextProvider: () -> VoiceConversationContext,
    private val hasRecordAudioPermission: () -> Boolean,
    private val isActivityForeground: () -> Boolean,
    private val scope: CoroutineScope,
    private val inputSampleRate: Int = SherpaTOneRussianRecognizer.INPUT_SAMPLE_RATE
) : AutoCloseable {

    private val lock = Any()
    private val _state = MutableStateFlow(VoiceAssistantState(isModelReady = recognizer.isReady))
    val state: StateFlow<VoiceAssistantState> = _state.asStateFlow()

    private var capture: AndroidPcmAudioCapture? = null
    private var recognitionSession: SpeechRecognitionSession? = null
    private val finalSegments = mutableListOf<String>()
    private var closed = false

    /** Called by the visible push-to-talk button after Android permission is granted. */
    fun startListening(): Boolean {
        if (!hasRecordAudioPermission()) {
            setError("Нужно разрешение на микрофон")
            return false
        }
        if (!isActivityForeground()) {
            setError("Голосовое управление запускается только в открытом приложении")
            return false
        }
        if (!recognizer.isReady) {
            setError("Русская модель распознавания ещё не готова")
            return false
        }

        synchronized(lock) {
            if (closed || capture != null) return false
            finalSegments.clear()
        }

        val session = try {
            recognizer.startSession(
                onPartialResult = { partial ->
                    _state.value = VoiceAssistantState(
                        phase = VoicePhase.LISTENING,
                        recognizedText = partial,
                        isModelReady = recognizer.isReady
                    )
                },
                onFinalResult = { final ->
                    synchronized(lock) {
                        if (final.isNotBlank()) finalSegments += final.trim()
                    }
                },
                onError = ::setError
            )
        } catch (error: Exception) {
            setError(error.message ?: "Не удалось открыть распознавание речи")
            return false
        }

        val newCapture = AndroidPcmAudioCapture(
            coordinator = coordinator,
            onAudioFrame = { samples, sampleRate -> session.acceptAudioFrame(samples, sampleRate) },
            onError = ::setError,
            captureSampleRate = inputSampleRate
        )
        synchronized(lock) {
            recognitionSession = session
            capture = newCapture
        }

        if (!newCapture.start()) {
            synchronized(lock) {
                capture = null
                recognitionSession = null
            }
            session.cancel()
            return false
        }

        _state.value = VoiceAssistantState(
            phase = VoicePhase.LISTENING,
            isModelReady = recognizer.isReady
        )
        return true
    }

    /**
     * Stops AudioRecord first, finishes sherpa stream second, then sends the
     * complete utterance to the dialogue engine. TTS starts only after mic release.
     */
    suspend fun stopListening(): VoiceTurnResult? {
        val activeCapture: AndroidPcmAudioCapture
        val activeSession: SpeechRecognitionSession
        synchronized(lock) {
            activeCapture = capture ?: return null
            activeSession = recognitionSession ?: return null
            capture = null
            recognitionSession = null
        }

        _state.value = _state.value.copy(phase = VoicePhase.TRANSCRIBING)
        withContext(Dispatchers.IO) {
            activeCapture.stop()
            activeSession.finish()
        }

        val transcript = synchronized(lock) {
            finalSegments.joinToString(" ").also { finalSegments.clear() }
        }.trim()

        if (transcript.isEmpty()) {
            _state.value = VoiceAssistantState(
                phase = VoicePhase.IDLE,
                errorMessage = "Не удалось распознать фразу",
                isModelReady = recognizer.isReady
            )
            return null
        }
        return processTranscript(transcript)
    }

    suspend fun confirmPending(token: String): VoiceTurnResult =
        processResult(assistant.confirm(token, contextProvider()))

    fun cancelPendingConfirmation() = assistant.cancelPendingConfirmation()

    fun cancelListening() {
        val activeCapture: AndroidPcmAudioCapture?
        val activeSession: SpeechRecognitionSession?
        synchronized(lock) {
            activeCapture = capture
            activeSession = recognitionSession
            capture = null
            recognitionSession = null
            finalSegments.clear()
        }
        scope.launch(Dispatchers.IO) {
            activeCapture?.stop()
            activeSession?.cancel()
        }
        _state.value = VoiceAssistantState(isModelReady = recognizer.isReady)
    }

    fun cancelPendingAndForgetDialogue() {
        assistant.clearConversationMemory()
        _state.value = VoiceAssistantState(isModelReady = recognizer.isReady)
    }

    private suspend fun processTranscript(transcript: String): VoiceTurnResult {
        _state.value = VoiceAssistantState(
            phase = VoicePhase.THINKING,
            recognizedText = transcript,
            isModelReady = recognizer.isReady
        )
        val result = assistant.onFinalTranscript(transcript, contextProvider())
        return processResult(result, transcript)
    }

    private fun processResult(
        result: VoiceTurnResult,
        transcript: String = _state.value.recognizedText
    ): VoiceTurnResult {
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
        val outputReady = speechOutput.isReady
        _state.value = VoiceAssistantState(
            phase = if (outputReady) VoicePhase.SPEAKING else VoicePhase.IDLE,
            recognizedText = transcript,
            responseText = response,
            isModelReady = recognizer.isReady
        )
        val spoken = outputReady && speechOutput.speak(response) {
            _state.value = _state.value.copy(phase = VoicePhase.IDLE)
        }
        if (!spoken) _state.value = _state.value.copy(phase = VoicePhase.IDLE)
        return result
    }

    private fun setError(message: String) {
        _state.value = VoiceAssistantState(
            phase = VoicePhase.ERROR,
            errorMessage = message,
            isModelReady = recognizer.isReady
        )
    }

    override fun close() {
        val activeCapture: AndroidPcmAudioCapture?
        val activeSession: SpeechRecognitionSession?
        synchronized(lock) {
            if (closed) return
            closed = true
            activeCapture = capture
            activeSession = recognitionSession
            capture = null
            recognitionSession = null
            finalSegments.clear()
        }
        activeCapture?.stop()
        activeSession?.cancel()
        speechOutput.stop()
        (recognizer as? AutoCloseable)?.close()
        (speechOutput as? AndroidVoiceSpeechOutput)?.close()
    }
}
