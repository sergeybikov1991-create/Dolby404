package com.dolby404.messenger

import android.Manifest
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
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
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
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.withTimeoutOrNull
import java.io.File
import kotlin.coroutines.resume

@Composable
internal fun RoundVideoRecorder(
    onDismiss: () -> Unit,
    onRecorded: (File) -> Unit,
    onError: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var hasPermissions by remember {
        mutableStateOf(
            context.checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
                context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        )
    }
    var permissionRequested by remember { mutableStateOf(false) }
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        hasPermissions = result[Manifest.permission.CAMERA] == true && result[Manifest.permission.RECORD_AUDIO] == true
        if (!hasPermissions) onError("Для видеосообщений нужны разрешения камеры и микрофона.")
    }
    var frontCamera by remember { mutableStateOf(true) }
    var previewView by remember { mutableStateOf<PreviewView?>(null) }
    var videoCapture by remember { mutableStateOf<VideoCapture<Recorder>?>(null) }
    var recording by remember { mutableStateOf<androidx.camera.video.Recording?>(null) }
    var recordingActive by remember { mutableStateOf(false) }
    var shouldSend by remember { mutableStateOf(false) }
    var finalizing by remember { mutableStateOf(false) }
    var cameraReady by remember { mutableStateOf(false) }
    var cameraProvider by remember { mutableStateOf<ProcessCameraProvider?>(null) }
    var outputFile by remember { mutableStateOf<File?>(null) }

    LaunchedEffect(Unit) {
        if (!hasPermissions && !permissionRequested) {
            permissionRequested = true
            permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO))
        }
    }
    DisposableEffect(Unit) {
        onDispose {
            shouldSend = false
            try { recording?.stop() } catch (_: Exception) { }
            recording = null
            cameraProvider?.unbindAll()
            outputFile?.delete()
        }
    }
    LaunchedEffect(hasPermissions, frontCamera, previewView) {
        val view = previewView
        if (!hasPermissions || view == null) return@LaunchedEffect
        cameraReady = false
        try {
            val future = ProcessCameraProvider.getInstance(context)
            val provider = kotlinx.coroutines.suspendCancellableCoroutine<ProcessCameraProvider> { cont ->
                future.addListener({
                    try { cont.resume(future.get()) }
                    catch (e: Exception) { cont.resumeWith(Result.failure(e)) }
                }, ContextCompat.getMainExecutor(context))
            }
            cameraProvider = provider
            val preview = Preview.Builder().build().also { it.surfaceProvider = view.surfaceProvider }
            val recorder = Recorder.Builder().setQualitySelector(QualitySelector.from(Quality.SD)).build()
            val capture = VideoCapture.withOutput(recorder)
            val selector = if (frontCamera) CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA
            provider.unbindAll()
            provider.bindToLifecycle(lifecycleOwner, selector, preview, capture)
            videoCapture = capture
            cameraReady = true
        } catch (_: Exception) {
            cameraReady = false
            onError("Не удалось открыть камеру. Проверь разрешения и попробуй ещё раз.")
        }
    }

    fun startRecording() {
        val capture = videoCapture ?: return
        if (!cameraReady || recordingActive || finalizing) return
        val file = File(context.cacheDir, "round_" + System.currentTimeMillis() + ".mp4")
        outputFile = file
        shouldSend = false
        finalizing = false
        try {
            recording = capture.output.prepareRecording(context, FileOutputOptions.Builder(file).build())
                .withAudioEnabled()
                .start(ContextCompat.getMainExecutor(context)) { event ->
                    when (event) {
                        is VideoRecordEvent.Start -> recordingActive = true
                        is VideoRecordEvent.Finalize -> {
                            recordingActive = false
                            recording = null
                            finalizing = false
                            val completed = outputFile
                            outputFile = null
                            if (event.hasError()) {
                                completed?.delete()
                                onError("Не удалось завершить видеозапись. Попробуй ещё раз.")
                            } else if (shouldSend && completed != null && completed.exists() && completed.length() > 1500L) {
                                onRecorded(completed)
                            } else completed?.delete()
                        }
                    }
                }
        } catch (_: Exception) {
            recordingActive = false
            outputFile?.delete()
            outputFile = null
            onError("Не удалось начать видеозапись.")
        }
    }
    fun stopRecording(send: Boolean) {
        if (recording == null) return
        shouldSend = send
        finalizing = true
        try { recording?.stop() } catch (_: Exception) {
            outputFile?.delete()
            outputFile = null
            recording = null
            recordingActive = false
            finalizing = false
            onError("Не удалось сохранить видеозапись.")
        }
    }

    Dialog(onDismissRequest = { stopRecording(false); onDismiss() }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Column(
            Modifier.fillMaxSize().background(Color(0xFF080D1B)).padding(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                TextButton(onClick = { stopRecording(false); onDismiss() }) { Text("Отмена", color = Color.White) }
                Text("Видеосообщение", color = Color.White, fontSize = 17.sp)
                TextButton(onClick = { if (!recordingActive) frontCamera = !frontCamera }) { Text("↻", color = Color.White, fontSize = 22.sp) }
            }
            Spacer(Modifier.height(24.dp))
            Box(Modifier.size(280.dp).clip(CircleShape).background(Color.Black), contentAlignment = Alignment.Center) {
                AndroidView(factory = { ctx ->
                    PreviewView(ctx).also { it.scaleType = PreviewView.ScaleType.FILL_CENTER; previewView = it }
                }, modifier = Modifier.fillMaxSize())
                if (!cameraReady) CircularProgressIndicator(color = Color.White)
            }
            Spacer(Modifier.height(28.dp))
            Text(
                when {
                    finalizing -> "Сохраняем видео…"
                    recordingActive -> "● Идёт запись — отпусти для отправки"
                    else -> "Удерживай кнопку · свайп влево отменяет"
                }, color = Color(0xFFB7C4DA), fontSize = 12.sp
            )
            Spacer(Modifier.height(16.dp))
            Box(
                Modifier.size(78.dp).clip(CircleShape)
                    .background(if (recordingActive) Color(0xFF9A65FF) else Color(0xFF548BFF))
                    .pointerInput(cameraReady, recordingActive, finalizing) {
                        awaitEachGesture {
                            val down = awaitFirstDown(requireUnconsumed = false)
                            var cancel = false
                            val held = withTimeoutOrNull(350L) {
                                while (true) {
                                    val event = awaitPointerEvent()
                                    val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                    if (!change.pressed) break
                                    if (change.position.x < down.position.x - 70.dp.toPx()) { cancel = true; break }
                                }
                                false
                            } ?: true
                            if (held && !cancel && cameraReady) {
                                startRecording()
                                while (true) {
                                    val event = awaitPointerEvent()
                                    val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                    if (change.position.x < down.position.x - 70.dp.toPx()) cancel = true
                                    if (!change.pressed) break
                                }
                                stopRecording(!cancel)
                            }
                        }
                    }, contentAlignment = Alignment.Center
            ) { Text(if (recordingActive) "■" else "●", color = Color.White, fontSize = 30.sp) }
        }
    }
}
