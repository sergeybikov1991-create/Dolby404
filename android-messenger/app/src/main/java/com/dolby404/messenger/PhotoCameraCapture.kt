package com.dolby404.messenger

import android.Manifest
import android.content.pm.PackageManager
import android.view.ViewGroup
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import java.io.File
import java.util.concurrent.Executor

@Composable
internal fun PhotoCameraCapture(
    onDismiss: () -> Unit,
    onPhotoCaptured: (File) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val mainExecutor: Executor = remember(context) { ContextCompat.getMainExecutor(context) }
    var hasPermission by remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
    }
    var permissionDenied by remember { mutableStateOf(false) }
    var frontCamera by remember { mutableStateOf(false) }
    var takingPhoto by remember { mutableStateOf(false) }
    var cameraReady by remember { mutableStateOf(false) }
    var previewView by remember { mutableStateOf<PreviewView?>(null) }
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }
    var cameraProvider by remember { mutableStateOf<ProcessCameraProvider?>(null) }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        hasPermission = granted
        permissionDenied = !granted
    }

    LaunchedEffect(Unit) {
        if (!hasPermission) permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    LaunchedEffect(hasPermission, frontCamera, previewView) {
        val view = previewView ?: return@LaunchedEffect
        if (!hasPermission) return@LaunchedEffect
        cameraReady = false
        val providerFuture = ProcessCameraProvider.getInstance(context)
        providerFuture.addListener({
            try {
                val provider = providerFuture.get()
                cameraProvider = provider
                val preview = Preview.Builder().build().also { it.surfaceProvider = view.surfaceProvider }
                val capture = ImageCapture.Builder()
                    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                    .setJpegQuality(94)
                    .build()
                val selector = if (frontCamera) CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA
                provider.unbindAll()
                provider.bindToLifecycle(lifecycleOwner, selector, preview, capture)
                imageCapture = capture
                cameraReady = true
            } catch (_: Exception) {
                cameraReady = false
            }
        }, mainExecutor)
    }

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onDismiss,
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Column(
            Modifier.fillMaxSize().background(Color(0xFF080D1B)).padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onDismiss) { Text("Закрыть", color = Color.White) }
                Text("Фото", color = Color.White, fontSize = 18.sp)
                TextButton(enabled = cameraReady && !takingPhoto, onClick = { frontCamera = !frontCamera }) {
                    Text("↻", color = Color.White, fontSize = 22.sp)
                }
            }
            Spacer(Modifier.height(14.dp))
            Box(
                Modifier.weight(1f).fillMaxWidth().background(Color.Black, androidx.compose.foundation.shape.RoundedCornerShape(22.dp)),
                contentAlignment = Alignment.Center
            ) {
                AndroidView(
                    factory = { ctx ->
                        PreviewView(ctx).also { view ->
                            view.scaleType = PreviewView.ScaleType.FILL_CENTER
                            view.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                            previewView = view
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
                if (!cameraReady && hasPermission && !permissionDenied) CircularProgressIndicator(color = Color.White)
                if (permissionDenied) Text("Разреши доступ к камере в настройках приложения", color = Color.White)
            }
            Spacer(Modifier.height(20.dp))
            Surface(
                onClick = {
                    val capture = imageCapture ?: return@Surface
                    if (takingPhoto || !cameraReady) return@Surface
                    val folder = File(context.filesDir, "photo-drafts")
                    if (!folder.exists()) folder.mkdirs()
                    val output = File(folder, "photo_${System.currentTimeMillis()}.jpg")
                    takingPhoto = true
                    capture.takePicture(
                        ImageCapture.OutputFileOptions.Builder(output).build(),
                        mainExecutor,
                        object : ImageCapture.OnImageSavedCallback {
                            override fun onImageSaved(result: ImageCapture.OutputFileResults) {
                                takingPhoto = false
                                onPhotoCaptured(output)
                            }
                            override fun onError(exception: ImageCaptureException) {
                                takingPhoto = false
                                output.delete()
                            }
                        }
                    )
                },
                enabled = cameraReady && !takingPhoto,
                color = Color(0xFF548BFF),
                shape = CircleShape,
                modifier = Modifier.size(76.dp)
            ) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    if (takingPhoto) CircularProgressIndicator(color = Color.White)
                    else Text("●", color = Color.White, fontSize = 42.sp)
                }
            }
            Spacer(Modifier.height(12.dp))
            Text(if (frontCamera) "Фронтальная камера" else "Основная камера", color = Color(0xFFB7C4DA), fontSize = 12.sp)
        }
    }

    androidx.compose.runtime.DisposableEffect(cameraProvider) {
        onDispose { runCatching { cameraProvider?.unbindAll() } }
    }
}
