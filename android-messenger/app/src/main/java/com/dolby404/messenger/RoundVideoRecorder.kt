package com.dolby404.messenger

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.camera.view.PreviewView
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
import kotlinx.coroutines.delay
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import java.io.File
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import kotlin.coroutines.resume

/**
 * Hold-to-record CameraX video message.
 *
 * CameraX writes directly to a cache file. The Finalize event is the only place
 * that hands a completed file to the sender; cancellation and lifecycle teardown
 * never expose a partially-written file.
 */
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
            context.checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
                context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        )
    }
    var frontCamera by remember { mutableStateOf(true) }
    var previewView by remember { mutableStateOf<PreviewView?>(null) }
    var videoCapture by remember { mutableStateOf<VideoCapture<Recorder>?>(null) }
    var cameraReady by remember { mutableStateOf(false) }
    var recordingActive by remember { mutableStateOf(false) }
    var finalizing by remember { mutableStateOf(false) }
    var startedAt by remember { mutableLongStateOf(0L) }
    var elapsedSeconds by remember { mutableIntStateOf(0) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        hasPermissions = result[Manifest.permission.CAMERA] == true &&
            result[Manifest.permission.RECORD_AUDIO] == true
        if (!hasPermissions) latestOnError.value("Для видеосообщений нужны разрешения камеры и микрофона.")
    }

    val recordingRef = remember { AtomicReference<Recording?>(null) }
    val providerRef = remember { AtomicReference<ProcessCameraProvider?>(null) }
    val shouldSend = remember { AtomicBoolean(false) }
    val stopIssued = remember { AtomicBoolean(false) }
    val disposed = remember { AtomicBoolean(false) }

    fun stopRecording(send: Boolean) {
        val active = recordingRef.get() ?: return
        RoundVideoDiagnostics.record(context, "stop requested; send=$send")
        if (!stopIssued.compareAndSet(false, true)) return
        shouldSend.set(send)
        finalizing = true
        try {
            active.stop()
        } catch (error: Exception) {
            recordingRef.compareAndSet(active, null)
            recordingActive = false
            startedAt = 0L
            finalizing = false
            shouldSend.set(false)
            latestOnError.value(error.message ?: "Не удалось завершить видеозапись.")
        }
    }

    LaunchedEffect(hasPermissions) {
        if (!hasPermissions) {
            permissionLauncher.launch(
                arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
            )
        }
    }

    LaunchedEffect(hasPermissions, frontCamera, previewView) {
        val view = previewView ?: return@LaunchedEffect
        if (!hasPermissions) return@LaunchedEffect

        cameraReady = false
        videoCapture = null
        try {
            RoundVideoDiagnostics.record(context, "camera bind requested; frontCamera=$frontCamera")
            val future = ProcessCameraProvider.getInstance(context)
            val provider = suspendCancellableCoroutine<ProcessCameraProvider> { continuation ->
                future.addListener(
                    {
                        try {
                            continuation.resume(future.get())
                        } catch (error: Exception) {
                            continuation.resumeWith(Result.failure(error))
                        }
                    },
                    ContextCompat.getMainExecutor(context)
                )
            }
            providerRef.set(provider)

            val preview = Preview.Builder().build().also {
                it.surfaceProvider = view.surfaceProvider
            }
            val recorder = Recorder.Builder()
                .setQualitySelector(QualitySelector.from(Quality.SD))
                .setTargetVideoEncodingBitRate(600_000)
                .build()
            val capture = VideoCapture.withOutput(recorder)
            val selector = if (frontCamera) {
                CameraSelector.DEFAULT_FRONT_CAMERA
            } else {
                CameraSelector.DEFAULT_BACK_CAMERA
            }

            provider.unbindAll()
            provider.bindToLifecycle(lifecycleOwner, selector, preview, capture)
            RoundVideoDiagnostics.record(context, "camera bound successfully; quality=SD; frontCamera=$frontCamera; previewMode=COMPATIBLE; audio permission granted")
            videoCapture = capture
            cameraReady = true
        } catch (error: Exception) {
            RoundVideoDiagnostics.record(context, "camera initialization failed", error)
            cameraReady = false
            videoCapture = null
            latestOnError.value(
                error.message?.takeIf { it.isNotBlank() }
                    ?: "Не удалось открыть камеру. Проверь разрешения и попробуй ещё раз."
            )
        }
    }

    fun startRecording(): Boolean {
        val capture = videoCapture ?: return false
        if (!cameraReady || recordingRef.get() != null || finalizing || disposed.get()) return false

        val file = File(context.cacheDir, "round_${UUID.randomUUID()}.mp4")
        RoundVideoDiagnostics.record(context, "recording start requested; output=cache mp4")
        shouldSend.set(false)
        stopIssued.set(false)

        return try {
            val active = capture.output
                .prepareRecording(context, FileOutputOptions.Builder(file).build())
                .withAudioEnabled()
                .start(ContextCompat.getMainExecutor(context)) { event ->
                    when (event) {
                        is VideoRecordEvent.Start -> {
                            RoundVideoDiagnostics.record(context, "CameraX Start event")
                            startedAt = System.currentTimeMillis()
                            elapsedSeconds = 0
                            recordingActive = true
                        }

                        is VideoRecordEvent.Finalize -> {
                            RoundVideoDiagnostics.record(
                                context,
                                "CameraX Finalize; error=${event.error}; errorName=${if (event.error == 8) "ERROR_NO_VALID_DATA" else "OTHER"}; cause=${event.cause?.javaClass?.name}:${event.cause?.message}; fileExists=${file.exists()}; bytes=${file.length()}; shouldSend=${shouldSend.get()}; disposed=${disposed.get()}",
                                event.cause
                            )
                            recordingRef.set(null)
                            recordingActive = false
                            startedAt = 0L
                            elapsedSeconds = 0
                            finalizing = false

                            // Do not tear down the camera while CameraX is still finalizing
                            // the output file. If the dialog was disposed, release it now.
                            if (disposed.get()) {
                                providerRef.getAndSet(null)?.unbindAll()
                            }

                            when {
                                event.hasError() -> {
                                    file.delete()
                                    if (shouldSend.get() && !disposed.get()) {
                                        latestOnError.value(
                                            if (event.error == 8) {
                                                "Камера не получила видеоданные (ERROR_NO_VALID_DATA). Подержи кнопку чуть дольше и попробуй ещё раз."
                                            } else {
                                                "Камера не смогла завершить видеозапись (код ${event.error}). Попробуй ещё раз."
                                            }
                                        )
                                    }
                                }

                                shouldSend.get() && !disposed.get() && file.isFile && file.length() > 1500L -> {
                                    if (file.length() > 18L * 1024L * 1024L) {
                                        file.delete()
                                        latestOnError.value("Видео превышает временный лимит 18 МБ.")
                                    } else {
                                        latestOnRecorded.value(file)
                                    }
                                }

                                else -> file.delete()
                            }
                        }
                    }
                }

            recordingRef.set(active)
            RoundVideoDiagnostics.record(context, "CameraX recording object created")
            true
        } catch (error: Exception) {
            RoundVideoDiagnostics.record(context, "recording start failed", error)
            file.delete()
            shouldSend.set(false)
            latestOnError.value(
                error.message?.takeIf { it.isNotBlank() } ?: "Не удалось начать видеозапись."
            )
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

    DisposableEffect(lifecycleOwner) {
        // Stop safely if Android backgrounds the Activity during a recording.
        val lifecycleObserver = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_PAUSE) {
                RoundVideoDiagnostics.record(context, "Activity ON_PAUSE; requesting safe recording stop")
                stopRecording(send = false)
            }
        }
        lifecycleOwner.lifecycle.addObserver(lifecycleObserver)

        onDispose {
            lifecycleOwner.lifecycle.removeObserver(lifecycleObserver)
            disposed.set(true)
            shouldSend.set(false)

            // stop() is asynchronous. Use the same atomic guard as the normal stop path
            // so ON_PAUSE, Cancel and disposal cannot stop the same Recording twice.
            val active = recordingRef.get()
            if (active != null) {
                if (stopIssued.compareAndSet(false, true)) {
                    try {
                        active.stop()
                        // Finalize performs unbindAll after the MP4 is closed.
                    } catch (error: Exception) {
                        RoundVideoDiagnostics.record(context, "stop during disposal failed", error)
                        recordingRef.compareAndSet(active, null)
                        providerRef.getAndSet(null)?.unbindAll()
                    }
                }
            } else {
                providerRef.getAndSet(null)?.unbindAll()
            }
        }
    }

    Dialog(
        onDismissRequest = {
            stopRecording(send = false)
            onDismiss()
        },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Column(
            Modifier.fillMaxSize().background(Color(0xFF080D1B)).padding(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = {
                    stopRecording(send = false)
                    onDismiss()
                }) {
                    Text("Отмена", color = Color.White)
                }
                Text("Видеосообщение", color = Color.White, fontSize = 17.sp)
                TextButton(
                    enabled = !recordingActive && !finalizing,
                    onClick = { frontCamera = !frontCamera }
                ) {
                    Text("↻", color = Color.White, fontSize = 22.sp)
                }
            }

            Spacer(Modifier.height(24.dp))
            Box(
                Modifier.size(280.dp).clip(CircleShape).background(Color.Black),
                contentAlignment = Alignment.Center
            ) {
                AndroidView(
                    factory = { viewContext ->
                        PreviewView(viewContext).also {
                            it.implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                            it.scaleType = PreviewView.ScaleType.FILL_CENTER
                            previewView = it
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
                if (!cameraReady) CircularProgressIndicator(color = Color.White)
            }

            Spacer(Modifier.height(28.dp))
            Text(
                when {
                    finalizing -> "Сохраняем видео…"
                    recordingActive -> "● Запись 0:${String.format("%02d", elapsedSeconds)} — отпусти для отправки"
                    else -> "Удерживай кнопку · свайп влево отменяет"
                },
                color = Color(0xFFB7C4DA),
                fontSize = 12.sp
            )
            Spacer(Modifier.height(8.dp))
            TextButton(onClick = {
                val log = RoundVideoDiagnostics.read(context)
                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                clipboard.setPrimaryClip(ClipData.newPlainText("FLOUSTREAM diagnostics", log))
                Toast.makeText(context, "Диагностика скопирована. Вставь её сюда.", Toast.LENGTH_LONG).show()
            }) {
                Text("Скопировать диагностику", color = Color(0xFF9FCBFF), fontSize = 12.sp)
            }
            Spacer(Modifier.height(8.dp))

            Box(
                Modifier.size(78.dp)
                    .clip(CircleShape)
                    .background(if (recordingActive) Color(0xFF9A65FF) else Color(0xFF548BFF))
                    .pointerInput(cameraReady, finalizing) {
                        awaitEachGesture {
                            if (!cameraReady || finalizing || recordingActive) {
                                return@awaitEachGesture
                            }

                            val down = awaitFirstDown(requireUnconsumed = false)
                            var cancel = false
                            val heldLongEnough = withTimeoutOrNull(350L) {
                                while (true) {
                                    val event = awaitPointerEvent()
                                    val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                    if (!change.pressed) break
                                    if (change.position.x < down.position.x - 70.dp.toPx()) {
                                        cancel = true
                                        break
                                    }
                                }
                                false
                            } ?: true

                            if (!heldLongEnough || cancel || !startRecording()) {
                                return@awaitEachGesture
                            }

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
            ) {
                Text(
                    if (recordingActive) "■" else "●",
                    color = Color.White,
                    fontSize = 30.sp
                )
            }
        }
    }
}
