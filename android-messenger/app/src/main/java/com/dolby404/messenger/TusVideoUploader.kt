package com.dolby404.messenger

import android.content.Context
import android.util.Base64
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MediaType.Companion.toMediaType
import java.io.File
import java.io.IOException
import java.io.RandomAccessFile
import java.net.URI
import java.util.concurrent.TimeUnit

/**
 * Supabase Storage TUS uploader. The remote object remains one ordinary file;
 * TUS only transfers it in resumable chunks and never creates chat fragments.
 *
 * OkHttp is used deliberately: Android HttpURLConnection does not list PATCH
 * as a supported request method, while PATCH is mandatory for the TUS protocol.
 */
internal class TusHttpException(val statusCode: Int, message: String) : IOException(message)

internal object TusVideoUploader {
    private const val CHUNK_SIZE = 6 * 1024 * 1024
    private const val PREFS = "floustream_tus_uploads"
    private const val TUS_VERSION = "1.0.0"
    private val RETRY_DELAYS = longArrayOf(0L, 3000L, 5000L, 10000L, 20000L)

    private val httpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(180, TimeUnit.SECONDS)
            .writeTimeout(180, TimeUnit.SECONDS)
            // A failed PATCH is reconciled with HEAD before it is retried.
            .retryOnConnectionFailure(false)
            .build()
    }

    suspend fun upload(
        context: Context,
        bucket: String,
        objectPath: String,
        file: File,
        accessToken: String,
        apiKey: String,
        refreshAccessToken: suspend () -> String,
        contentType: String = "video/mp4",
        onProgress: suspend (uploadedBytes: Long, totalBytes: Long) -> Unit = { _, _ -> }
    ) {
        require(file.isFile && file.length() > 0L) { "Файл видео пустой или недоступен." }
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val stateKey = objectPath
        var activeToken = accessToken

        suspend fun createUploadWithRefresh(): String {
            return try {
                createUpload(bucket, objectPath, file, activeToken, apiKey, contentType)
            } catch (error: TusHttpException) {
                if (error.statusCode != 401) throw error
                activeToken = refreshAccessToken()
                createUpload(bucket, objectPath, file, activeToken, apiKey, contentType)
            }.also {
                check(prefs.edit().putString(stateKey, it).commit()) {
                    "Не удалось сохранить состояние загрузки видео."
                }
            }
        }

        suspend fun queryOffsetWithRefresh(uploadUrl: String): Long {
            return try {
                queryOffsetWithRetry(uploadUrl, activeToken, apiKey)
            } catch (error: TusHttpException) {
                if (error.statusCode != 401) throw error
                activeToken = refreshAccessToken()
                queryOffsetWithRetry(uploadUrl, activeToken, apiKey)
            }
        }

        var uploadUrl = prefs.getString(stateKey, null)?.takeIf { it.isNotBlank() }
            ?: createUploadWithRefresh()
        var offset = queryOffsetWithRefresh(uploadUrl)
        if (offset < 0L || offset > file.length()) {
            prefs.edit().remove(stateKey).commit()
            uploadUrl = createUploadWithRefresh()
            offset = 0L
        }

        onProgress(offset, file.length())
        var retry = 0
        while (offset < file.length()) {
            try {
                // Every PATCH transfers at most exactly 6 MiB. TUS keeps one
                // remote object and one chat row for the complete video.
                val count = minOf(CHUNK_SIZE.toLong(), file.length() - offset).toInt()
                patchChunk(uploadUrl, file, offset, count, activeToken, apiKey)
                offset += count
                onProgress(offset, file.length())
                retry = 0
            } catch (error: IOException) {
                if (error is TusHttpException && error.statusCode !in setOf(401, 404, 408, 409, 410, 425, 429, 500, 502, 503, 504)) {
                    throw error
                }
                if (error is TusHttpException && error.statusCode == 401) {
                    activeToken = refreshAccessToken()
                    offset = queryOffsetWithRefresh(uploadUrl)
                    onProgress(offset, file.length())
                    retry = 0
                    continue
                }
                if (retry >= RETRY_DELAYS.size) throw error
                val delayMs = RETRY_DELAYS[retry++]
                if (delayMs > 0L) Thread.sleep(delayMs)

                // A lost PATCH response does not tell us whether the server
                // accepted the chunk. Ask TUS for its authoritative offset.
                offset = queryOffsetWithRefresh(uploadUrl)
                if (offset < 0L) {
                    prefs.edit().remove(stateKey).commit()
                    uploadUrl = createUploadWithRefresh()
                    offset = 0L
                }
                onProgress(offset, file.length())
                if (offset > file.length()) throw error
            }
        }
        prefs.edit().remove(stateKey).commit()
    }

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
        val request = Request.Builder()
            .url(endpoint())
            .header("Tus-Resumable", TUS_VERSION)
            .header("Upload-Length", file.length().toString())
            .header("Upload-Metadata", metadata)
            .header("Authorization", "Bearer $token")
            .header("apikey", apiKey)
            .header("x-upsert", "true")
            .post(ByteArray(0).toRequestBody())
            .build()

        httpClient.newCall(request).execute().use { response ->
            if (response.code != 201) {
                throw TusHttpException(response.code, "Не удалось начать TUS-загрузку (HTTP ${response.code}): ${response.body?.string()?.take(400) ?: response.message}")
            }
            val location = response.header("Location")
                ?: throw IOException("Storage не вернул адрес TUS-загрузки.")
            return URI(endpoint()).resolve(location).toString()
        }
    }

    private fun queryOffsetWithRetry(uploadUrl: String, token: String, apiKey: String): Long {
        var lastError: IOException? = null
        for (delayMs in RETRY_DELAYS) {
            try {
                if (delayMs > 0L) Thread.sleep(delayMs)
                return queryOffset(uploadUrl, token, apiKey)
            } catch (error: IOException) {
                if (error is TusHttpException && error.statusCode !in setOf(408, 425, 429, 500, 502, 503, 504)) throw error
                lastError = error
            }
        }
        throw lastError ?: IOException("Не удалось проверить состояние TUS-загрузки.")
    }

    private fun queryOffset(uploadUrl: String, token: String, apiKey: String): Long {
        val request = Request.Builder()
            .url(uploadUrl)
            .header("Tus-Resumable", TUS_VERSION)
            .header("Authorization", "Bearer $token")
            .header("apikey", apiKey)
            .head()
            .build()

        httpClient.newCall(request).execute().use { response ->
            if (response.code == 404 || response.code == 410) return -1L
            if (!response.isSuccessful) {
                throw TusHttpException(response.code, "Не удалось проверить продолжение загрузки (HTTP ${response.code}).")
            }
            return response.header("Upload-Offset")?.toLongOrNull()
                ?: throw IOException("Storage не вернул Upload-Offset.")
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
        RandomAccessFile(file, "r").use { input ->
            input.seek(offset)
            input.readFully(chunk)
        }

        val request = Request.Builder()
            .url(uploadUrl)
            .header("Tus-Resumable", TUS_VERSION)
            .header("Upload-Offset", offset.toString())
            .header("Authorization", "Bearer $token")
            .header("apikey", apiKey)
            .patch(chunk.toRequestBody("application/offset+octet-stream".toMediaType()))
            .build()

        httpClient.newCall(request).execute().use { response ->
            if (response.code != 204) {
                throw TusHttpException(response.code, "Ошибка передачи фрагмента видео (HTTP ${response.code}): ${response.body?.string()?.take(400) ?: response.message}")
            }
            val nextOffset = response.header("Upload-Offset")?.toLongOrNull()
            if (nextOffset != offset + count) {
                throw IOException("Storage подтвердил неверную позицию фрагмента.")
            }
        }
    }
}
