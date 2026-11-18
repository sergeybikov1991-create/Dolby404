package com.dolby404.messenger.voice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import android.content.pm.ServiceInfo
import androidx.core.content.ContextCompat
import com.dolby404.messenger.MainActivity
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Foreground microphone owner for the offline wake phrase.
 *
 * Start only from a visible activity after the user enables hands-free mode
 * and grants RECORD_AUDIO. This service deliberately does not launch an
 * Activity from the background; after a wake phrase it leaves an actionable
 * notification and emits a package-scoped broadcast.
 */
class WakeWordForegroundService : Service() {

    companion object {
        const val ACTION_START = "com.dolby404.messenger.voice.START_WAKE_WORD"
        const val ACTION_STOP = "com.dolby404.messenger.voice.STOP_WAKE_WORD"
        const val ACTION_WAKE_DETECTED = "com.dolby404.messenger.voice.WAKE_DETECTED"
        private const val CHANNEL_ID = "floustream_voice_activation"
        private const val NOTIFICATION_ID = 4107
        private const val SAMPLE_RATE = 16_000
        private const val FRAME_SAMPLES = 2_048
    }

    private val stopping = AtomicBoolean(false)
    @Volatile private var captureThread: Thread? = null
    @Volatile private var recorder: AudioRecord? = null
    @Volatile private var lease: VoiceAudioSessionCoordinator.Lease? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopCapture()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf(startId)
                return START_NOT_STICKY
            }
            ACTION_START -> {
                // Android requires promotion immediately after a microphone FGS start.
                ServiceCompat.startForeground(
                    this,
                    NOTIFICATION_ID,
                    buildNotification("Ожидаю фразу «Флоу»"),
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE else 0
                )
                if (captureThread == null) startCapture()
            }
            else -> {
                stopSelf(startId)
                return START_NOT_STICKY
            }
        }
        return START_NOT_STICKY
    }

    private fun startCapture() {
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            showStatus("Нет разрешения на микрофон. Открой FLOUSTREAM и разреши доступ.")
            stopSelf()
            return
        }

        val modelDirectory = File(filesDir, "wakeword/model")
        if (!modelDirectory.isDirectory) {
            showStatus("Офлайн-модель ещё не установлена. Открой FLOUSTREAM для настройки.")
            stopSelf()
            return
        }

        val audioLease = VoiceAudioSessionCoordinator.shared.tryAcquire(VoiceAudioOwner.WAKE_WORD)
        if (audioLease == null) {
            showStatus("Микрофон уже используется звонком или записью.")
            stopSelf()
            return
        }
        lease = audioLease
        stopping.set(false)

        captureThread = Thread({
            runCapture(modelDirectory)
        }, "FloustreamWakeWord").apply {
            priority = Thread.NORM_PRIORITY
            start()
        }
    }

    private fun runCapture(modelDirectory: File) {
        var detector: VoskWakeWordDetector? = null
        var activeRecorder: AudioRecord? = null
        try {
            val minBuffer = AudioRecord.getMinBufferSize(
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            )
            check(minBuffer > 0) { "Устройство не поддерживает запись PCM 16 кГц" }

            val bufferBytes = maxOf(minBuffer, FRAME_SAMPLES * 2 * 2)
            activeRecorder = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferBytes
            )
            check(activeRecorder.state == AudioRecord.STATE_INITIALIZED) {
                "Не удалось открыть микрофон для активации"
            }
            recorder = activeRecorder
            detector = VoskWakeWordDetector(modelDirectory)
            activeRecorder.startRecording()
            val frame = ShortArray(FRAME_SAMPLES)

            while (!stopping.get()) {
                val count = activeRecorder.read(frame, 0, frame.size, AudioRecord.READ_BLOCKING)
                if (count > 0 && detector.acceptAudio(frame, count)) {
                    stopping.set(true)
                    notifyWakeDetected()
                    break
                }
                check(count >= 0) { "Ошибка чтения микрофона: $count" }
            }
        } catch (error: Exception) {
            if (!stopping.get()) {
                showStatus(error.message?.take(120) ?: "Не удалось запустить голосовую активацию")
            }
        } finally {
            stopping.set(true)
            runCatching { activeRecorder?.stop() }
            runCatching { activeRecorder?.release() }
            recorder = null
            runCatching { detector?.close() }
            lease?.close()
            lease = null
            captureThread = null
            stopSelf()
        }
    }

    private fun notifyWakeDetected() {
        showStatus("Фраза «Флоу» услышана. Нажми, чтобы открыть голосового помощника.")
        sendBroadcast(Intent(ACTION_WAKE_DETECTED).setPackage(packageName))
    }

    private fun showStatus(message: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification(message))
    }

    private fun buildNotification(message: String): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 4107, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("FLOUSTREAM — голосовой помощник")
            .setContentText(message)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Голосовая активация FLOUSTREAM",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Постоянное уведомление при включённом ожидании фразы «Флоу»"
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun stopCapture() {
        stopping.set(true)
        runCatching { recorder?.stop() }
        captureThread?.interrupt()
    }

    override fun onDestroy() {
        stopCapture()
        lease?.close()
        lease = null
        super.onDestroy()
    }
}
