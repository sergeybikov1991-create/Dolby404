package com.dolby404.messenger.voice

import com.k2fsa.sherpa.onnx.EndpointConfig
import com.k2fsa.sherpa.onnx.EndpointRule
import com.k2fsa.sherpa.onnx.FeatureConfig
import com.k2fsa.sherpa.onnx.OnlineModelConfig
import com.k2fsa.sherpa.onnx.OnlineRecognizer
import com.k2fsa.sherpa.onnx.OnlineRecognizerConfig
import com.k2fsa.sherpa.onnx.OnlineToneCtcModelConfig

/**
 * sherpa-onnx v1.13.5 streaming T-one CTC adapter for Russian.
 * T-one requires 8 kHz input; configure AndroidPcmAudioCapture with
 * captureSampleRate = INPUT_SAMPLE_RATE.
 */
class SherpaTOneRussianRecognizer private constructor(
    private val recognizer: OnlineRecognizer
) : StreamingSpeechRecognizer, AutoCloseable {

    companion object {
        const val INPUT_SAMPLE_RATE = RussianAsrModelInstaller.MODEL_SAMPLE_RATE

        fun create(
            files: RussianAsrModelFiles,
            numThreads: Int = 2
        ): SherpaTOneRussianRecognizer {
            require(files.model.isFile && files.tokens.isFile) {
                "Русская модель распознавания не установлена"
            }
            val config = OnlineRecognizerConfig(
                featConfig = FeatureConfig(sampleRate = INPUT_SAMPLE_RATE, featureDim = 80),
                modelConfig = OnlineModelConfig(
                    toneCtc = OnlineToneCtcModelConfig(model = files.model.absolutePath),
                    tokens = files.tokens.absolutePath,
                    numThreads = numThreads.coerceIn(1, 4),
                    provider = "cpu",
                    modelingUnit = "cjkchar"
                ),
                endpointConfig = EndpointConfig(
                    rule1 = EndpointRule(false, 2.4f, 0.0f),
                    rule2 = EndpointRule(true, 1.2f, 0.0f),
                    rule3 = EndpointRule(false, 0.0f, 20.0f)
                ),
                enableEndpoint = true,
                decodingMethod = "greedy_search"
            )
            return SherpaTOneRussianRecognizer(OnlineRecognizer(config = config))
        }
    }

    private val lock = Any()
    private var closed = false
    private var activeSession: Session? = null

    override val isReady: Boolean
        get() = synchronized(lock) { !closed }

    override fun startSession(
        onPartialResult: (String) -> Unit,
        onFinalResult: (String) -> Unit,
        onError: (String) -> Unit
    ): SpeechRecognitionSession = synchronized(lock) {
        check(!closed) { "Распознаватель уже закрыт" }
        check(activeSession == null) { "Сессия распознавания уже запущена" }
        Session(
            recognizer.createStream(),
            onPartialResult,
            onFinalResult,
            onError
        ).also { activeSession = it }
    }

    override fun close() {
        synchronized(lock) {
            if (closed) return
            activeSession?.closeLocked()
            activeSession = null
            closed = true
            recognizer.release()
        }
    }

    private inner class Session(
        private val stream: com.k2fsa.sherpa.onnx.OnlineStream,
        private val onPartial: (String) -> Unit,
        private val onFinal: (String) -> Unit,
        private val onError: (String) -> Unit
    ) : SpeechRecognitionSession {
        private var sessionClosed = false

        override fun acceptAudioFrame(samples: FloatArray, sampleRate: Int) {
            var partial: String? = null
            var final: String? = null
            var failure: String? = null
            synchronized(lock) {
                if (sessionClosed || closed) return
                if (sampleRate != INPUT_SAMPLE_RATE) {
                    failure = "Модель ожидает звук с частотой $INPUT_SAMPLE_RATE Гц"
                    closeLocked()
                } else {
                    try {
                        if (samples.isNotEmpty()) stream.acceptWaveform(samples, sampleRate)
                        decodeAvailable()
                        val text = recognizer.getResult(stream).text.trim()
                        if (recognizer.isEndpoint(stream)) {
                            final = text.takeIf { it.isNotEmpty() }
                            recognizer.reset(stream)
                        } else {
                            partial = text.takeIf { it.isNotEmpty() }
                        }
                    } catch (error: Exception) {
                        failure = error.message ?: "Ошибка русского распознавания"
                        closeLocked()
                    }
                }
            }
            partial?.let(onPartial)
            final?.let(onFinal)
            failure?.let(onError)
        }

        override fun finish() {
            var final: String? = null
            var failure: String? = null
            synchronized(lock) {
                if (sessionClosed || closed) return
                try {
                    stream.inputFinished()
                    decodeAvailable()
                    final = recognizer.getResult(stream).text.trim().takeIf { it.isNotEmpty() }
                } catch (error: Exception) {
                    failure = error.message ?: "Не удалось завершить распознавание"
                } finally {
                    closeLocked()
                }
            }
            final?.let(onFinal)
            failure?.let(onError)
        }

        override fun cancel() {
            synchronized(lock) { closeLocked() }
        }

        override fun close() = cancel()

        private fun decodeAvailable() {
            var guard = 0
            while (recognizer.isReady(stream)) {
                recognizer.decode(stream)
                guard += 1
                check(guard <= 10_000) { "Слишком много циклов декодирования" }
            }
        }

        fun closeLocked() {
            if (sessionClosed) return
            sessionClosed = true
            try { stream.release() } catch (_: Exception) {}
            if (activeSession === this) activeSession = null
        }
    }
}
