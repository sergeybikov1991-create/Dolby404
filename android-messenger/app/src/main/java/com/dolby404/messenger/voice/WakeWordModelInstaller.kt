package com.dolby404.messenger.voice

import android.content.Context
import android.os.StatFs
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.zip.ZipInputStream

/**
 * Installs the compact Russian Vosk model into app-private storage.
 *
 * The archive is downloaded over HTTPS, size-checked and SHA-256 verified
 * before extraction. ZIP paths are constrained to the expected model root.
 * Call from a visible, user-initiated setup flow; this method performs I/O
 * on Dispatchers.IO and never starts microphone capture.
 */
object WakeWordModelInstaller {

    const val MODEL_ARCHIVE_BYTES = 46_236_750L
    const val MODEL_ARCHIVE_SHA256 =
        "961d5ff98a17f4aa6de69864d0aa71fa5bac682301d2b5d17a3f24c5c99a46d4"

    private const val MODEL_URL =
        "https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip"
    private const val MODEL_ROOT = "vosk-model-small-ru-0.22"
    private const val MAX_EXPANDED_BYTES = 220L * 1024L * 1024L
    private const val MIN_FREE_BYTES = 200L * 1024L * 1024L

    fun modelDirectory(context: Context): File =
        File(context.filesDir, "wakeword/model")

    fun isInstalled(context: Context): Boolean {
        val root = modelDirectory(context)
        return File(root, "am").isDirectory &&
            File(root, "conf").isDirectory &&
            File(root, "graph").isDirectory
    }

    suspend fun install(
        context: Context,
        onProgress: (downloadedBytes: Long, totalBytes: Long) -> Unit = { _, _ -> }
    ): File = withContext(Dispatchers.IO) {
        val parent = File(context.filesDir, "wakeword")
        check(parent.exists() || parent.mkdirs()) { "Не удалось создать каталог модели" }
        check(StatFs(parent.absolutePath).availableBytes >= MIN_FREE_BYTES) {
            "Для установки голосовой модели нужно не менее 200 МБ свободного места"
        }

        val archive = File(parent, "model-download.tmp")
        val staging = File(parent, "model-install.tmp")
        val destination = modelDirectory(context)
        val backup = File(parent, "model-backup.tmp")
        archive.delete()
        staging.deleteRecursively()
        backup.deleteRecursively()

        var connection: HttpURLConnection? = null
        try {
            connection = (URL(MODEL_URL).openConnection() as HttpURLConnection).apply {
                connectTimeout = 20_000
                readTimeout = 30_000
                instanceFollowRedirects = true
                requestMethod = "GET"
                setRequestProperty("User-Agent", "FLOUSTREAM-Android")
            }
            check(connection.responseCode == HttpURLConnection.HTTP_OK) {
                "Сервер модели ответил кодом ${connection.responseCode}"
            }
            check(connection.url.protocol == "https") { "Загрузка модели должна идти только по HTTPS" }

            val digest = MessageDigest.getInstance("SHA-256")
            var downloaded = 0L
            BufferedInputStream(connection.inputStream).use { input ->
                FileOutputStream(archive).use { raw ->
                    BufferedOutputStream(raw).use { output ->
                        val buffer = ByteArray(32 * 1024)
                        while (true) {
                            val count = input.read(buffer)
                            if (count < 0) break
                            downloaded += count
                            check(downloaded <= MODEL_ARCHIVE_BYTES) {
                                "Архив модели превышает ожидаемый размер"
                            }
                            digest.update(buffer, 0, count)
                            output.write(buffer, 0, count)
                            onProgress(downloaded, MODEL_ARCHIVE_BYTES)
                        }
                    }
                }
            }

            check(downloaded == MODEL_ARCHIVE_BYTES) {
                "Архив модели неполный: получено $downloaded байт"
            }
            val actualHash = digest.digest().joinToString("") { "%02x".format(it.toInt() and 0xff) }
            check(actualHash.equals(MODEL_ARCHIVE_SHA256, ignoreCase = true)) {
                "Контрольная сумма модели не совпала. Архив удалён."
            }

            check(staging.mkdirs()) { "Не удалось подготовить каталог распаковки" }
            var expandedBytes = 0L
            var sawAm = false
            var sawConf = false
            var sawGraph = false

            ZipInputStream(BufferedInputStream(FileInputStream(archive))).use { zip ->
                val buffer = ByteArray(32 * 1024)
                while (true) {
                    val entry = zip.nextEntry ?: break
                    val normalized = entry.name.replace('\\', '/')
                    check(!normalized.startsWith("/") && !normalized.contains("../") &&
                        normalized != ".." && !normalized.contains(":")) {
                        "Архив содержит небезопасный путь"
                    }
                    val prefix = "$MODEL_ROOT/"
                    check(normalized.startsWith(prefix)) {
                        "Неожиданная структура архива модели"
                    }
                    val relative = normalized.removePrefix(prefix)
                    if (relative.isNotEmpty()) {
                        val outputFile = File(staging, relative)
                        val canonicalRoot = staging.canonicalFile
                        val canonicalOutput = outputFile.canonicalFile
                        check(canonicalOutput.path.startsWith(canonicalRoot.path + File.separator)) {
                            "Попытка выхода за каталог распаковки"
                        }
                        if (entry.isDirectory) {
                            check(outputFile.exists() || outputFile.mkdirs()) {
                                "Не удалось создать каталог модели"
                            }
                        } else {
                            check(outputFile.parentFile?.exists() == true ||
                                outputFile.parentFile?.mkdirs() == true) {
                                "Не удалось создать каталог файла модели"
                            }
                            FileOutputStream(outputFile).use { output ->
                                while (true) {
                                    val count = zip.read(buffer)
                                    if (count < 0) break
                                    expandedBytes += count
                                    check(expandedBytes <= MAX_EXPANDED_BYTES) {
                                        "Распакованная модель превышает допустимый размер"
                                    }
                                    output.write(buffer, 0, count)
                                }
                            }
                            if (relative.startsWith("am/")) sawAm = true
                            if (relative.startsWith("conf/")) sawConf = true
                            if (relative.startsWith("graph/")) sawGraph = true
                        }
                    }
                    zip.closeEntry()
                }
            }

            check(sawAm && sawConf && sawGraph) {
                "Архив не содержит обязательные каталоги модели Vosk"
            }

            if (destination.exists()) {
                check(destination.renameTo(backup)) { "Не удалось сохранить предыдущую модель" }
            }
            if (!staging.renameTo(destination)) {
                if (backup.exists()) backup.renameTo(destination)
                error("Не удалось установить проверенную модель")
            }
            backup.deleteRecursively()
            destination
        } catch (error: Exception) {
            staging.deleteRecursively()
            archive.delete()
            throw error
        } finally {
            connection?.disconnect()
            archive.delete()
        }
    }
}
