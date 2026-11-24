package com.floustream.webshelltest.audio

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.media.MediaRecorder
import android.os.Build
import android.webkit.JavascriptInterface
import com.floustream.webshelltest.SiteRoutePolicy
import java.io.File
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Native M4A recorder exposed to the trusted FLOUSTREAM WebView page.
 * Permission is requested by Android directly; WebRTC/getUserMedia is never
 * opened as a temporary microphone owner before MediaRecorder starts.
 */
class VoiceMessageAudioBridge(
    private val context: Context,
    private val coordinator: VoiceAudioSessionCoordinator
) {
    private var lease: VoiceAudioSessionCoordinator.Lease? = null
    private var recorder: MediaRecorder? = null
    private var recordingFile: File? = null
    private var recordingStartedAtMillis: Long = 0L
    private val completedFiles = ConcurrentHashMap<String, File>()
    val javascriptToken: String = UUID.randomUUID().toString()

    @Volatile var activeUserId: String? = null
    @Volatile var routeChangeListener: ((String) -> Unit)? = null
    @Volatile private var permissionRequestPending = false
    @Volatile private var permissionWasRequested = false
    @Volatile private var lastStartError = ""

    @JavascriptInterface
    fun updateSessionUserId(token: String, userId: String?) {
        if (!isValidToken(token)) return
        val candidate = userId?.trim().orEmpty()
        activeUserId = candidate.takeIf { it.matches(Regex("[0-9a-fA-F-]{36}")) }
    }

    private fun isValidToken(token: String): Boolean = token == javascriptToken

    @JavascriptInterface
    fun onSiteRouteChanged(token: String, route: String) {
        if (!isValidToken(token) || !SiteRoutePolicy.isKnownRouteName(route)) return
        val normalized = route.trim().substringAfterLast('/').substringBefore('?')
        val activity = context as? Activity ?: return
        activity.runOnUiThread { routeChangeListener?.invoke(normalized) }
    }

    @JavascriptInterface
    fun requestVoicePermission(token: String): String {
        if (!isValidToken(token)) return "unavailable"
        if (hasRecordPermission()) return "granted"
        val activity = context as? Activity ?: return "unavailable"
        if (!permissionRequestPending) {
            permissionRequestPending = true
            permissionWasRequested = true
            activity.runOnUiThread {
                if (activity.isFinishing || activity.isDestroyed) {
                    permissionRequestPending = false
                    return@runOnUiThread
                }
                activity.requestPermissions(
                    arrayOf(Manifest.permission.RECORD_AUDIO),
                    VOICE_PERMISSION_REQUEST_CODE
                )
            }
        }
        return "pending"
    }

    @JavascriptInterface
    fun voicePermissionState(token: String): String {
        if (!isValidToken(token)) return "unavailable"
        if (hasRecordPermission()) return "granted"
        if (permissionRequestPending) return "pending"
        return if (permissionWasRequested) "denied" else "missing"
    }

    fun onVoicePermissionResult(granted: Boolean) {
        permissionRequestPending = false
        permissionWasRequested = true
    }

    @JavascriptInterface
    fun tryAcquireVoiceMessage(token: String): Boolean {
        if (!isValidToken(token)) return false
        synchronized(this) {
            if (lease != null) return false
            lease = coordinator.tryAcquire(VoiceAudioOwner.VOICE_MESSAGE)
            return lease != null
        }
    }

    @JavascriptInterface
    @SuppressLint("MissingPermission")
    @Synchronized
    fun startNativeRecording(token: String): Boolean {
        if (!isValidToken(token) || lease == null || recorder != null) return false
        if (!hasRecordPermission()) {
            lastStartError = "RECORD_AUDIO permission is not granted"
            return false
        }

        var createdRecorder: MediaRecorder? = null
        var createdFile: File? = null
        var stage = "create recorder"
        return try {
            val file = File(context.cacheDir, "voice_${UUID.randomUUID()}.m4a")
            createdFile = file
            val activeRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }
            createdRecorder = activeRecorder
            stage = "select microphone source"
            activeRecorder.setAudioSource(MediaRecorder.AudioSource.MIC)
            stage = "configure MP4 container"
            activeRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            stage = "configure AAC encoder"
            activeRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            // Let Android choose device-supported bitrate and sample rate.
            // Hard-coding 44.1 kHz can fail on devices whose input path exposes
            // a different native capture rate.
            stage = "set output file"
            activeRecorder.setOutputFile(file.absolutePath)
            stage = "prepare audio recorder"
            activeRecorder.prepare()
            stage = "start audio capture"
            activeRecorder.start()
            recordingFile = file
            recorder = activeRecorder
            recordingStartedAtMillis = System.currentTimeMillis()
            lastStartError = ""
            true
        } catch (error: Exception) {
            lastStartError = "$stage — ${error.javaClass.simpleName}: ${error.message ?: "no detail"}"
            try { createdRecorder?.reset() } catch (_: Exception) { }
            try { createdRecorder?.release() } catch (_: Exception) { }
            createdFile?.delete()
            false
        }
    }

    @JavascriptInterface
    fun getLastStartError(token: String): String =
        if (isValidToken(token)) lastStartError else ""

    @JavascriptInterface
    @Synchronized
    fun stopNativeRecording(token: String): String {
        if (!isValidToken(token)) return ""
        val activeRecorder = recorder ?: return ""
        val file = recordingFile
        val elapsedMillis = if (recordingStartedAtMillis > 0L) System.currentTimeMillis() - recordingStartedAtMillis else 0L
        recorder = null
        recordingFile = null
        recordingStartedAtMillis = 0L

        val saved = try {
            activeRecorder.stop()
            true
        } catch (_: Exception) {
            false
        } finally {
            try { activeRecorder.reset() } catch (_: Exception) { }
            try { activeRecorder.release() } catch (_: Exception) { }
        }

        if (!saved || elapsedMillis < 1_000L || file == null || !file.exists() || file.length() < 1_500L ||
            file.length() > 50L * 1024L * 1024L
        ) {
            file?.delete()
            return ""
        }

        val fileToken = UUID.randomUUID().toString()
        completedFiles[fileToken] = file
        return fileToken
    }

    @JavascriptInterface
    @Synchronized
    fun cancelNativeRecording(token: String) {
        if (!isValidToken(token)) return
        cancelActiveRecording()
        completedFiles.values.forEach { it.delete() }
        completedFiles.clear()
        releaseLease()
    }

    @JavascriptInterface
    @Synchronized
    fun discardCompletedFile(sessionToken: String, fileToken: String) {
        if (!isValidToken(sessionToken) || !fileToken.matches(Regex("[0-9a-fA-F-]{36}"))) return
        completedFiles.remove(fileToken)?.delete()
    }

    @JavascriptInterface
    @Synchronized
    fun releaseVoiceMessage(token: String) {
        if (!isValidToken(token)) return
        if (recorder != null) cancelActiveRecording()
        releaseLease()
    }

    @Synchronized
    private fun cancelActiveRecording() {
        val activeRecorder = recorder
        val file = recordingFile
        recorder = null
        recordingFile = null
        recordingStartedAtMillis = 0L
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

    private fun hasRecordPermission(): Boolean =
        context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

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

    companion object {
        const val VOICE_PERMISSION_REQUEST_CODE = 4104
    }
}
