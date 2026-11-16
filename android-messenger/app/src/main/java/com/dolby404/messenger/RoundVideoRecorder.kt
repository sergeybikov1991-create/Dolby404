package com.dolby404.messenger

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.view.SurfaceView
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
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

/** Round video capture using RootEncoder + Camera2Source + MediaCodec. CameraX is not used. */
@Composable
internal fun RoundVideoRecorder(
    onDismiss: () -> Unit,
    onRecorded: (File) -> Unit,
    onError: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val latestOnRecorded = rememberUpdatedState(onRecorded)
    val latestOnError = rememberUpdatedState(onError)

    var hasPermissions by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        )
    }
    var cameraReady by remember { mutableStateOf(false) }
    var frontCamera by remember { mutableStateOf(true) }
    var recordingActive by remember { mutableStateOf(false) }
    var finalizing by remember { mutableStateOf(false) }
    var elapsedSeconds by remember { mutableIntStateOf(0) }
    var startedAt by remember { mutableLongStateOf(0L) }
    var previewView by remember { mutableStateOf<SurfaceView?>(null) }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        hasPermissions = result[Manifest.permission.CAMERA] == true &&
            result[Manifest.permission.RECORD_AUDIO] == true
        if (!hasPermissions) latestOnError.value("Для видеосообщений нужны разрешения камеры и микрофона.")
    }

    val shouldSend = remember { AtomicBoolean(false) }
    val disposed = remember { AtomicBoolean(false) }
    val recordingFile = remember { mutableStateOf<File?>(null) }
    val cameraSource = remember(context) { Camera2Source(context).also { it.switchCamera() } }
    val stream = remember(context) {
        val checker = object : ConnectChecker {
            override fun onConnectionStarted(url: String) {}
            override fun onConnectionSuccess() {}
            override fun onConnectionFailed(reason: String) {}
            override fun onDisconnect() {}
            override fun onAuthError() {}
            override fun onAuthSuccess() {}
        }
        GenericStream(context.applicationContext, checker, cameraSource, MicrophoneSource())
    }

    fun stopRecording(send: Boolean) {
        if (!stream.isRecording) return
        shouldSend.set(send)
        finalizing = true
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
            RoundVideoDiagnostics.record(context, "RootEncoder prepare; Camera2Source front camera; 640x480; rotation=90")
            val videoPrepared = stream.prepareVideo(640, 480, 700_000, fps = 24, rotation = 90)
            val audioPrepared = stream.prepareAudio(32_000, true, 96_000)
            if (!videoPrepared || !audioPrepared) throw IllegalStateException("RootEncoder не смог подготовить видео- или аудиокодек.")
            stream.startPreview(view, true)
            cameraReady = true
            RoundVideoDiagnostics.record(context, "RootEncoder preview started")
        } catch (error: Exception) {
            RoundVideoDiagnostics.record(context, "RootEncoder initialization failed", error)
            cameraReady = false
            latestOnError.value(error.message ?: "Не удалось запустить камеру через RootEncoder.")
        }
    }

    fun startRecording(): Boolean {
        if (!cameraReady || stream.isRecording || finalizing || disposed.get()) return false
        val file = File(context.cacheDir, "round_root_${UUID.randomUUID()}.mp4")
        recordingFile.value = file
        shouldSend.set(false)
        return try {
            RoundVideoDiagnostics.record(context, "RootEncoder startRecord; cache MP4")
            stream.startRecord(file.absolutePath) { status ->
                RoundVideoDiagnostics.record(context, "RootEncoder record status=$status; bytes=${file.length()}")
                Handler(Looper.getMainLooper()).post {
                when (status) {
                    RecordController.Status.RECORDING -> {
                        startedAt = System.currentTimeMillis()
                        elapsedSeconds = 0
                        recordingActive = true
                    }
                    RecordController.Status.STOPPED -> {
                        recordingActive = false
                        startedAt = 0L
                        elapsedSeconds = 0
                        finalizing = false
                        recordingFile.value = null
                        when {
                            shouldSend.get() && !disposed.get() && file.isFile && file.length() > 1500L -> {
                                if (file.length() > 18L * 1024L * 1024L) {
                                    file.delete()
                                    latestOnError.value("Видео превышает временный лимит 18 МБ.")
                                } else latestOnRecorded.value(file)
                            }
                            shouldSend.get() && !disposed.get() -> {
                                file.delete()
                                latestOnError.value("RootEncoder завершил запись без видеоданных. Попробуй ещё раз.")
                            }
                            else -> file.delete()
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
            latestOnError.value(error.message ?: "Не удалось начать видеозапись.")
            false
        }
    }

    LaunchedEffect(recordingActive, startedAt) {
        while (recordingActive && startedAt > 0L) {
            elapsedSeconds = ((System.currentTimeMillis() - startedAt) / 1000L).toInt()
            if (elapsedSeconds >= 60) {
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
            shouldSend.set(false)
            runCatching {
                if (stream.isRecording) stream.stopRecord()
                if (stream.isOnPreview) stream.stopPreview(true)
                stream.release()
            }.onFailure { RoundVideoDiagnostics.record(context, "RootEncoder release failed", it) }
            recordingFile.value?.delete()
            recordingFile.value = null
            RoundVideoDiagnostics.record(context, "RootEncoder recorder disposed")
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
                Text("Видеосообщение", color = Color.White, fontSize = 17.sp)
                TextButton(enabled = cameraReady && !recordingActive && !finalizing, onClick = {
                    try { cameraSource.switchCamera(); frontCamera = !frontCamera }
                    catch (error: Exception) { RoundVideoDiagnostics.record(context, "RootEncoder camera switch failed", error); latestOnError.value(error.message ?: "Не удалось переключить камеру.") }
                }) { Text("↻", color = Color.White, fontSize = 22.sp) }
            }
            Spacer(Modifier.height(24.dp))
            Box(Modifier.size(280.dp).clip(CircleShape).background(Color.Black), contentAlignment = Alignment.Center) {
                AndroidView(factory = { SurfaceView(it).also { view -> previewView = view } }, modifier = Modifier.fillMaxSize())
                if (!cameraReady) CircularProgressIndicator(color = Color.White)
            }
            Spacer(Modifier.height(28.dp))
            Text(
                when {
                    finalizing -> "Сохраняем видео…"
                    recordingActive -> "● Запись 0:${String.format("%02d", elapsedSeconds)} — отпусти для отправки"
                    else -> "Удерживай кнопку · свайп влево отменяет"
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
                    .pointerInput(cameraReady, finalizing, recordingActive) {
                        awaitEachGesture {
                            if (!cameraReady || finalizing || recordingActive) return@awaitEachGesture
                            val down = awaitFirstDown(requireUnconsumed = false)
                            var cancel = false
                            val heldLongEnough = withTimeoutOrNull(350L) {
                                while (true) {
                                    val event = awaitPointerEvent()
                                    val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                    if (!change.pressed) break
                                    if (change.position.x < down.position.x - 70.dp.toPx()) { cancel = true; break }
                                }
                                false
                            } ?: true
                            if (!heldLongEnough || cancel || !startRecording()) return@awaitEachGesture
                            while (true) {
                                val event = awaitPointerEvent()
                                val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                if (change.position.x < down.position.x - 70.dp.toPx()) cancel = true
                                if (!change.pressed) break
                            }
                            stopRecording(send = !cancel)
                        }
                    },
                contentAlignment = Alignment.Center
            ) { Text(if (recordingActive) "■" else "●", color = Color.White, fontSize = 30.sp) }
        }
    }
}
