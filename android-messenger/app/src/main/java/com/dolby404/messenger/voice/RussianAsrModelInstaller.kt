package com.dolby404.messenger.voice

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import kotlin.coroutines.coroutineContext

data class RussianAsrModelFiles(
    val model: File,
    val tokens: File,
    val license: File
)

sealed interface RussianAsrInstallResult {
    data class Ready(val files: RussianAsrModelFiles, val downloaded: Boolean) : RussianAsrInstallResult
    data class Failed(val message: String) : RussianAsrInstallResult
}

/**
 * Downloads the official sherpa-onnx T-one Russian streaming model only after
 * the user opts in. The release archive is pinned by SHA-256 and extracted
 * with path traversal protection into app-private storage.
 */
class RussianAsrModelInstaller(context: Context) {
    companion object {
        const val MODEL_SAMPLE_RATE = 8_000
        const val MODEL_NAME = "sherpa-onnx-streaming-t-one-russian-2025-09-08"
        const val ARCHIVE_SIZE_BYTES = 128_468_156L
        const val ARCHIVE_SHA256 = "b9c907450e99a6e5049e279bf18368a17db0bdc5e63b7fa978943138debbe3ae"
        const val DOWNLOAD_URL =
            "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/$MODEL_NAME.tar.bz2"
        private const val MAX_ARCHIVE_BYTES = 140L * 1024L * 1024L
        private const val MIN_FREE_BYTES = 320L * 1024L * 1024L
    }

    private val root = File(context.filesDir, "voice-models")
    private val target = File(root, MODEL_NAME)

    fun installedFiles(): RussianAsrModelFiles? {
        val model = File(target, "model.onnx")
        val tokens = File(target, "tokens.txt")
        val license = File(target, "LICENSE")
        return if (model.isFile && tokens.isFile && license.isFile) {
            RussianAsrModelFiles(model, tokens, license)
        } else null
    }

    suspend fun install(
        onProgress: (downloadedBytes: Long, totalBytes: Long) -> Unit = { _, _ -> }
    ): RussianAsrInstallResult = withContext(Dispatchers.IO) {
        installedFiles()?.let { return@withContext RussianAsrInstallResult.Ready(it, false) }
        if (!root.exists() && !root.mkdirs()) {
            return@withContext RussianAsrInstallResult.Failed("Не удалось создать папку голосовой модели")
        }
        if (root.usableSpace < MIN_FREE_BYTES) {
            return@withContext RussianAsrInstallResult.Failed(
                "Для установки русской модели нужно освободить не менее 320 МБ"
            )
        }

        val archive = File(root, "$MODEL_NAME.tar.bz2.part")
        val staging = File(root, "$MODEL_NAME.installing")
        var connection: HttpURLConnection? = null
        try {
            if (staging.exists()) staging.deleteRecursively()
            val digest = MessageDigest.getInstance("SHA-256")
            connection = (URL(DOWNLOAD_URL).openConnection() as HttpURLConnection).apply {
                connectTimeout = 20_000
                readTimeout = 60_000
                instanceFollowRedirects = true
                setRequestProperty("User-Agent", "FLOUSTREAM-Android")
                connect()
            }
            if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                return@withContext RussianAsrInstallResult.Failed(
                    "Сервер модели вернул HTTP ${connection.responseCode}"
                )
            }
            val contentLength = connection.contentLengthLong
            if (contentLength > MAX_ARCHIVE_BYTES) {
                return@withContext RussianAsrInstallResult.Failed("Размер архива модели превышает допустимый")
            }

            var downloaded = 0L
            BufferedInputStream(connection.inputStream).use { input ->
                BufferedOutputStream(FileOutputStream(archive)).use { output ->
                    val buffer = ByteArray(64 * 1024)
                    while (true) {
                        coroutineContext.ensureActive()
                        val count = input.read(buffer)
                        if (count < 0) break
                        downloaded += count
                        if (downloaded > MAX_ARCHIVE_BYTES) {
                            throw IllegalStateException("Архив модели превышает допустимый размер")
                        }
                        digest.update(buffer, 0, count)
                        output.write(buffer, 0, count)
                        onProgress(downloaded, if (contentLength > 0) contentLength else ARCHIVE_SIZE_BYTES)
                    }
                }
            }
            val actualHash = digest.digest().joinToString("") { "%02x".format(it) }
            if (!actualHash.equals(ARCHIVE_SHA256, ignoreCase = true)) {
                return@withContext RussianAsrInstallResult.Failed("Контрольная сумма модели не совпала")
            }

            if (!staging.mkdirs()) {
                return@withContext RussianAsrInstallResult.Failed("Не удалось подготовить установку модели")
            }
            extractRequiredFiles(archive, staging)

            val model = File(staging, "model.onnx")
            val tokens = File(staging, "tokens.txt")
            val license = File(staging, "LICENSE")
            if (!model.isFile || !tokens.isFile || !license.isFile) {
                return@withContext RussianAsrInstallResult.Failed("В архиве отсутствуют обязательные файлы модели")
            }
            if (target.exists() && !target.deleteRecursively()) {
                return@withContext RussianAsrInstallResult.Failed("Не удалось заменить старую модель")
            }
            if (!staging.renameTo(target)) {
                return@withContext RussianAsrInstallResult.Failed("Не удалось завершить установку модели")
            }
            RussianAsrInstallResult.Ready(
                RussianAsrModelFiles(
                    File(target, "model.onnx"),
                    File(target, "tokens.txt"),
                    File(target, "LICENSE")
                ),
                true
            )
        } catch (cancelled: kotlinx.coroutines.CancellationException) {
            throw cancelled
        } catch (error: Exception) {
            RussianAsrInstallResult.Failed(error.message ?: "Не удалось установить русскую модель")
        } finally {
            connection?.disconnect()
            archive.delete()
            if (staging.exists()) staging.deleteRecursively()
        }
    }

    private suspend fun extractRequiredFiles(archive: File, destination: File) {
        val wanted = setOf("model.onnx", "tokens.txt", "LICENSE")
        BZip2CompressorInputStream(BufferedInputStream(FileInputStream(archive))).use { bz2 ->
            TarArchiveInputStream(bz2).use { tar ->
                while (true) {
                    coroutineContext.ensureActive()
                    val entry = tar.nextTarEntry ?: break
                    val name = entry.name.replace('\\', '/')
                    val segments = name.split('/')
                    require(!name.startsWith("/") && segments.none { it == ".." }) {
                        "Недопустимый путь внутри архива модели"
                    }
                    val leaf = segments.lastOrNull().orEmpty()
                    if (!entry.isFile || leaf !in wanted) continue
                    require(entry.size in 1..(260L * 1024L * 1024L)) {
                        "Недопустимый размер файла модели"
                    }
                    val output = File(destination, leaf)
                    require(output.canonicalFile.parentFile == destination.canonicalFile) {
                        "Недопустимый путь извлечения модели"
                    }
                    BufferedOutputStream(FileOutputStream(output)).use { sink ->
                        val buffer = ByteArray(64 * 1024)
                        var copied = 0L
                        while (true) {
                            coroutineContext.ensureActive()
                            val count = tar.read(buffer)
                            if (count < 0) break
                            copied += count
                            require(copied <= entry.size) { "Файл модели больше размера в архиве" }
                            sink.write(buffer, 0, count)
                        }
                        require(copied == entry.size) { "Файл модели извлечён не полностью" }
                    }
                }
            }
        }
    }
}
