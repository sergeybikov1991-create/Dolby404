package com.dolby404.messenger.voice

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.media.audiofx.NoiseSuppressor
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.AutomaticGainControl
import android.util.Log
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Push-to-talk PCM capture for the local speech recognizer.
 *
 * Audio format is mono, 16 kHz, PCM 16-bit, matching the upstream sherpa-onnx
 * Android streaming sample. The supplied coordinator serializes microphone use
 * with calls, voice messages and future wake-word capture.
 *
 * stop() releases AudioRecord before releasing the ownership lease. The client
 * must not start another microphone consumer until stop() has completed.
 */
class AndroidPcmAudioCapture(
    private val coordinator: VoiceAudioSessionCoordinator,
    private val onAudioFrame: (FloatArray, sampleRate: Int) -> Unit,
    private val onError: (String) -> Unit = {}
) {

    companion object {
        private const val TAG = "FlouVoiceCapture"
        const val SAMPLE_RATE = 16_000
        private const val FRAME_DURATION_MS = 100
    }

    private val lock = Any()
    private val running = AtomicBoolean(false)

    private var recorder: AudioRecord? = null
    private var captureThread: Thread? = null
    private var lease: VoiceAudioSessionCoordinator.Lease? = null
    private var noiseSuppressor: NoiseSuppressor? = null
    private var echoCanceler: AcousticEchoCanceler? = null
    private var gainControl: AutomaticGainControl? = null

    val isRunning: Boolean
        get() = running.get()

    /**
     * Starts capture only while the app is foregrounded and RECORD_AUDIO has
     * already been granted by the UI layer.
     */
    fun start(): Boolean = synchronized(lock) {
        if (running.get()) return@synchronized true

        val acquired = coordinator.tryAcquire(VoiceAudioOwner.ASSISTANT)
        if (acquired == null) {
            onError("Микрофон уже используется другой функцией FLOUSTREAM")
            return@synchronized false
        }

        var createdRecorder: AudioRecord? = null
        try {
            val minBuffer = AudioRecord.getMinBufferSize(
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            )
            if (minBuffer <= 0) {
                throw IllegalStateException("Android не смог определить размер аудиобуфера")
            }

            val frameSamples = SAMPLE_RATE * FRAME_DURATION_MS / 1000
            val bufferBytes = maxOf(minBuffer, frameSamples * 2 * 4)

            createdRecorder = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferBytes
            )

            if (createdRecorder.state != AudioRecord.STATE_INITIALIZED) {
                throw IllegalStateException("Не удалось инициализировать микрофон")
            }

            recorder = createdRecorder
            lease = acquired
            attachAvailableAudioEffects(createdRecorder.audioSessionId)

            createdRecorder.startRecording()
            if (createdRecorder.recordingState != AudioRecord.RECORDSTATE_RECORDING) {
                throw IllegalStateException("Android не перевёл микрофон в режим записи")
            }

            running.set(true)
            captureThread = Thread(
                { readAudioFrames(createdRecorder, frameSamples) },
                "FlouVoicePcmCapture"
            ).apply {
                isDaemon = true
                start()
            }
            true
        } catch (error: Exception) {
            running.set(false)
            releaseAudioEffects()
            try {
                createdRecorder?.release()
            } catch (_: Exception) {
            }
            recorder = null
            lease = null
            acquired.close()
            onError(error.message ?: "Не удалось запустить захват речи")
            false
        }
    }

    /**
     * Stops capture and waits for the reader thread to exit before releasing
     * AudioRecord and the microphone lease.
     */
    fun stop() {
        val threadToJoin: Thread?
        val recorderToStop: AudioRecord?

        synchronized(lock) {
            if (!running.get() && recorder == null) return
            running.set(false)
            threadToJoin = captureThread
            recorderToStop = recorder
            try {
                recorderToStop?.stop()
            } catch (_: IllegalStateException) {
            }
        }

        if (threadToJoin != null && threadToJoin !== Thread.currentThread()) {
            try {
                threadToJoin.join(1_500)
            } catch (interrupted: InterruptedException) {
                Thread.currentThread().interrupt()
            }
        }

        synchronized(lock) {
            releaseAudioEffects()
            try {
                recorderToStop?.release()
            } catch (_: Exception) {
            }
            recorder = null
            captureThread = null
            lease?.close()
            lease = null
        }
    }

    private fun readAudioFrames(audioRecord: AudioRecord, frameSamples: Int) {
        val pcm = ShortArray(frameSamples)
        try {
            while (running.get()) {
                val count = audioRecord.read(pcm, 0, pcm.size, AudioRecord.READ_BLOCKING)
                if (count > 0 && running.get()) {
                    val floats = FloatArray(count) { index ->
                        pcm[index] / 32768.0f
                    }
                    onAudioFrame(floats, SAMPLE_RATE)
                } else if (count < 0 && running.get()) {
                    throw IllegalStateException("Ошибка чтения микрофона: $count")
                }
            }
        } catch (error: Exception) {
            if (running.get()) {
                Log.e(TAG, "PCM capture failed", error)
                running.set(false)
                onError(error.message ?: "Ошибка чтения микрофона")
            }
        }
    }

    private fun attachAvailableAudioEffects(sessionId: Int) {
        if (NoiseSuppressor.isAvailable()) {
            noiseSuppressor = NoiseSuppressor.create(sessionId)?.apply { enabled = true }
        }
        if (AcousticEchoCanceler.isAvailable()) {
            echoCanceler = AcousticEchoCanceler.create(sessionId)?.apply { enabled = true }
        }
        if (AutomaticGainControl.isAvailable()) {
            gainControl = AutomaticGainControl.create(sessionId)?.apply { enabled = true }
        }
    }

    private fun releaseAudioEffects() {
        try { noiseSuppressor?.release() } catch (_: Exception) {}
        try { echoCanceler?.release() } catch (_: Exception) {}
        try { gainControl?.release() } catch (_: Exception) {}
        noiseSuppressor = null
        echoCanceler = null
        gainControl = null
    }
}
