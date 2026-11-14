package com.dolby404.messenger

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

private data class AvailableUpdate(val versionName: String, val apkUrl: String, val notes: String)

private fun isNewerVersion(remote: String, current: String): Boolean {
    val a = remote.removePrefix("v").split(".").map { it.toIntOrNull() ?: 0 }
    val b = current.removePrefix("v").split(".").map { it.toIntOrNull() ?: 0 }
    for (i in 0 until maxOf(a.size, b.size)) {
        val left = a.getOrElse(i) { 0 }
        val right = b.getOrElse(i) { 0 }
        if (left != right) return left > right
    }
    return false
}

private suspend fun findAvailableUpdate(): AvailableUpdate? = withContext(Dispatchers.IO) {
    val connection = URL("https://api.github.com/repos/sergeybikov1991-create/Dolby404/releases/latest")
        .openConnection() as HttpURLConnection
    try {
        connection.connectTimeout = 8000
        connection.readTimeout = 8000
        connection.setRequestProperty("Accept", "application/vnd.github+json")
        connection.setRequestProperty("User-Agent", "Dolby404-Messenger")
        if (connection.responseCode != 200) return@withContext null
        val json = JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
        val tag = json.optString("tag_name").removePrefix("v")
        if (tag.isBlank() || !isNewerVersion(tag, BuildConfig.VERSION_NAME)) return@withContext null
        val assets = json.optJSONArray("assets") ?: return@withContext null
        var apkUrl: String? = null
        for (i in 0 until assets.length()) {
            val asset = assets.getJSONObject(i)
            if (asset.optString("name") == "Dolby404-Messenger.apk") {
                apkUrl = asset.optString("browser_download_url")
                break
            }
        }
        if (apkUrl.isNullOrBlank()) return@withContext null
        val parsedApkUrl = URL(apkUrl)
        if (parsedApkUrl.protocol != "https" ||
            parsedApkUrl.host != "github.com" ||
            !parsedApkUrl.path.startsWith("/sergeybikov1991-create/Dolby404/releases/download/") ||
            !parsedApkUrl.path.endsWith("/Dolby404-Messenger.apk")
        ) return@withContext null
        AvailableUpdate(tag, apkUrl, json.optString("body").take(500))
    } finally {
        connection.disconnect()
    }
}

private suspend fun downloadUpdate(
    contextCache: File,
    url: String,
    onProgress: (Float) -> Unit
): File = withContext(Dispatchers.IO) {
    val connection = URL(url).openConnection() as HttpURLConnection
    try {
        connection.connectTimeout = 15000
        connection.readTimeout = 30000
        connection.setRequestProperty("User-Agent", "Dolby404-Messenger")
        connection.connect()
        if (connection.responseCode !in 200..299) error("Не удалось скачать APK")
        val total = connection.contentLengthLong
        val directory = File(contextCache, "updates").apply { mkdirs() }
        val apk = File(directory, "Dolby404-Messenger.apk")
        connection.inputStream.use { input ->
            FileOutputStream(apk).use { output ->
                val buffer = ByteArray(8192)
                var received = 0L
                while (true) {
                    val count = input.read(buffer)
                    if (count < 0) break
                    output.write(buffer, 0, count)
                    received += count
                    if (total > 0) {
                        val value = (received.toFloat() / total).coerceIn(0f, 1f)
                        withContext(Dispatchers.Main) { onProgress(value) }
                    }
                }
                output.flush()
            }
        }
        apk
    } finally {
        connection.disconnect()
    }
}

@Composable
fun AppUpdatePrompt() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var update by remember { mutableStateOf<AvailableUpdate?>(null) }
    var downloadedApk by remember { mutableStateOf<File?>(null) }
    var downloading by remember { mutableStateOf(false) }
    var progress by remember { mutableFloatStateOf(0f) }
    var error by remember { mutableStateOf<String?>(null) }

    // Check immediately and retry periodically while the app is open.
    // A temporary network failure must not lock users out while offline.
    LaunchedEffect(Unit) {
        while (update == null) {
            try { update = findAvailableUpdate() } catch (_: Exception) { }
            if (update == null) delay(15 * 60 * 1000L)
        }
    }

    val available = update
    if (available != null) {
        AlertDialog(
            onDismissRequest = { /* Mandatory update: cannot be dismissed. */ },
            title = { Text("Доступно обновление Dolby404") },
            text = {
                Column {
                    Text("Новая версия: ${available.versionName}")
                    if (available.notes.isNotBlank()) Text(available.notes)
                    if (downloading) {
                        LinearProgressIndicator(progress = { progress })
                        Text("Загрузка: ${(progress * 100).toInt()}%")
                    }
                    error?.let { Text(it) }
                }
            },
            confirmButton = {
                Button(
                    enabled = !downloading,
                    onClick = {
                        val existing = downloadedApk
                        if (existing != null && existing.exists()) {
                            try {
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                                    !context.packageManager.canRequestPackageInstalls()
                                ) {
                                    val settingsIntent = Intent(
                                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                        Uri.parse("package:${context.packageName}")
                                    )
                                    context.startActivity(settingsIntent)
                                    error = "Разреши установку приложений для Dolby404, вернись сюда и нажми «Обновить» ещё раз."
                                } else {
                                    val uri: Uri = FileProvider.getUriForFile(
                                        context,
                                        "${context.packageName}.fileprovider",
                                        existing
                                    )
                                    val intent = Intent(Intent.ACTION_VIEW).apply {
                                        setDataAndType(uri, "application/vnd.android.package-archive")
                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                    context.startActivity(intent)
                                }
                            } catch (e: Exception) {
                                error = e.message ?: "Не удалось открыть установщик Android."
                            }
                        } else {
                            downloading = true
                            error = null
                            scope.launch {
                                try {
                                    downloadedApk = downloadUpdate(context.cacheDir, available.apkUrl) { progress = it }
                                } catch (e: Exception) {
                                    error = e.message ?: "Ошибка загрузки."
                                } finally {
                                    downloading = false
                                }
                            }
                        }
                    }
                ) { Text(if (downloadedApk != null) "Обновить" else "Скачать обновление") }
            },
        )
    }
}
