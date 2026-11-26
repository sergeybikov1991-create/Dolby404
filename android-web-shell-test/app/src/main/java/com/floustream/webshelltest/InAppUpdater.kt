package com.floustream.webshelltest

import android.app.Activity
import android.app.AlertDialog
import android.app.ProgressDialog
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.provider.Settings
import android.util.Log
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors

/** Checks GitHub Releases with a pinned-manifest fallback and verifies APK SHA-256 before install. */
class InAppUpdater(private val activity: Activity) {
    private val executor = Executors.newSingleThreadExecutor()
    private var downloadedApk: File? = null
    private var waitingForInstallPermission = false

    fun close() {
        executor.shutdownNow()
    }

    fun checkForUpdate() {
        executor.execute {
            try {
                val data = loadLatestManifest()
                val latestCode = data.optInt("versionCode", 0)
                val latestName = data.optString("versionName", "")
                val apkUrl = data.optString("apkUrl")
                val checksum = data.optString("sha256").lowercase()

                if (latestCode <= 0 || latestName.isBlank()) {
                    throw IOException("GitHub вернул неполные сведения о версии.")
                }
                if (!apkUrl.startsWith("https://") ||
                    !checksum.matches(Regex("[a-f0-9]{64}"))) {
                    throw IOException("Манифест обновления не прошёл проверку.")
                }
                if (latestCode <= BuildConfig.VERSION_CODE) return@execute

                activity.runOnUiThread {
                    if (!activity.isFinishing && !activity.isDestroyed) {
                        AlertDialog.Builder(activity)
                            .setTitle("Доступно обновление FLOUSTREAM")
                            .setMessage("Версия $latestName доступна. Скачать и установить обновление?")
                            .setNegativeButton("Позже", null)
                            .setPositiveButton("Обновить") { _, _ -> download(apkUrl, checksum) }
                            .show()
                    }
                }
            } catch (error: Exception) {
                Log.w("FLOUSTREAM-Updater", "Update check failed", error)
                showCheckError(error)
            }
        }
    }

    /**
     * First use the current public release API. If the API endpoint is unavailable,
     * read the known-good public 1.5.0 manifest directly. This fallback is a bridge
     * for installs whose network cannot reach the GitHub API host.
     */
    private fun loadLatestManifest(): JSONObject {
        var apiError: Exception? = null
        try {
            val releaseUrl = URL(
                "https://api.github.com/repos/${BuildConfig.UPDATE_REPOSITORY}/releases/latest"
            )
            val release = JSONObject(readText(releaseUrl))
            val assets = release.optJSONArray("assets")
                ?: throw IOException("В ответе GitHub отсутствует список файлов релиза.")
            var manifestUrl: String? = null
            for (i in 0 until assets.length()) {
                val asset = assets.getJSONObject(i)
                if (asset.optString("name") == "update.json") {
                    manifestUrl = asset.optString("browser_download_url")
                    break
                }
            }
            val link = manifestUrl?.takeIf { it.startsWith("https://") }
                ?: throw IOException("В последнем релизе не найден update.json.")
            return JSONObject(readText(URL(link)))
        } catch (error: Exception) {
            apiError = error
            Log.w("FLOUSTREAM-Updater", "GitHub API unavailable; trying pinned manifest", error)
        }

        try {
            return JSONObject(
                readText(
                    URL("https://github.com/sergeybikov1991-create/Dolby404/releases/download/v2.5.0/update.json")
                )
            )
        } catch (fallbackError: Exception) {
            throw IOException(
                "Не удалось получить обновление через GitHub API или резервный адрес. " +
                    "API: ${apiError?.message ?: "ошибка сети"}; резервный адрес: ${fallbackError.message ?: "ошибка сети"}",
                fallbackError
            )
        }
    }

    private fun showCheckError(error: Exception) {
        val details = error.message?.takeIf { it.isNotBlank() }
            ?: "Проверь подключение к интернету и повтори попытку."
        activity.runOnUiThread {
            if (!activity.isFinishing && !activity.isDestroyed) {
                AlertDialog.Builder(activity)
                    .setTitle("Не удалось проверить обновление")
                    .setMessage(details)
                    .setPositiveButton("Понятно", null)
                    .show()
            }
        }
    }

    private fun download(apkUrl: String, expectedSha: String) {
        val dialog = ProgressDialog(activity).apply {
            setTitle("FLOUSTREAM")
            setMessage("Загрузка обновления…")
            setProgressStyle(ProgressDialog.STYLE_SPINNER)
            setCancelable(false)
            show()
        }
        executor.execute {
            var target: File? = null
            try {
                val connection = (URL(apkUrl).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 20000
                    readTimeout = 90000
                    instanceFollowRedirects = true
                    setRequestProperty("User-Agent", "FLOUSTREAM-Android-Updater")
                }
                connection.connect()
                if (connection.responseCode !in 200..299) {
                    throw IOException("Сервер загрузки ответил HTTP ${connection.responseCode}.")
                }
                val directory = activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                    ?: throw IOException("Android не предоставил папку для загрузки.")
                target = File(directory, "floustream-update.apk")
                val partial = File(directory, "floustream-update.apk.part")
                connection.inputStream.use { input ->
                    FileOutputStream(partial).use { output -> input.copyTo(output) }
                }
                connection.disconnect()

                val actual = MessageDigest.getInstance("SHA-256").digest(partial.readBytes())
                    .joinToString("") { "%02x".format(it) }
                if (actual != expectedSha) {
                    partial.delete()
                    throw SecurityException("Контрольная сумма APK не совпала. Установка отменена.")
                }
                if (target.exists() && !target.delete()) {
                    partial.delete()
                    throw IOException("Не удалось заменить временный файл обновления.")
                }
                if (!partial.renameTo(target)) {
                    partial.delete()
                    throw IOException("Не удалось подготовить APK для установки.")
                }
                downloadedApk = target
                activity.runOnUiThread {
                    dialog.dismiss()
                    requestPermissionOrInstall()
                }
            } catch (error: Exception) {
                target?.let { if (it.exists()) it.delete() }
                Log.e("FLOUSTREAM-Updater", "Update download failed", error)
                activity.runOnUiThread {
                    dialog.dismiss()
                    if (!activity.isFinishing && !activity.isDestroyed) {
                        AlertDialog.Builder(activity)
                            .setTitle("Обновление не установлено")
                            .setMessage(
                                error.message?.takeIf { it.isNotBlank() }
                                    ?: "Не удалось скачать или проверить APK. Текущая версия приложения сохранена."
                            )
                            .setPositiveButton("ОК", null)
                            .show()
                    }
                }
            }
        }
    }

    private fun requestPermissionOrInstall() {
        if (activity.isFinishing || activity.isDestroyed) return
        if (android.os.Build.VERSION.SDK_INT >= 26 &&
            !activity.packageManager.canRequestPackageInstalls()) {
            waitingForInstallPermission = true
            AlertDialog.Builder(activity)
                .setTitle("Разрешение Android")
                .setMessage("Разреши FLOUSTREAM устанавливать обновления. Откроются системные настройки.")
                .setNegativeButton("Позже") { _, _ -> waitingForInstallPermission = false }
                .setPositiveButton("Открыть настройки") { _, _ ->
                    activity.startActivity(
                        Intent(
                            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:${activity.packageName}")
                        )
                    )
                }
                .show()
        } else {
            launchInstaller()
        }
    }

    fun onResume() {
        if (waitingForInstallPermission && android.os.Build.VERSION.SDK_INT >= 26 &&
            activity.packageManager.canRequestPackageInstalls()) {
            waitingForInstallPermission = false
            launchInstaller()
        }
    }

    private fun launchInstaller() {
        val file = downloadedApk ?: return
        val uri = FileProvider.getUriForFile(
            activity,
            "${activity.packageName}.fileprovider",
            file
        )
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        activity.startActivity(intent)
    }

    private fun readText(url: URL): String {
        val connection = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = 12000
            readTimeout = 18000
            instanceFollowRedirects = true
            setRequestProperty("Accept", "application/vnd.github+json")
            setRequestProperty("X-GitHub-Api-Version", "2022-11-28")
            setRequestProperty("User-Agent", "FLOUSTREAM-Android-Updater")
        }
        return try {
            if (connection.responseCode !in 200..299) {
                throw IOException("GitHub ответил HTTP ${connection.responseCode}.")
            }
            connection.inputStream.bufferedReader().use { it.readText() }
        } finally {
            connection.disconnect()
        }
    }
}
