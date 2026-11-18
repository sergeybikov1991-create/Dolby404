package com.dolby404.messenger

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.view.TextureView
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.dolby404.messenger.voice.VoiceAudioOwner
import com.dolby404.messenger.voice.VoiceAudioSessionCoordinator
import com.pedro.common.ConnectChecker
import com.pedro.encoder.input.sources.audio.MicrophoneSource
import com.pedro.encoder.input.sources.video.Camera2Source
import com.pedro.library.base.recording.RecordController
import com.pedro.library.generic.GenericStream
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeoutOrNull
import java.io.File
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

internal enum class VideoCaptureMode { ROUND_FRONT, NORMAL_SWITCHABLE }

/** Video capture using RootEncoder + Camera2Source + MediaCodec. CameraX is not used. */
@Composable
internal fun RoundVideoRecorder(
    mode: VideoCaptureMode,
    audioCoordinator: VoiceAudioSessionCoordinator,
    onDismiss: () -> Unit,
    onRecordingFinishing: (File) -> Unit,
    onRecorded: (File) -> Unit,
    onError: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val latestOnRecordingFinishing = rememberUpdatedState(onRecordingFinishing)
    val latestOnRecorded = rememberUpdatedState(onRecorded)
    val latestOnError = rememberUpdatedState(onError)

    var hasPermissions by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        )
    }
    var cameraReady by remember { mutableStateOf(false) }
    var recordingActive by remember { mutableStateOf(false) }
    var finalizing by remember { mutableStateOf(false) }
    var elapsedSeconds by remember { mutableIntStateOf(0) }
    var startedAt by remember { mutableLongStateOf(0L) }
    val latestFinalizing = rememberUpdatedState(finalizing)
    var previewView by remember { mutableStateOf<TextureView?>(null) }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        hasPermissions = result[Manifest.permission.CAMERA] == true &&
            result[Manifest.permission.RECORD_AUDIO] == true
        if (!hasPermissions) latestOnError.value("Для видеосообщений нужны разрешения камеры и микрофона.")
    }

    val shouldSend = remember { AtomicBoolean(false) }
    // A very short press can be released before RootEncoder reports RECORDING.
    // Queue the round-video stop until the encoder confirms that recording began.
    val pendingRoundStop = remember { AtomicBoolean(false) }
    val pendingRoundSend = remember { AtomicBoolean(false) }
    val disposed = remember { AtomicBoolean(false) }
    val recordingFile = remember { mutableStateOf<File?>(null) }
    var videoAudioLease by remember { mutableStateOf<VoiceAudioSessionCoordinator.Lease?>(null) }
    val cameraSource = remember(context) { Camera2Source(context) }
    val stream = remember(context) {
        val checker = object : ConnectChecker {
            override fun onConnectionStarted(url: String) {}
            override fun onConnectionSuccess() {}
            override fun onConnectionFailed(reason: String) {}
            override fun onDisconnect() {}
            override fun onAuthError() {}
            override fun onAuthSuccess() {}
        }
        // Use RootEncoder's built-in AndroidMuxerRecordController.
        // A custom lock around its async callbacks can deadlock start/stop.
        GenericStream(context.applicationContext, checker, cameraSource, MicrophoneSource())
    }

    fun stopRecording(send: Boolean) {
        if (!stream.isRecording) {
            if (mode == VideoCaptureMode.ROUND_FRONT && recordingFile.value != null) {
                pendingRoundSend.set(send)
                pendingRoundStop.set(true)
            }
            return
        }
        pendingRoundStop.set(false)
        shouldSend.set(send)
        finalizing = true
        if (send) recordingFile.value?.let { file -> latestOnRecordingFinishing.value(file) }
        RoundVideoDiagnostics.record(context, "RootEncoder stopRecord requested; send=$send")
        try {
            stream.stopRecord()
        } catch (error: Exception) {
            RoundVideoDiagnostics.record(context, "RootEncoder stopRecord failed", error)
            recordingFile.value?.delete()
            recordingFile.value = null
            recordingActive = false
            finalizing = false
            startedAt = 0L
            shouldSend.set(false)
            videoAudioLease?.close()
            videoAudioLease = null
            latestOnError.value(error.message ?: "Не удалось завершить видеозапись.")
        }
    }

    LaunchedEffect(hasPermissions) {
        if (!hasPermissions) permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO))
    }

    LaunchedEffect(hasPermissions, previewView) {
        val view = previewView ?: return@LaunchedEffect
        if (!hasPermissions) return@LaunchedEffect
        try {
            if (mode == VideoCaptureMode.ROUND_FRONT) {
                cameraSource.switchCamera()
                RoundVideoDiagnostics.record(context, "Front camera selected for round video")
            }
            RoundVideoDiagnostics.record(context, "RootEncoder prepare; mode=$mode; 640x480; rotation=90")
            val videoPrepared = stream.prepareVideo(640, 480, 700_000, fps = 24, rotation = 90)
            val audioPrepared = stream.prepareAudio(32_000, true, 96_000)
            if (!videoPrepared || !audioPrepared) throw IllegalStateException("RootEncoder не смог подготовить видео- или аудиокодек.")
            if (!stream.isOnPreview) stream.startPreview(view, true)
            cameraReady = stream.isOnPreview
            RoundVideoDiagnostics.record(context, "RootEncoder preview started")
        } catch (error: Exception) {
            RoundVideoDiagnostics.record(context, "RootEncoder initialization failed", error)
            cameraReady = false
            latestOnError.value(error.message ?: "Не удалось запустить камеру через RootEncoder.")
        }
    }

    fun startRecording(): Boolean {
        if (!cameraReady || stream.isRecording || finalizing || disposed.get()) return false
        val acquiredLease = audioCoordinator.tryAcquire(VoiceAudioOwner.VIDEO_MESSAGE)
        if (acquiredLease == null) {
            latestOnError.value("Микрофон сейчас занят голосовым помощником или другой записью.")
            return false
        }
        videoAudioLease = acquiredLease
        val draftsDir = File(context.filesDir, "video-drafts")
        if (!draftsDir.exists() && !draftsDir.mkdirs()) {
            latestOnError.value("Не удалось создать папку для сохранения видеозаписи.")
            videoAudioLease?.close()
            videoAudioLease = null
            return false
        }
        val file = File(draftsDir, "video_${UUID.randomUUID()}.mp4")
        recordingFile.value = file
        shouldSend.set(false)
        return try {
            RoundVideoDiagnostics.record(context, "RootEncoder startRecord; persistent filesDir MP4; mode=$mode")
            stream.startRecord(file.absolutePath) { status ->
                RoundVideoDiagnostics.record(context, "RootEncoder record status=$status; bytes=${file.length()}")
                Handler(Looper.getMainLooper()).post {
                when (status) {
                    RecordController.Status.RECORDING -> {
                        startedAt = System.currentTimeMillis()
                        elapsedSeconds = 0
                        recordingActive = true
                        if (mode == VideoCaptureMode.ROUND_FRONT && pendingRoundStop.getAndSet(false)) {
                            stopRecording(send = pendingRoundSend.get())
                        }
                    }
                    RecordController.Status.STOPPED -> {
                        pendingRoundStop.set(false)
                        pendingRoundSend.set(false)
                        recordingActive = false
                        startedAt = 0L
                        elapsedSeconds = 0
                        finalizing = false
                        recordingFile.value = null
                        videoAudioLease?.close()
                        videoAudioLease = null
                        when {
                            shouldSend.get() && file.isFile && file.length() > 1500L -> {
                                // Hand the finalized draft to the chat immediately. The sender
                                // owns the size check and retains the file if upload is rejected.
                                latestOnRecorded.value(file)
                            }
                            shouldSend.get() -> {
                                file.delete()
                                latestOnError.value("RootEncoder завершил запись без видеоданных. Попробуй ещё раз.")
                            }
                            else -> file.delete()
                        }
                        if (disposed.get()) {
                            runCatching {
                                if (stream.isOnPreview) stream.stopPreview(true)
                                stream.release()
                            }.onFailure { RoundVideoDiagnostics.record(context, "RootEncoder deferred release failed", it) }
                        }
                    }
                    else -> Unit
                }
                }
            }
            true
        } catch (error: Exception) {
            RoundVideoDiagnostics.record(context, "RootEncoder startRecord failed", error)
            file.delete()
            recordingFile.value = null
            shouldSend.set(false)
            videoAudioLease?.close()
            videoAudioLease = null
            latestOnError.value(error.message ?: "Не удалось начать видеозапись.")
            false
        }
    }

    LaunchedEffect(recordingActive, startedAt) {
        while (recordingActive && startedAt > 0L) {
            elapsedSeconds = ((System.currentTimeMillis() - startedAt) / 1000L).toInt()
            val maxDurationSeconds = if (mode == VideoCaptureMode.ROUND_FRONT) 60 else 300
            if (elapsedSeconds >= maxDurationSeconds) {
                stopRecording(send = true)
                break
            }
            delay(200L)
        }
        if (!recordingActive) elapsedSeconds = 0
    }

    DisposableEffect(lifecycleOwner, stream) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_PAUSE) {
                RoundVideoDiagnostics.record(context, "Activity ON_PAUSE; stop RootEncoder without sending")
                stopRecording(send = false)
                if (stream.isOnPreview) stream.stopPreview()
            } else if (event == Lifecycle.Event.ON_RESUME && hasPermissions && previewView != null && !stream.isOnPreview) {
                runCatching { stream.startPreview(previewView!!, true) }
                    .onFailure { RoundVideoDiagnostics.record(context, "RootEncoder preview resume failed", it) }
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            disposed.set(true)
            if (latestFinalizing.value && shouldSend.get()) {
                // The chat now owns the pending bubble. Let the muxer finish closing
                // the MP4 before releasing RootEncoder or deleting the persistent draft.
                RoundVideoDiagnostics.record(context, "Recorder UI disposed during send finalization; deferring stream release")
            } else {
                shouldSend.set(false)
                runCatching {
                    if (stream.isRecording) stream.stopRecord()
                    if (stream.isOnPreview) stream.stopPreview(true)
                    stream.release()
                }.onFailure { RoundVideoDiagnostics.record(context, "RootEncoder release failed", it) }
                recordingFile.value?.delete()
                recordingFile.value = null
                videoAudioLease?.close()
                videoAudioLease = null
                RoundVideoDiagnostics.record(context, "RootEncoder recorder disposed")
            }
        }
    }

    Dialog(onDismissRequest = { stopRecording(false); onDismiss() }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Column(
            Modifier.fillMaxSize().background(Color(0xFF080D1B)).padding(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = { stopRecording(false); onDismiss() }) { Text("Отмена", color = Color.White) }
                Text(if (mode == VideoCaptureMode.ROUND_FRONT) "Видеокружок" else "Обычное видео", color = Color.White, fontSize = 17.sp)
                if (mode == VideoCaptureMode.NORMAL_SWITCHABLE) {
                    TextButton(enabled = cameraReady && !finalizing, onClick = {
                        try { cameraSource.switchCamera(); RoundVideoDiagnostics.record(context, "RootEncoder camera switch requested while preview active") }
                        catch (error: Exception) { RoundVideoDiagnostics.record(context, "RootEncoder camera switch failed", error); latestOnError.value(error.message ?: "Не удалось переключить камеру.") }
                    }) { Text("↻", color = Color.White, fontSize = 22.sp) }
                } else Spacer(Modifier.width(48.dp))
            }
            Spacer(Modifier.height(24.dp))
            val previewShape = if (mode == VideoCaptureMode.ROUND_FRONT) CircleShape else RoundedCornerShape(22.dp)
            Box(
                Modifier.fillMaxWidth().weight(1f)
                    .clip(previewShape).background(Color.Black),
                contentAlignment = Alignment.Center
            ) {
                AndroidView(factory = { TextureView(it).also { view -> previewView = view } }, modifier = Modifier.fillMaxSize())
                if (!cameraReady) CircularProgressIndicator(color = Color.White)
            }
            Spacer(Modifier.height(28.dp))
            Text(
                when {
                    finalizing -> "Сохраняем видео…"
                    recordingActive && mode == VideoCaptureMode.ROUND_FRONT -> "● Запись 0:${String.format("%02d", elapsedSeconds)} — отпусти для отправки"
                    recordingActive -> "● Видео ${String.format("%d:%02d", elapsedSeconds / 60, elapsedSeconds % 60)} — нажми ■ для завершения"
                    mode == VideoCaptureMode.ROUND_FRONT -> "Удерживай кнопку · свайп влево отменяет"
                    else -> "Нажми ● чтобы начать запись · затем ■ для завершения"
                },
                color = Color(0xFFB7C4DA), fontSize = 12.sp
            )
            Spacer(Modifier.height(8.dp))
            TextButton(onClick = {
                val log = RoundVideoDiagnostics.read(context)
                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                clipboard.setPrimaryClip(ClipData.newPlainText("FLOUSTREAM diagnostics", log))
                Toast.makeText(context, "Диагностика скопирована. Вставь её сюда.", Toast.LENGTH_LONG).show()
            }) { Text("Скопировать диагностику", color = Color(0xFF9FCBFF), fontSize = 12.sp) }
            Spacer(Modifier.height(8.dp))
            Box(
                Modifier.size(78.dp).clip(CircleShape).background(if (recordingActive) Color(0xFF9A65FF) else Color(0xFF548BFF))
                    .then(
                        if (mode == VideoCaptureMode.NORMAL_SWITCHABLE) {
                            Modifier.clickable(enabled = cameraReady && !finalizing) {
                                if (recordingActive) stopRecording(send = true) else startRecording()
                            }
                        } else {
                            Modifier.pointerInput(cameraReady, finalizing, recordingActive) {
                                awaitEachGesture {
                                    if (!cameraReady || finalizing || recordingActive) return@awaitEachGesture
                                    // A round video is a press-and-hold gesture: begin on DOWN.
                                    // Waiting for a long-press timeout can consume the UP event
                                    // on slower devices, leaving the preview open without ever
                                    // calling RootEncoder.startRecord().
                                    val down = awaitFirstDown(requireUnconsumed = false)
                                    if (!startRecording()) return@awaitEachGesture
                                    var cancel = false
                                    var finished = false
                                    while (!finished) {
                                        val event = awaitPointerEvent()
                                        val change = event.changes.firstOrNull { it.id == down.id }
                                        if (change == null) {
                                            stopRecording(send = false)
                                            finished = true
                                        } else {
                                            if (change.position.x < down.position.x - 70.dp.toPx()) cancel = true
                                            if (!change.pressed) {
                                                stopRecording(send = !cancel)
                                                finished = true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ),
                contentAlignment = Alignment.Center
            ) { Text(if (recordingActive) "■" else "●", color = Color.White, fontSize = 30.sp) }
        }
    }
}
