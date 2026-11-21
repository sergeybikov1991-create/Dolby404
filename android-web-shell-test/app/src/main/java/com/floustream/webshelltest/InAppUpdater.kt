package com.floustream.webshelltest

import android.app.Activity
import android.app.AlertDialog
import android.app.ProgressDialog
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.provider.Settings
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors

/** Verifies the SHA-256 of a GitHub Release APK before handing installation to Android. */
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
                val release = JSONObject(readText(URL("https://api.github.com/repos/${BuildConfig.UPDATE_REPOSITORY}/releases/latest")))
                val assets = release.optJSONArray("assets") ?: return@execute
                var manifestUrl: String? = null
                for (i in 0 until assets.length()) {
                    val asset = assets.getJSONObject(i)
                    if (asset.optString("name") == "update.json") manifestUrl = asset.optString("browser_download_url")
                }
                val manifestLink = manifestUrl ?: return@execute
                val data = JSONObject(readText(URL(manifestLink)))
                val latestCode = data.optInt("versionCode", 0)
                val latestName = data.optString("versionName", "")
                val apkUrl = data.optString("apkUrl")
                val checksum = data.optString("sha256").lowercase()
                if (latestCode <= BuildConfig.VERSION_CODE) return@execute
                if (!apkUrl.startsWith("https://") || !checksum.matches(Regex("[a-f0-9]{64}"))) return@execute
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
            } catch (_: Exception) {
                // Update checks must not prevent the app from opening.
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
            try {
                val connection = (URL(apkUrl).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 20000
                    readTimeout = 90000
                    instanceFollowRedirects = true
                    setRequestProperty("User-Agent", "FLOUSTREAM-Android-Updater")
                }
                connection.connect()
                if (connection.responseCode !in 200..299) error("HTTP ${connection.responseCode}")
                val target = File(activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "floustream-update.apk")
                connection.inputStream.use { input -> FileOutputStream(target).use { output -> input.copyTo(output) } }
                connection.disconnect()
                val actual = MessageDigest.getInstance("SHA-256").digest(target.readBytes())
                    .joinToString("") { "%02x".format(it) }
                if (actual != expectedSha) {
                    target.delete()
                    throw SecurityException("APK checksum mismatch")
                }
                downloadedApk = target
                activity.runOnUiThread {
                    dialog.dismiss()
                    requestPermissionOrInstall()
                }
            } catch (_: Exception) {
                activity.runOnUiThread {
                    dialog.dismiss()
                    if (!activity.isFinishing && !activity.isDestroyed) {
                        AlertDialog.Builder(activity)
                            .setTitle("Обновление не установлено")
                            .setMessage("Не удалось скачать или проверить APK. Текущая версия приложения сохранена.")
                            .setPositiveButton("ОК", null)
                            .show()
                    }
                }
            }
        }
    }

    private fun requestPermissionOrInstall() {
        if (activity.isFinishing || activity.isDestroyed) return
        if (android.os.Build.VERSION.SDK_INT >= 26 && !activity.packageManager.canRequestPackageInstalls()) {
            waitingForInstallPermission = true
            AlertDialog.Builder(activity)
                .setTitle("Разрешение Android")
                .setMessage("Разреши FLOUSTREAM устанавливать обновления. Откроются системные настройки.")
                .setNegativeButton("Позже") { _, _ -> waitingForInstallPermission = false }
                .setPositiveButton("Открыть настройки") { _, _ ->
                    activity.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${activity.packageName}")))
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
        val uri = FileProvider.getUriForFile(activity, "${activity.packageName}.fileprovider", file)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        activity.startActivity(intent)
    }

    private fun readText(url: URL): String {
        val connection = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = 15000
            readTimeout = 20000
            setRequestProperty("Accept", "application/vnd.github+json")
            setRequestProperty("X-GitHub-Api-Version", "2022-11-28")
            setRequestProperty("User-Agent", "FLOUSTREAM-Android-Updater")
        }
        return try {
            if (connection.responseCode !in 200..299) error("HTTP ${connection.responseCode}")
            connection.inputStream.bufferedReader().use { it.readText() }
        } finally {
            connection.disconnect()
        }
    }
}
