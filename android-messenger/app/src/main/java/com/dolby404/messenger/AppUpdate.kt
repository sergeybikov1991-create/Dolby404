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
import androidx.compose.material3.TextButton
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

private data class UpdatePolicy(
    val minimumSupportedVersion: String,
    val type: String,
    val maxPostponements: Int,
    val postponeHours: Int
)

private data class AvailableUpdate(
    val versionName: String,
    val apkUrl: String,
    val notes: String,
    val canPostpone: Boolean,
    val postponeHours: Int
)

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

private suspend fun fetchUpdatePolicy(): UpdatePolicy = withContext(Dispatchers.IO) {
    val connection = URL("https://raw.githubusercontent.com/sergeybikov1991-create/Dolby404/main/android-messenger/update-policy.json")
        .openConnection() as HttpURLConnection
    try {
        connection.connectTimeout = 8000
        connection.readTimeout = 8000
        connection.setRequestProperty("User-Agent", "FLOUSTREAM-Messenger")
        if (connection.responseCode != 200) error("Update policy unavailable")
        val json = JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
        val type = json.optString("update_type", "normal").lowercase()
        val defaultMax = when (type) {
            "critical" -> 0
            "important" -> 1
            else -> 3
        }
        val defaultHours = when (type) {
            "critical" -> 0
            "important" -> 6
            else -> 24
        }
        UpdatePolicy(
            minimumSupportedVersion = json.optString("minimum_supported_version", "0.0.0"),
            type = if (type in setOf("normal", "important", "critical")) type else "normal",
            maxPostponements = when (type) {
                "critical" -> 0
                "important" -> 1
                else -> json.optInt("max_postponements", defaultMax).coerceIn(0, 3)
            },
            postponeHours = when (type) {
                "critical" -> 0
                "important" -> 6
                else -> json.optInt("postpone_hours", defaultHours).coerceIn(1, 72)
            }
        )
    } finally {
        connection.disconnect()
    }
}

private suspend fun findAvailableUpdate(context: android.content.Context): AvailableUpdate? = withContext(Dispatchers.IO) {
    val connection = URL("https://api.github.com/repos/sergeybikov1991-create/Dolby404/releases/latest")
        .openConnection() as HttpURLConnection
    try {
        connection.connectTimeout = 8000
        connection.readTimeout = 8000
        connection.setRequestProperty("Accept", "application/vnd.github+json")
        connection.setRequestProperty("User-Agent", "FLOUSTREAM-Messenger")
        if (connection.responseCode != 200) return@withContext null
        val json = JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
        val tag = json.optString("tag_name").removePrefix("v")
        if (tag.isBlank() || !isNewerVersion(tag, BuildConfig.VERSION_NAME)) return@withContext null
        val assets = json.optJSONArray("assets") ?: return@withContext null
        var apkUrl: String? = null
        for (i in 0 until assets.length()) {
            val asset = assets.getJSONObject(i)
            if (asset.optString("name") == "FLOUSTREAM-Messenger.apk") {
                apkUrl = asset.optString("browser_download_url")
                break
            }
        }
        if (apkUrl.isNullOrBlank()) return@withContext null
        val parsedApkUrl = URL(apkUrl)
        if (parsedApkUrl.protocol != "https" ||
            parsedApkUrl.host != "github.com" ||
            !parsedApkUrl.path.startsWith("/sergeybikov1991-create/Dolby404/releases/download/") ||
            !parsedApkUrl.path.endsWith("/FLOUSTREAM-Messenger.apk")
        ) return@withContext null

        // If the policy cannot be reached, fail open: never lock a user out offline.
        val policy = try { fetchUpdatePolicy() } catch (_: Exception) {
            UpdatePolicy("0.0.0", "normal", 3, 24)
        }
        val belowMinimum = isNewerVersion(policy.minimumSupportedVersion, BuildConfig.VERSION_NAME)
        val preferences = context.getSharedPreferences("dolby404_update_policy", android.content.Context.MODE_PRIVATE)
        val countKey = "postponements_$tag"
        val untilKey = "postpone_until_$tag"
        val used = preferences.getInt(countKey, 0)
        val postponeUntil = preferences.getLong(untilKey, 0L)
        val now = System.currentTimeMillis()

        if (!belowMinimum && policy.type != "critical" && now < postponeUntil) return@withContext null
        val canPostpone = !belowMinimum && policy.type != "critical" && used < policy.maxPostponements
        AvailableUpdate(tag, apkUrl, json.optString("body").take(500), canPostpone, policy.postponeHours)
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
        connection.setRequestProperty("User-Agent", "FLOUSTREAM-Messenger")
        connection.connect()
        if (connection.responseCode !in 200..299) error("Не удалось скачать APK")
        val total = connection.contentLengthLong
        val directory = File(contextCache, "updates").apply { mkdirs() }
        val apk = File(directory, "FLOUSTREAM-Messenger.apk")
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

    // Check on launch and retry every 15 minutes. Offline failures never block app use.
    LaunchedEffect(update == null) {
        if (update == null) {
            while (update == null) {
                try { update = findAvailableUpdate(context) } catch (_: Exception) { }
                if (update == null) delay(15 * 60 * 1000L)
            }
        }
    }

    val available = update
    if (available != null) {
        AlertDialog(
            onDismissRequest = { /* The postpone button is the only permitted deferral. */ },
            title = { Text("Доступно обновление FLOUSTREAM") },
            text = {
                Column {
                    Text("Новая версия: ${available.versionName}")
                    if (available.notes.isNotBlank()) Text(available.notes)
                    if (available.canPostpone) {
                        Text("Можно отложить ещё ограниченное число раз. После этого обновление станет обязательным.")
                    } else {
                        Text("Это обновление необходимо установить, чтобы продолжить пользоваться приложением.")
                    }
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
                                    error = "Разреши установку приложений для FLOUSTREAM, вернись сюда и нажми «Обновить» ещё раз."
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
            dismissButton = {
                if (available.canPostpone && !downloading) {
                    TextButton(onClick = {
                        val preferences = context.getSharedPreferences("dolby404_update_policy", android.content.Context.MODE_PRIVATE)
                        val countKey = "postponements_${available.versionName}"
                        val untilKey = "postpone_until_${available.versionName}"
                        val nextCount = preferences.getInt(countKey, 0) + 1
                        preferences.edit()
                            .putInt(countKey, nextCount)
                            .putLong(untilKey, System.currentTimeMillis() + available.postponeHours * 60L * 60L * 1000L)
                            .apply()
                        downloadedApk = null
                        error = null
                        update = null
                    }) { Text("Позже") }
                }
            }
        )
    }
}
