package com.dolby404.messenger

import android.content.Context
import android.util.Base64
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL

/**
 * Supabase Storage TUS uploader. The remote object remains one ordinary file;
 * TUS only transfers it in resumable chunks and never creates chat fragments.
 */
internal object TusVideoUploader {
    private const val CHUNK_SIZE = 6 * 1024 * 1024
    private const val PREFS = "floustream_tus_uploads"
    private const val TUS_VERSION = "1.0.0"

    fun upload(
        context: Context,
        bucket: String,
        objectPath: String,
        file: File,
        accessToken: String,
        apiKey: String,
        contentType: String = "video/mp4"
    ) {
        require(file.isFile && file.length() > 0L) { "Файл видео пустой или недоступен." }
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val stateKey = objectPath
        var uploadUrl: String = prefs.getString(stateKey, null)?.takeIf { it.isNotBlank() }
            ?: createUpload(bucket, objectPath, file, accessToken, apiKey, contentType).also {
                prefs.edit().putString(stateKey, it).apply()
            }

        var offset = queryOffset(uploadUrl, accessToken, apiKey)
        if (offset < 0L || offset > file.length()) {
            prefs.edit().remove(stateKey).apply()
            uploadUrl = createUpload(bucket, objectPath, file, accessToken, apiKey, contentType)
            prefs.edit().putString(stateKey, uploadUrl).apply()
            offset = 0L
        }

        var retry = 0
        while (offset < file.length()) {
            try {
                val count = minOf(CHUNK_SIZE.toLong(), file.length() - offset).toInt()
                patchChunk(uploadUrl, file, offset, count, accessToken, apiKey)
                offset += count
                retry = 0
            } catch (e: Exception) {
                if (e is IOException && retry < RETRY_DELAYS.size) {
                    Thread.sleep(RETRY_DELAYS[retry++])
                    offset = queryOffset(uploadUrl, accessToken, apiKey)
                    if (offset < 0L) {
                        prefs.edit().remove(stateKey).apply()
                        uploadUrl = createUpload(bucket, objectPath, file, accessToken, apiKey, contentType)
                        prefs.edit().putString(stateKey, uploadUrl).apply()
                        offset = 0L
                    }
                    if (offset > file.length()) throw e
                } else {
                    throw e
                }
            }
        }
        prefs.edit().remove(stateKey).apply()
    }

    private val RETRY_DELAYS = longArrayOf(0L, 3000L, 5000L, 10000L, 20000L)

    private fun endpoint(): String {
        val base = BuildConfig.SUPABASE_URL.trimEnd('/')
        return base.replace(".supabase.co", ".storage.supabase.co") + "/storage/v1/upload/resumable"
    }

    private fun createUpload(
        bucket: String,
        objectPath: String,
        file: File,
        token: String,
        apiKey: String,
        contentType: String
    ): String {
        val metadata = listOf(
            "bucketName" to bucket,
            "objectName" to objectPath,
            "contentType" to contentType,
            "cacheControl" to "3600"
        ).joinToString(",") { (key, value) ->
            "$key ${Base64.encodeToString(value.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)}"
        }
        val connection = (URL(endpoint()).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 20000
            readTimeout = 30000
            doOutput = true
            setRequestProperty("Tus-Resumable", TUS_VERSION)
            setRequestProperty("Upload-Length", file.length().toString())
            setRequestProperty("Upload-Metadata", metadata)
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("apikey", apiKey)
        }
        try {
            val code = connection.responseCode
            if (code != HttpURLConnection.HTTP_CREATED) {
                throw IOException("Не удалось начать TUS-загрузку (HTTP $code): ${readError(connection)}")
            }
            val location = connection.getHeaderField("Location")
                ?: throw IOException("Storage не вернул адрес TUS-загрузки.")
            return URI(endpoint()).resolve(location).toString()
        } finally {
            connection.disconnect()
        }
    }

    private fun queryOffset(uploadUrl: String, token: String, apiKey: String): Long {
        val connection = (URL(uploadUrl).openConnection() as HttpURLConnection).apply {
            requestMethod = "HEAD"
            connectTimeout = 20000
            readTimeout = 30000
            setRequestProperty("Tus-Resumable", TUS_VERSION)
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("apikey", apiKey)
        }
        try {
            val code = connection.responseCode
            if (code == HttpURLConnection.HTTP_NOT_FOUND || code == 410) return -1L
            if (code !in 200..299) throw IOException("Не удалось проверить продолжение загрузки (HTTP $code).")
            return connection.getHeaderField("Upload-Offset")?.toLongOrNull()
                ?: throw IOException("Storage не вернул Upload-Offset.")
        } finally {
            connection.disconnect()
        }
    }

    private fun patchChunk(
        uploadUrl: String,
        file: File,
        offset: Long,
        count: Int,
        token: String,
        apiKey: String
    ) {
        val chunk = ByteArray(count)
        file.inputStream().use { input ->
            var skipped = 0L
            while (skipped < offset) {
                val amount = input.skip(offset - skipped)
                if (amount <= 0L) throw IOException("Не удалось перейти к фрагменту видео.")
                skipped += amount
            }
            var read = 0
            while (read < count) {
                val amount = input.read(chunk, read, count - read)
                if (amount < 0) throw IOException("Файл видео изменился во время загрузки.")
                read += amount
            }
        }

        val connection = (URL(uploadUrl).openConnection() as HttpURLConnection).apply {
            requestMethod = "PATCH"
            connectTimeout = 20000
            readTimeout = 60000
            doOutput = true
            setFixedLengthStreamingMode(count)
            setRequestProperty("Tus-Resumable", TUS_VERSION)
            setRequestProperty("Upload-Offset", offset.toString())
            setRequestProperty("Content-Type", "application/offset+octet-stream")
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("apikey", apiKey)
        }
        try {
            connection.outputStream.use { it.write(chunk) }
            val code = connection.responseCode
            if (code != HttpURLConnection.HTTP_NO_CONTENT) {
                throw IOException("Ошибка передачи фрагмента видео (HTTP $code): ${readError(connection)}")
            }
            val nextOffset = connection.getHeaderField("Upload-Offset")?.toLongOrNull()
            if (nextOffset != offset + count) {
                throw IOException("Storage подтвердил неверную позицию фрагмента.")
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun readError(connection: HttpURLConnection): String =
        try {
            (connection.errorStream ?: connection.inputStream).bufferedReader().use { it.readText().take(400) }
        } catch (_: Exception) {
            connection.responseMessage ?: "неизвестная ошибка"
        }
}
