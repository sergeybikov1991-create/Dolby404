package com.dolby404.messenger.voice

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.ZipInputStream

/**
 * Installs the compact Russian Vosk model into app-private storage.
 *
 * The model is deliberately downloaded separately from the APK. Extraction is
 * bounded and rejects ZIP path traversal so a corrupt archive cannot write
 * outside the app's private staging directory.
 */
class VoskWakeWordModelInstaller(
    context: Context
) {
    private val appContext = context.applicationContext

    suspend fun install(onProgress: (Int) -> Unit = {}): File = withContext(Dispatchers.IO) {
        val target = File(appContext.filesDir, MODEL_DIRECTORY)
        if (isValidModel(target)) return@withContext target

        val archive = File(appContext.cacheDir, MODEL_ARCHIVE)
        val staging = File(appContext.filesDir, STAGING_DIRECTORY)
        archive.delete()
        staging.deleteRecursively()
        check(staging.mkdirs() || staging.isDirectory) {
            "Не удалось подготовить каталог установки голосовой модели"
        }

        var connection: HttpURLConnection? = null
        try {
            connection = (URL(MODEL_URL).openConnection() as HttpURLConnection).apply {
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                instanceFollowRedirects = true
                requestMethod = "GET"
                setRequestProperty("User-Agent", "FLOUSTREAM-Android")
            }
            connection.connect()
            check(connection.responseCode in 200..299) {
                "Сервер модели вернул HTTP ${connection.responseCode}"
            }

            val expectedBytes = connection.contentLengthLong
            check(expectedBytes <= MAX_ARCHIVE_BYTES) {
                "Архив голосовой модели превышает допустимый размер"
            }
            var downloaded = 0L
            connection.inputStream.use { input ->
                BufferedInputStream(input).use { bufferedInput ->
                    BufferedOutputStream(FileOutputStream(archive)).use { output ->
                        val buffer = ByteArray(COPY_BUFFER_BYTES)
                        while (true) {
                            val count = bufferedInput.read(buffer)
                            if (count < 0) break
                            downloaded += count
                            check(downloaded <= MAX_ARCHIVE_BYTES) {
                                "Архив голосовой модели превышает допустимый размер"
                            }
                            output.write(buffer, 0, count)
                            if (expectedBytes > 0L) {
                                onProgress(((downloaded * 100L) / expectedBytes).toInt().coerceIn(0, 99))
                            }
                        }
                    }
                }
            }
            check(downloaded > 0L) { "Сервер вернул пустой архив голосовой модели" }

            extractSafely(archive, staging)
            val extractedModel = staging.listFiles()
                ?.firstOrNull(::isValidModel)
                ?: staging.takeIf(::isValidModel)
            check(extractedModel != null) {
                "В архиве нет корректной русской модели Vosk"
            }

            target.deleteRecursively()
            check(extractedModel.renameTo(target)) {
                "Не удалось сохранить установленную голосовую модель"
            }
            check(isValidModel(target)) { "Установленная голосовая модель повреждена" }
            onProgress(100)
            target
        } finally {
            connection?.disconnect()
            archive.delete()
            staging.deleteRecursively()
        }
    }

    fun installedModelDirectory(): File? =
        File(appContext.filesDir, MODEL_DIRECTORY).takeIf(::isValidModel)

    private fun extractSafely(archive: File, destination: File) {
        val canonicalRoot = destination.canonicalFile
        var expandedBytes = 0L
        var entryCount = 0

        ZipInputStream(BufferedInputStream(FileInputStream(archive))).use { zip ->
            while (true) {
                val entry = zip.nextEntry ?: break
                entryCount += 1
                check(entryCount <= MAX_ZIP_ENTRIES) {
                    "Архив голосовой модели содержит слишком много файлов"
                }

                val outputFile = resolveArchiveEntry(canonicalRoot, entry.name)
                if (entry.isDirectory) {
                    check(outputFile.mkdirs() || outputFile.isDirectory) {
                        "Не удалось создать каталог голосовой модели"
                    }
                } else {
                    val parent = outputFile.parentFile
                    check(parent != null && (parent.mkdirs() || parent.isDirectory)) {
                        "Не удалось создать каталог файла голосовой модели"
                    }
                    BufferedOutputStream(FileOutputStream(outputFile)).use { output ->
                        val buffer = ByteArray(COPY_BUFFER_BYTES)
                        while (true) {
                            val count = zip.read(buffer)
                            if (count < 0) break
                            expandedBytes += count
                            check(expandedBytes <= MAX_EXPANDED_BYTES) {
                                "Распакованная голосовая модель превышает допустимый размер"
                            }
                            output.write(buffer, 0, count)
                        }
                    }
                }
                zip.closeEntry()
            }
        }
    }

    private fun isValidModel(directory: File): Boolean =
        directory.isDirectory &&
            File(directory, "am/final.mdl").isFile &&
            File(directory, "conf/model.conf").isFile

    companion object {
        const val MODEL_DIRECTORY = "vosk-model-small-ru-0.22"

        internal fun resolveArchiveEntry(root: File, entryName: String): File {
            require(entryName.isNotBlank()) { "Пустое имя файла в архиве" }
            val candidate = File(root, entryName).canonicalFile
            val rootPath = root.canonicalPath + File.separator
            require(candidate.canonicalPath.startsWith(rootPath)) {
                "Архив голосовой модели содержит небезопасный путь"
            }
            return candidate
        }
        const val MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip"

        private const val MODEL_ARCHIVE = "floustream-vosk-ru.zip"
        private const val STAGING_DIRECTORY = "vosk-model-staging"
        private const val CONNECT_TIMEOUT_MS = 20_000
        private const val READ_TIMEOUT_MS = 30_000
        private const val COPY_BUFFER_BYTES = 16 * 1024
        private const val MAX_ARCHIVE_BYTES = 100L * 1024L * 1024L
        private const val MAX_EXPANDED_BYTES = 300L * 1024L * 1024L
        private const val MAX_ZIP_ENTRIES = 10_000
    }
}
