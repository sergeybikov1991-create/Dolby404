package com.floustream.webshelltest.audio

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.media.MediaRecorder
import android.os.Build
import android.webkit.JavascriptInterface
import java.io.File
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Native M4A recorder exposed to the trusted FLOUSTREAM WebView page.
 *
 * The page still sends the resulting File through its existing attachment
 * input, so Supabase upload and message creation remain the established flow.
 */
class VoiceMessageAudioBridge(
    private val context: Context,
    private val coordinator: VoiceAudioSessionCoordinator
) {
    private var lease: VoiceAudioSessionCoordinator.Lease? = null
    private var recorder: MediaRecorder? = null
    private var recordingFile: File? = null
    private val completedFiles = ConcurrentHashMap<String, File>()

    @JavascriptInterface
    @Synchronized
    fun tryAcquireVoiceMessage(): Boolean {
        if (lease != null) return false
        lease = coordinator.tryAcquire(VoiceAudioOwner.VOICE_MESSAGE)
        return lease != null
    }

    @JavascriptInterface
    @SuppressLint("MissingPermission")
    @Synchronized
    fun startNativeRecording(): Boolean {
        if (lease == null || recorder != null) return false
        if (context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            return false
        }

        var createdRecorder: MediaRecorder? = null
        var createdFile: File? = null
        return try {
            val file = File(context.cacheDir, "voice_${UUID.randomUUID()}.m4a")
            createdFile = file
            val activeRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                MediaRecorder()
            }
            createdRecorder = activeRecorder
            activeRecorder.setAudioSource(MediaRecorder.AudioSource.MIC)
            activeRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            activeRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            activeRecorder.setAudioEncodingBitRate(96_000)
            activeRecorder.setAudioSamplingRate(44_100)
            activeRecorder.setOutputFile(file.absolutePath)
            activeRecorder.prepare()
            activeRecorder.start()
            recordingFile = file
            recorder = activeRecorder
            true
        } catch (_: Exception) {
            try { createdRecorder?.reset() } catch (_: Exception) { }
            try { createdRecorder?.release() } catch (_: Exception) { }
            createdFile?.delete()
            false
        }
    }

    @JavascriptInterface
    @Synchronized
    fun stopNativeRecording(): String {
        val activeRecorder = recorder ?: return ""
        val file = recordingFile
        recorder = null
        recordingFile = null

        val saved = try {
            activeRecorder.stop()
            true
        } catch (_: Exception) {
            false
        } finally {
            try { activeRecorder.reset() } catch (_: Exception) { }
            try { activeRecorder.release() } catch (_: Exception) { }
        }

        if (!saved || file == null || !file.exists() || file.length() < 1_500L ||
            file.length() > 50L * 1024L * 1024L
        ) {
            file?.delete()
            return ""
        }

        val token = UUID.randomUUID().toString()
        completedFiles[token] = file
        return token
    }

    @JavascriptInterface
    @Synchronized
    fun cancelNativeRecording() {
        cancelActiveRecording()
        releaseLease()
    }

    @JavascriptInterface
    @Synchronized
    fun releaseVoiceMessage() {
        // Never release ownership while the native recorder is still capturing.
        if (recorder != null) cancelActiveRecording()
        releaseLease()
    }

    @Synchronized
    private fun cancelActiveRecording() {
        val activeRecorder = recorder
        val file = recordingFile
        recorder = null
        recordingFile = null
        try { activeRecorder?.stop() } catch (_: Exception) { }
        try { activeRecorder?.reset() } catch (_: Exception) { }
        try { activeRecorder?.release() } catch (_: Exception) { }
        file?.delete()
    }

    @Synchronized
    private fun releaseLease() {
        lease?.close()
        lease = null
    }

    /** Called only by WebViewClient for the private same-origin media URL. */
    fun takeCompletedFile(token: String): File? {
        if (!token.matches(Regex("[0-9a-fA-F-]{36}"))) return null
        return completedFiles.remove(token)
    }

    @Synchronized
    fun close() {
        cancelActiveRecording()
        releaseLease()
        completedFiles.values.forEach { it.delete() }
        completedFiles.clear()
    }
}
