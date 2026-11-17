package com.dolby404.messenger

import java.util.concurrent.TimeUnit

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.collect

import kotlinx.coroutines.NonCancellable

import androidx.work.workDataOf


import androidx.work.WorkerParameters

import androidx.work.WorkManager

import androidx.work.OneTimeWorkRequestBuilder

import androidx.work.NetworkType

import androidx.work.ForegroundInfo

import androidx.work.ExistingWorkPolicy

import androidx.work.CoroutineWorker

import androidx.work.Constraints

import androidx.work.BackoffPolicy

import androidx.core.app.NotificationCompat

import android.content.pm.ServiceInfo

import android.app.NotificationManager

import android.app.NotificationChannel


import android.os.Bundle
import android.net.Uri
import android.media.MediaRecorder
import android.media.MediaExtractor
import java.io.File
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.net.SocketException
import java.io.EOFException
import java.io.IOException
import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.content.Intent
import android.provider.OpenableColumns
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.ui.PlayerView
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.auth.handleDeeplinks
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.realtime
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.storage.storage
import io.ktor.http.ContentType
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.abs
import kotlin.time.Clock
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Duration.Companion.minutes
import coil.compose.AsyncImage
import coil.request.ImageRequest
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.google.firebase.messaging.FirebaseMessaging

private fun isFinalizedVideoFile(file: File): Boolean {
    if (!file.isFile || file.length() <= 1500L) return false
    val extractor = MediaExtractor()
    return try {
        extractor.setDataSource(file.absolutePath)
        (0 until extractor.trackCount).any { index ->
            val mime = extractor.getTrackFormat(index).getString(android.media.MediaFormat.KEY_MIME)
            mime?.startsWith("video/") == true
        }
    } catch (_: Exception) {
        false
    } finally {
        try { extractor.release() } catch (_: Exception) { }
    }
}


private fun isTransientNetworkFailure(error: Throwable): Boolean {
    var current: Throwable? = error
    while (current != null) {
        if (current is IOException || current is EOFException ||
            current is SocketException || current is SocketTimeoutException ||
            current is UnknownHostException
        ) return true
        val message = current.message.orEmpty().lowercase()
        if (listOf(
                "connection closed", "connection reset", "unexpected end",
                "network is unreachable", "failed to connect", "timed out",
                "timeout", "eof", "temporarily unavailable", "service unavailable",
                "gateway timeout", "http 408", "http 425", "http 429",
                "http 500", "http 502", "http 503", "http 504",
                "too many requests", "rate limit"
            ).any { it in message }
        ) return true
        current = current.cause
    }
    return false
}

private suspend fun <T> withTransientNetworkRetry(
    maxAttempts: Int = 4,
    operation: suspend () -> T
): T {
    var lastError: Exception? = null
    repeat(maxAttempts) { attempt ->
        try {
            return operation()
        } catch (error: Exception) {
            if (error is CancellationException) throw error
            if (!isTransientNetworkFailure(error)) throw error
            lastError = error
            if (attempt < maxAttempts - 1) delay(900L * (1L shl attempt))
        }
    }
    throw lastError ?: IOException("Сетевой запрос не выполнен.")
}

private val Night = Color(0xFF080D1B)
private val Panel = Color(0xFF111A2D)
private val PanelSoft = Color(0xFF18243B)
private val Blue = Color(0xFF548BFF)
private val Violet = Color(0xFF9A65FF)
private val Muted = Color(0xFF91A2BF)
private val White = Color(0xFFF4F7FF)

private val floustreamClient = createSupabaseClient(
    supabaseUrl = BuildConfig.SUPABASE_URL,
    supabaseKey = BuildConfig.SUPABASE_PUBLISHABLE_KEY
) {
    install(Postgrest)
    install(Realtime)
    install(Storage)
    install(Auth) {
        scheme = "dolby404"
        host = "auth-callback"
    }
}

class MainActivity : ComponentActivity() {
    private var pendingLifecycleAction by mutableStateOf<String?>(null)
    private var pendingNotificationPeerId by mutableStateOf<String?>(null)

    private fun lifecycleActionFromIntent(intent: android.content.Intent): String? {
        val uri = intent.data ?: return null
        return when {
            uri.getQueryParameter("confirm_delete") == "1" -> "request_delete"
            uri.getQueryParameter("restore") == "1" -> "restore"
            else -> null
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        RoundVideoDiagnostics.installCrashHandler(applicationContext)
        pendingLifecycleAction = lifecycleActionFromIntent(intent)
        pendingNotificationPeerId = intent.getStringExtra("sender_id")?.takeIf { it.isNotBlank() }
        floustreamClient.handleDeeplinks(intent)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Blue,
                    secondary = Violet,
                    background = Night,
                    surface = Panel,
                    onBackground = White,
                    onSurface = White
                )
            ) { androidx.compose.foundation.layout.Box(Modifier.fillMaxSize()) { MessengerApp(pendingLifecycleAction, pendingNotificationPeerId, { pendingLifecycleAction = null }) { pendingNotificationPeerId = null }; AppUpdatePrompt() } }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingLifecycleAction = lifecycleActionFromIntent(intent)
        pendingNotificationPeerId = intent.getStringExtra("sender_id")?.takeIf { it.isNotBlank() }
        floustreamClient.handleDeeplinks(intent)
    }
}


private fun registerFcmToken(context: Context, userId: String) {
    FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
        if (!task.isSuccessful) return@addOnCompleteListener
        val fcmToken = task.result ?: return@addOnCompleteListener
        val accessToken = floustreamClient.auth.currentSessionOrNull()?.accessToken ?: return@addOnCompleteListener
        Thread {
            val connection = URL("${BuildConfig.SUPABASE_URL}/rest/v1/device_push_tokens?on_conflict=token")
                .openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "POST"
                connection.connectTimeout = 10000
                connection.readTimeout = 10000
                connection.doOutput = true
                connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                connection.setRequestProperty("Authorization", "Bearer $accessToken")
                connection.setRequestProperty("Content-Type", "application/json")
                connection.setRequestProperty("Prefer", "resolution=merge-duplicates,return=minimal")
                val payload = JSONObject()
                    .put("token", fcmToken)
                    .put("user_id", userId)
                    .put("platform", "android")
                    .put("updated_at", java.time.Instant.now().toString())
                    .toString()
                connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
                val responseCode = connection.responseCode
                if (responseCode in 200..299) {
                    val prefs = context.getSharedPreferences("floustream_push", Context.MODE_PRIVATE)
                    if (prefs.getString("pending_fcm_token", null) == fcmToken) {
                        prefs.edit().remove("pending_fcm_token").apply()
                    }
                }
            } catch (_: Exception) {
                // Token registration is retried on the next app launch/resume.
            } finally {
                connection.disconnect()
            }
        }.start()
    }
}

private data class ChatMessage(val text: String, val mine: Boolean, val time: String)

@Serializable
private data class ProfileDto(
    @SerialName("id") val id: String,
    @SerialName("username") val username: String? = null,
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("first_name") val firstName: String? = null,
    @SerialName("last_name") val lastName: String? = null,
    @kotlinx.serialization.Transient val isDeleted: Boolean = false
)

@Serializable
private data class FollowDto(
    @SerialName("follower_id") val followerId: String? = null,
    @SerialName("following_id") val followingId: String? = null
)

@Serializable
private data class FriendRequestDto(
    @SerialName("id") val id: String,
    @SerialName("requester_id") val requesterId: String,
    @SerialName("recipient_id") val recipientId: String,
    @SerialName("status") val status: String
)

@Serializable
private data class NewFriendRequest(
    @SerialName("requester_id") val requesterId: String,
    @SerialName("recipient_id") val recipientId: String,
    @SerialName("user_low_id") val userLowId: String,
    @SerialName("user_high_id") val userHighId: String,
    @SerialName("status") val status: String = "pending"
)

@Serializable
private data class SocialPostDto(
    @SerialName("id") val id: Long,
    @SerialName("user_id") val userId: String,
    @SerialName("content") val content: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
private data class NewSocialPost(
    @SerialName("user_id") val userId: String,
    @SerialName("content") val content: String
)

private data class SocialFeedItem(
    val post: SocialPostDto,
    val author: ProfileDto?
)

@Serializable
private data class HiddenDirectMessageDto(
    @SerialName("message_id") val messageId: String
)

@Serializable
private data class NewHiddenDirectMessage(
    @SerialName("message_id") val messageId: String,
    @SerialName("user_id") val userId: String
)

private data class DirectMessageReactionDto(
    val id: String,
    val messageId: String,
    val userId: String,
    val emoji: String,
    val createdAt: String
)

@Serializable
private data class DirectMessagePinDto(
    @SerialName("id") val id: String,
    @SerialName("message_id") val messageId: String,
    @SerialName("user_id") val userId: String,
    @SerialName("created_at") val createdAt: String
)

@Serializable
private data class DirectMessageDto(
    @SerialName("id") val id: String,
    @SerialName("sender_id") val senderId: String,
    @SerialName("recipient_id") val recipientId: String,
    @SerialName("content") val content: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("read_at") val readAt: String? = null,
    @SerialName("attachment_path") val attachmentPath: String? = null,
    @SerialName("attachment_name") val attachmentName: String? = null,
    @SerialName("attachment_mime") val attachmentMime: String? = null,
    @SerialName("reply_to_message_id") val replyToMessageId: String? = null,
    @SerialName("edited_at") val editedAt: String? = null
)

private fun chatMessageCacheFile(context: Context, userId: String, peerId: String): File {
    val stableId = UUID.nameUUIDFromBytes("$userId:$peerId".toByteArray(Charsets.UTF_8)).toString()
    val directory = File(context.filesDir, "conversation-cache").apply { mkdirs() }
    return File(directory, "$stableId.json")
}

private fun readCachedChatMessages(context: Context, userId: String, peerId: String): List<DirectMessageDto> {
    val file = chatMessageCacheFile(context, userId, peerId)
    if (!file.isFile) return emptyList()
    return try {
        val array = JSONArray(file.readText(Charsets.UTF_8))
        (0 until array.length()).mapNotNull { index ->
            val row = array.optJSONObject(index) ?: return@mapNotNull null
            fun nullable(name: String): String? = if (row.isNull(name)) null else row.optString(name).takeIf { it.isNotBlank() && it != "null" }
            DirectMessageDto(
                id = row.getString("id"), senderId = row.getString("sender_id"),
                recipientId = row.getString("recipient_id"), content = row.optString("content"),
                createdAt = row.getString("created_at"), readAt = nullable("read_at"),
                attachmentPath = nullable("attachment_path"), attachmentName = nullable("attachment_name"),
                attachmentMime = nullable("attachment_mime"), replyToMessageId = nullable("reply_to_message_id"),
                editedAt = nullable("edited_at")
            )
        }.sortedWith(compareBy<DirectMessageDto> { it.createdAt }.thenBy { it.id })
    } catch (_: Exception) { emptyList() }
}

private fun writeCachedChatMessages(context: Context, userId: String, peerId: String, messages: List<DirectMessageDto>) {
    val recent = messages.distinctBy { it.id }
        .sortedWith(compareBy<DirectMessageDto> { it.createdAt }.thenBy { it.id }).takeLast(1500)
    val array = JSONArray()
    recent.forEach { message ->
        array.put(JSONObject()
            .put("id", message.id).put("sender_id", message.senderId)
            .put("recipient_id", message.recipientId).put("content", message.content)
            .put("created_at", message.createdAt).put("read_at", message.readAt ?: JSONObject.NULL)
            .put("attachment_path", message.attachmentPath ?: JSONObject.NULL)
            .put("attachment_name", message.attachmentName ?: JSONObject.NULL)
            .put("attachment_mime", message.attachmentMime ?: JSONObject.NULL)
            .put("reply_to_message_id", message.replyToMessageId ?: JSONObject.NULL)
            .put("edited_at", message.editedAt ?: JSONObject.NULL))
    }
    val target = chatMessageCacheFile(context, userId, peerId)
    val temporary = File(target.parentFile, target.name + ".tmp")
    temporary.writeText(array.toString(), Charsets.UTF_8)
    if (!temporary.renameTo(target)) {
        target.writeText(temporary.readText(Charsets.UTF_8), Charsets.UTF_8)
        temporary.delete()
    }
}

private data class ChatThread(
    val peer: ProfileDto,
    val lastMessage: DirectMessageDto,
    val unread: Int
)

@Serializable
private data class NewDirectMessage(
    @SerialName("sender_id") val senderId: String,
    @SerialName("recipient_id") val recipientId: String,
    @SerialName("content") val content: String,
    @SerialName("attachment_path") val attachmentPath: String? = null,
    @SerialName("attachment_name") val attachmentName: String? = null,
    @SerialName("attachment_mime") val attachmentMime: String? = null,
    @SerialName("reply_to_message_id") val replyToMessageId: String? = null
)

@Serializable
private data class AlbumMediaDto(
    @SerialName("id") val id: String,
    @SerialName("owner_id") val ownerId: String,
    @SerialName("object_path") val objectPath: String,
    @SerialName("file_name") val fileName: String,
    @SerialName("mime_type") val mimeType: String
)

private data class MediaLibraryItem(
    val id: String,
    val path: String,
    val name: String,
    val mime: String,
    val bucket: String
)

private suspend fun loadPublicMediaLibrary(userId: String): List<MediaLibraryItem> {
    // Only public profile albums are available here. Secret/private albums are deliberately excluded.
    val photos = floustreamClient.from("photo_album_photos").select {
        filter { eq("owner_id", userId) }
    }.decodeList<AlbumMediaDto>().map {
        MediaLibraryItem(it.id, it.objectPath, it.fileName, it.mimeType, "photo-albums")
    }
    val videos = floustreamClient.from("video_album_videos").select {
        filter { eq("owner_id", userId) }
    }.decodeList<AlbumMediaDto>().map {
        MediaLibraryItem(it.id, it.objectPath, it.fileName, it.mimeType, "video-albums")
    }
    return (photos + videos).sortedByDescending { it.id }
}

private suspend fun sendLibraryMedia(context: Context, userId: String, peerId: String, item: MediaLibraryItem) = withContext(Dispatchers.IO) {
    val signedUrl = floustreamClient.storage.from(item.bucket).createSignedUrl(item.path, 10.minutes)
    val connection = URL(signedUrl).openConnection() as HttpURLConnection
    val safeName = item.name.replace(Regex("[^A-Za-z0-9._-]"), "_").take(100).ifBlank { "attachment" }
    val targetPath = userId + "/" + UUID.randomUUID().toString() + "_" + safeName
    if (item.mime.startsWith("video/")) {
        val draftKey = "album_video_${UUID.randomUUID()}.mp4"
        val draftsDir = File(context.filesDir, "video-drafts").apply { mkdirs() }
        val persistentVideo = File(draftsDir, draftKey)
        try {
            connection.connectTimeout = 15000
            connection.readTimeout = 60000
            connection.inputStream.use { input ->
                persistentVideo.outputStream().buffered().use { output ->
                    val buffer = ByteArray(256 * 1024)
                    var total = 0L
                    while (true) {
                        val read = input.read(buffer)
                        if (read < 0) break
                        total += read
                        if (total > 50L * 1024L * 1024L) error("Видеоальбом: файл больше 50 МБ.")
                        output.write(buffer, 0, read)
                    }
                }
            }
            if (persistentVideo.length() <= 0L) error("Видеоальбом: файл пустой или недоступен.")
            val prefs = context.getSharedPreferences("floustream_video_drafts", Context.MODE_PRIVATE)
            val saved = prefs.edit()
                .putString(draftKey, targetPath)
                .putString("${draftKey}_peer", peerId)
                .putString("${draftKey}_name", item.name)
                .putString("${draftKey}_mime", item.mime.ifBlank { "video/mp4" })
                .putBoolean("${draftKey}_round", false)
                .commit()
            if (!saved) error("Не удалось сохранить очередь отправки видеоальбома.")
            enqueueVideoUploadWorker(context, userId, peerId, persistentVideo, draftKey, targetPath, item.name, item.mime.ifBlank { "video/mp4" })
            RoundVideoDiagnostics.record(context, "album video copied to persistent draft and queued; bytes=${persistentVideo.length()}")
        } catch (error: Exception) {
            persistentVideo.delete()
            throw error
        } finally {
            connection.disconnect()
        }
        return@withContext
    } else {
        val bytes = try {
            connection.connectTimeout = 15000
            connection.readTimeout = 60000
            connection.inputStream.use { it.readBytes() }
        } finally { connection.disconnect() }
        if (bytes.size > 50 * 1024 * 1024) error("Файл больше 50 МБ.")
        floustreamClient.storage.from("message-media").upload(targetPath, bytes) {
            contentType = ContentType.parse(item.mime.ifBlank { "application/octet-stream" })
        }
    }
    sendDirectAttachment(userId, peerId, targetPath, item.name, item.mime)
}

private suspend fun findFloustreamUsers(query: String): List<ProfileDto> {
    val term = query.trim().removePrefix("@")
    if (term.length < 2) return emptyList()
    return withTransientNetworkRetry {
        floustreamClient.from("profiles").select {
            filter { ilike("username", "%$term%") }
        }.decodeList<ProfileDto>().filter {
            it.id != floustreamClient.auth.currentUserOrNull()?.id && !it.isDeleted
        }.take(30)
    }
}

private suspend fun loadDirectMessagesPage(
    userId: String,
    peerId: String,
    beforeCreatedAt: String? = null,
    beforeId: String? = null,
    pageSize: Int = 100
): List<DirectMessageDto> = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла.")
    val columns = "id,sender_id,recipient_id,content,created_at,read_at,attachment_path,attachment_name,attachment_mime,reply_to_message_id,edited_at"
    suspend fun fetchDirection(senderId: String, recipientId: String): List<DirectMessageDto> {
        val filters = buildString {
            append("sender_id=eq.").append(URLEncoder.encode(senderId, "UTF-8"))
            append("&recipient_id=eq.").append(URLEncoder.encode(recipientId, "UTF-8"))
            if (beforeCreatedAt != null && beforeId != null) {
                val cursor = "(created_at.lt.$beforeCreatedAt,and(created_at.eq.$beforeCreatedAt,id.lt.$beforeId))"
                append("&or=").append(URLEncoder.encode(cursor, "UTF-8"))
            } else if (beforeCreatedAt != null) {
                append("&created_at=lt.").append(URLEncoder.encode(beforeCreatedAt, "UTF-8"))
            }
            append("&order=created_at.desc,id.desc&limit=").append(pageSize)
        }
        return withTransientNetworkRetry {
            val connection = URL("${BuildConfig.SUPABASE_URL}/rest/v1/direct_messages?select=$columns&$filters")
                .openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "GET"
                connection.connectTimeout = 20000
                connection.readTimeout = 30000
                connection.setRequestProperty("Connection", "close")
                connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                connection.setRequestProperty("Authorization", "Bearer $token")
                val code = connection.responseCode
                if (code !in 200..299) {
                    val detail = connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
                    if (code in 500..599) throw IOException("Не удалось загрузить сообщения (HTTP $code). ${detail.take(180)}")
                    throw IllegalStateException("Не удалось загрузить сообщения ($code). ${detail.take(180)}")
                }
                val rows = JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
                (0 until rows.length()).map { index ->
                    val row = rows.getJSONObject(index)
                    fun nullable(name: String): String? = if (row.isNull(name)) null else row.optString(name).takeIf { it.isNotBlank() }
                    DirectMessageDto(
                        id = row.getString("id"),
                        senderId = row.getString("sender_id"),
                        recipientId = row.getString("recipient_id"),
                        content = row.optString("content"),
                        createdAt = row.getString("created_at"),
                        readAt = nullable("read_at"),
                        attachmentPath = nullable("attachment_path"),
                        attachmentName = nullable("attachment_name"),
                        attachmentMime = nullable("attachment_mime"),
                        replyToMessageId = nullable("reply_to_message_id"),
                        editedAt = nullable("edited_at")
                    )
                }
            } finally {
                connection.disconnect()
            }
        }
    }
    val sent = fetchDirection(userId, peerId)
    val received = fetchDirection(peerId, userId)
    val page = (sent + received).distinctBy { it.id }.sortedWith(compareBy<DirectMessageDto> { it.createdAt }.thenBy { it.id })
    if (page.isEmpty()) return@withContext emptyList()
    val hiddenIds = floustreamClient.from("direct_message_hidden").select {
        filter { eq("user_id", userId) }
    }.decodeList<HiddenDirectMessageDto>().map { it.messageId }.toSet()
    page.filterNot { it.id in hiddenIds }
}


private suspend fun loadDirectMessageReactions(messageIds: List<String>): Map<String, List<DirectMessageReactionDto>> = withContext(Dispatchers.IO) {
    if (messageIds.isEmpty()) return@withContext emptyMap()
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла.")
    val ids = messageIds.distinct().joinToString(",")
    val query = URLEncoder.encode("(${ids})", "UTF-8")
    val connection = URL("${BuildConfig.SUPABASE_URL}/rest/v1/direct_message_reactions?select=id,message_id,user_id,emoji,created_at&message_id=in.$query")
        .openConnection() as HttpURLConnection
    try {
        connection.requestMethod = "GET"
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        val code = connection.responseCode
        if (code !in 200..299) throw IllegalStateException("Не удалось загрузить реакции.")
        val rows = JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
        val result = mutableMapOf<String, MutableList<DirectMessageReactionDto>>()
        for (i in 0 until rows.length()) {
            val row = rows.getJSONObject(i)
            val item = DirectMessageReactionDto(
                id = row.getString("id"),
                messageId = row.getString("message_id"),
                userId = row.getString("user_id"),
                emoji = row.getString("emoji"),
                createdAt = row.getString("created_at")
            )
            result.getOrPut(item.messageId) { mutableListOf() }.add(item)
        }
        result.mapValues { it.value.toList() }
    } finally { connection.disconnect() }
}

private suspend fun loadDirectMessagePins(userId: String): Set<String> = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла.")
    val encodedUser = URLEncoder.encode(userId, "UTF-8")
    val connection = URL("${BuildConfig.SUPABASE_URL}/rest/v1/direct_message_pins?select=message_id&user_id=eq.$encodedUser")
        .openConnection() as HttpURLConnection
    try {
        connection.requestMethod = "GET"
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        if (connection.responseCode !in 200..299) throw IllegalStateException("Не удалось загрузить закреплённые сообщения.")
        val rows = JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
        buildSet { for (i in 0 until rows.length()) add(rows.getJSONObject(i).getString("message_id")) }
    } finally { connection.disconnect() }
}

private suspend fun loadDirectMessageFavorites(userId: String): Set<String> = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла.")
    val encodedUser = URLEncoder.encode(userId, "UTF-8")
    val connection = URL("${BuildConfig.SUPABASE_URL}/rest/v1/direct_message_favorites?select=message_id&user_id=eq.$encodedUser")
        .openConnection() as HttpURLConnection
    try {
        connection.requestMethod = "GET"
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        if (connection.responseCode !in 200..299) throw IllegalStateException("Не удалось загрузить избранные сообщения.")
        val rows = JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
        buildSet { for (i in 0 until rows.length()) add(rows.getJSONObject(i).getString("message_id")) }
    } finally { connection.disconnect() }
}


private suspend fun loadFavoriteDirectMessages(
    userId: String,
    peerId: String,
    messageIds: Set<String>
): List<DirectMessageDto> = withContext(Dispatchers.IO) {
    if (messageIds.isEmpty()) return@withContext emptyList()
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла.")
    val columns = "id,sender_id,recipient_id,content,created_at,read_at,attachment_path,attachment_name,attachment_mime,reply_to_message_id,edited_at"
    val encodedUser = URLEncoder.encode(userId, "UTF-8")
    val encodedPeer = URLEncoder.encode(peerId, "UTF-8")
    val loaded = mutableListOf<DirectMessageDto>()
    messageIds.toList().chunked(100).forEach { batch ->
        val encodedIds = URLEncoder.encode(batch.joinToString(",", "(", ")"), "UTF-8")
        val directions = "(and(sender_id.eq.$encodedUser,recipient_id.eq.$encodedPeer),and(sender_id.eq.$encodedPeer,recipient_id.eq.$encodedUser))"
        val encodedDirections = URLEncoder.encode(directions, "UTF-8")
        val url = "${BuildConfig.SUPABASE_URL}/rest/v1/direct_messages?select=$columns&id=in.$encodedIds&or=$encodedDirections"
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "GET"
            connection.connectTimeout = 15000
            connection.readTimeout = 20000
            connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
            connection.setRequestProperty("Authorization", "Bearer $token")
            val code = connection.responseCode
            if (code !in 200..299) {
                val detail = connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
                throw IllegalStateException("Не удалось загрузить избранные сообщения ($code). ${detail.take(180)}")
            }
            val rows = JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
            for (index in 0 until rows.length()) {
                val row = rows.getJSONObject(index)
                fun nullable(name: String): String? = if (row.isNull(name)) null else row.optString(name).takeIf { it.isNotBlank() }
                loaded += DirectMessageDto(
                    id = row.getString("id"),
                    senderId = row.getString("sender_id"),
                    recipientId = row.getString("recipient_id"),
                    content = row.optString("content"),
                    createdAt = row.getString("created_at"),
                    readAt = nullable("read_at"),
                    attachmentPath = nullable("attachment_path"),
                    attachmentName = nullable("attachment_name"),
                    attachmentMime = nullable("attachment_mime"),
                    replyToMessageId = nullable("reply_to_message_id"),
                    editedAt = nullable("edited_at")
                )
            }
        } finally {
            connection.disconnect()
        }
    }
    val hiddenIds = floustreamClient.from("direct_message_hidden").select {
        filter { eq("user_id", userId) }
    }.decodeList<HiddenDirectMessageDto>().map { it.messageId }.toSet()
    loaded.distinctBy { it.id }.filterNot { it.id in hiddenIds }
}

private suspend fun setDirectMessageFavorite(userId: String, messageId: String, favorite: Boolean) = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла.")
    val encodedUser = URLEncoder.encode(userId, "UTF-8")
    val encodedMessage = URLEncoder.encode(messageId, "UTF-8")
    val url = if (favorite) {
        "${BuildConfig.SUPABASE_URL}/rest/v1/direct_message_favorites"
    } else {
        "${BuildConfig.SUPABASE_URL}/rest/v1/direct_message_favorites?user_id=eq.$encodedUser&message_id=eq.$encodedMessage"
    }
    val connection = URL(url).openConnection() as HttpURLConnection
    try {
        connection.requestMethod = if (favorite) "POST" else "DELETE"
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("Prefer", "return=minimal")
        if (favorite) {
            connection.doOutput = true
            val body = JSONObject().put("message_id", messageId).put("user_id", userId).toString()
            connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        }
        if (connection.responseCode !in 200..299) throw IllegalStateException("Не удалось изменить избранное.")
    } finally { connection.disconnect() }
}

private suspend fun setDirectMessagePin(userId: String, messageId: String, pinned: Boolean) = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла.")
    val encodedUser = URLEncoder.encode(userId, "UTF-8")
    val encodedMessage = URLEncoder.encode(messageId, "UTF-8")
    val url = if (pinned) {
        "${BuildConfig.SUPABASE_URL}/rest/v1/direct_message_pins"
    } else {
        "${BuildConfig.SUPABASE_URL}/rest/v1/direct_message_pins?user_id=eq.$encodedUser&message_id=eq.$encodedMessage"
    }
    val connection = URL(url).openConnection() as HttpURLConnection
    try {
        connection.requestMethod = if (pinned) "POST" else "DELETE"
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("Prefer", "return=minimal")
        if (pinned) {
            connection.doOutput = true
            val body = JSONObject().put("message_id", messageId).put("user_id", userId).toString()
            connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        }
        if (connection.responseCode !in 200..299) throw IllegalStateException("Не удалось изменить закрепление сообщения.")
    } finally { connection.disconnect() }
}

private suspend fun setDirectMessageReaction(userId: String, messageId: String, emoji: String, currentEmoji: String?) = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла.")
    val encodedMessage = URLEncoder.encode(messageId, "UTF-8")
    val encodedUser = URLEncoder.encode(userId, "UTF-8")
    val connection = if (currentEmoji == emoji) {
        URL("${BuildConfig.SUPABASE_URL}/rest/v1/direct_message_reactions?message_id=eq.$encodedMessage&user_id=eq.$encodedUser")
            .openConnection() as HttpURLConnection
    } else {
        URL("${BuildConfig.SUPABASE_URL}/rest/v1/direct_message_reactions?on_conflict=message_id%2Cuser_id")
            .openConnection() as HttpURLConnection
    }
    try {
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("Prefer", "resolution=merge-duplicates,return=minimal")
        if (currentEmoji == emoji) {
            connection.requestMethod = "DELETE"
        } else {
            connection.requestMethod = "POST"
            connection.doOutput = true
            val body = JSONObject()
                .put("message_id", messageId)
                .put("user_id", userId)
                .put("emoji", emoji)
                .toString()
            connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        }
        if (connection.responseCode !in 200..299) {
            val error = try { connection.errorStream?.bufferedReader()?.use { it.readText() } } catch (_: Exception) { null }
            throw IllegalStateException(error?.take(180) ?: "Не удалось сохранить реакцию.")
        }
    } finally { connection.disconnect() }
}

private suspend fun markIncomingMessagesRead(userId: String, peerId: String) = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken ?: return@withContext
    val encodedUserId = URLEncoder.encode(userId, "UTF-8")
    val encodedPeerId = URLEncoder.encode(peerId, "UTF-8")
    val url = "${BuildConfig.SUPABASE_URL}/rest/v1/direct_messages?sender_id=eq.$encodedPeerId&recipient_id=eq.$encodedUserId&read_at=is.null"
    val connection = URL(url).openConnection() as HttpURLConnection
    try {
        connection.requestMethod = "PATCH"
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.doOutput = true
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("Prefer", "return=minimal")
        val body = JSONObject().put("read_at", java.time.Instant.now().toString()).toString()
        connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        val responseCode = connection.responseCode
        if (responseCode !in 200..299) {
            val detail = try {
                connection.errorStream?.bufferedReader()?.use { it.readText() }
            } catch (_: Exception) {
                null
            }
            throw IllegalStateException(
                detail?.takeIf { it.isNotBlank() }?.take(180)
                    ?: "Не удалось отметить сообщения прочитанными ($responseCode)."
            )
        }
    } finally { connection.disconnect() }
}

private suspend fun loadSocialPrivacySettings(userId: String): JSONObject = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken ?: error("Сессия истекла.")
    val connection = URL("${BuildConfig.SUPABASE_URL}/rest/v1/profile_privacy_settings?owner_id=eq.$userId&select=*").openConnection() as HttpURLConnection
    try {
        connection.connectTimeout = 10000
        connection.readTimeout = 15000
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        val rows = JSONArray(stream?.bufferedReader()?.use { it.readText() }.orEmpty())
        if (rows.length() > 0) rows.getJSONObject(0) else JSONObject()
            .put("public_album_visible", true).put("video_album_visible", true)
            .put("comments_visible", true).put("feed_posts_visible", true)
    } finally { connection.disconnect() }
}

private suspend fun saveSocialPrivacySettings(userId: String, settings: JSONObject) = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken ?: error("Сессия истекла.")
    val connection = URL("${BuildConfig.SUPABASE_URL}/rest/v1/profile_privacy_settings?on_conflict=owner_id").openConnection() as HttpURLConnection
    try {
        connection.requestMethod = "POST"
        connection.connectTimeout = 10000
        connection.readTimeout = 15000
        connection.doOutput = true
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("Prefer", "resolution=merge-duplicates,return=minimal")
        val body = JSONObject(settings.toString()).put("owner_id", userId)
            .put("updated_at", java.time.Instant.now().toString()).toString()
        connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        if (connection.responseCode !in 200..299) error("Не удалось сохранить настройки.")
    } finally { connection.disconnect() }
}

private suspend fun loadCurrentProfile(userId: String): ProfileDto? = floustreamClient.from("profiles").select {
    filter { eq("id", userId) }
}.decodeList<ProfileDto>().firstOrNull()

private suspend fun loadSocialPosts(userId: String): List<SocialPostDto> =
    floustreamClient.from("posts").select {
        filter { eq("user_id", userId) }
    }.decodeList<SocialPostDto>().sortedByDescending { it.createdAt.orEmpty() }.take(50)

private suspend fun loadSocialFeed(): List<SocialFeedItem> {
    val posts = floustreamClient.from("posts").select()
        .decodeList<SocialPostDto>()
        .sortedByDescending { it.createdAt.orEmpty() }
        .take(100)
    if (posts.isEmpty()) return emptyList()
    val authorIds = posts.map { it.userId }.distinct()
    val authors = floustreamClient.from("profiles").select {
        filter { isIn("id", authorIds) }
    }.decodeList<ProfileDto>().associateBy { it.id }
    return posts.map { SocialFeedItem(it, authors[it.userId]) }
}

private suspend fun createSocialPost(userId: String, content: String) {
    floustreamClient.from("posts").insert(NewSocialPost(userId = userId, content = content))
}

private suspend fun loadMutualFriends(userId: String): List<ProfileDto> {
    val sent = floustreamClient.from("friend_requests").select {
        filter { eq("requester_id", userId); eq("status", "accepted") }
    }.decodeList<FriendRequestDto>()
    val received = floustreamClient.from("friend_requests").select {
        filter { eq("recipient_id", userId); eq("status", "accepted") }
    }.decodeList<FriendRequestDto>()
    val friendIds = (sent.map { it.recipientId } + received.map { it.requesterId }).distinct()
    if (friendIds.isEmpty()) return emptyList()
    return floustreamClient.from("profiles").select {
        filter { isIn("id", friendIds) }
    }.decodeList<ProfileDto>().filter { !it.isDeleted }
}

private suspend fun sendFriendRequest(userId: String, recipientId: String) {
    val ordered = listOf(userId, recipientId).sorted()
    floustreamClient.from("friend_requests").insert(
        NewFriendRequest(
            requesterId = userId,
            recipientId = recipientId,
            userLowId = ordered.first(),
            userHighId = ordered.last()
        )
    )
}

private suspend fun loadIncomingFriendRequests(userId: String): List<Pair<FriendRequestDto, ProfileDto>> {
    val requests = floustreamClient.from("friend_requests").select {
        filter { eq("recipient_id", userId); eq("status", "pending") }
    }.decodeList<FriendRequestDto>()
    if (requests.isEmpty()) return emptyList()
    val requesterIds = requests.map { it.requesterId }.distinct()
    val profiles = floustreamClient.from("profiles").select {
        filter { isIn("id", requesterIds) }
    }.decodeList<ProfileDto>().associateBy { it.id }
    return requests.mapNotNull { request ->
        profiles[request.requesterId]?.let { request to it }
    }
}

private suspend fun respondToFriendRequest(userId: String, requestId: String, accept: Boolean) {
    if (accept) {
        floustreamClient.from("friend_requests").update(
            { set("status", "accepted") }
        ) {
            filter {
                eq("id", requestId)
                eq("recipient_id", userId)
                eq("status", "pending")
            }
        }
    } else {
        floustreamClient.from("friend_requests").delete {
            filter {
                eq("id", requestId)
                eq("recipient_id", userId)
                eq("status", "pending")
            }
        }
    }
}

private suspend fun sendDirectAttachment(userId: String, peerId: String, path: String, name: String, mime: String) {
    // A successful Storage upload is the authoritative upload result. Do not
    // make sending depend on an extra signed-URL request: URL signing is only
    // needed when the recipient renders the attachment.
    floustreamClient.from("direct_messages").insert(
        NewDirectMessage(senderId = userId, recipientId = peerId, content = name, attachmentPath = path, attachmentName = name, attachmentMime = mime)
    )
}

private suspend fun sendDirectMessage(userId: String, peerId: String, content: String, replyToMessageId: String? = null) {
    floustreamClient.from("direct_messages").insert(
        NewDirectMessage(senderId = userId, recipientId = peerId, content = content, replyToMessageId = replyToMessageId)
    )
}

private suspend fun forwardDirectMessage(context: Context, userId: String, peerId: String, message: DirectMessageDto) = withContext(Dispatchers.IO) {
    val forwardedText = "Переслано:\\n" + message.content
    val sourcePath = message.attachmentPath
    if (sourcePath.isNullOrBlank()) {
        sendDirectMessage(userId, peerId, forwardedText)
        return@withContext
    }
    val originalName = message.attachmentName ?: "attachment"
    val mime = message.attachmentMime ?: "application/octet-stream"
    val signedUrl = floustreamClient.storage.from("message-media").createSignedUrl(sourcePath, 10.minutes)
    val safeName = originalName.replace(Regex("[^A-Za-z0-9._-]"), "_").take(100).ifBlank { "attachment" }
    val targetPath = "$userId/${UUID.randomUUID()}_forwarded_$safeName"
    if (mime.startsWith("video/")) {
        val draftKey = "forward_video_${UUID.randomUUID()}.mp4"
        val draftsDir = File(context.filesDir, "video-drafts").apply { mkdirs() }
        val persistentVideo = File(draftsDir, draftKey)
        val connection = URL(signedUrl).openConnection() as HttpURLConnection
        try {
            connection.connectTimeout = 15000
            connection.readTimeout = 60000
            connection.inputStream.use { input ->
                persistentVideo.outputStream().buffered().use { output ->
                    val buffer = ByteArray(256 * 1024)
                    var total = 0L
                    while (true) {
                        val read = input.read(buffer)
                        if (read < 0) break
                        total += read
                        if (total > 50L * 1024L * 1024L) error("Вложение больше 50 МБ — пересылка отменена.")
                        output.write(buffer, 0, read)
                    }
                }
            }
            if (persistentVideo.length() <= 0L) error("Пересылаемое видео пустое или недоступно.")
            val prefs = context.getSharedPreferences("floustream_video_drafts", Context.MODE_PRIVATE)
            val saved = prefs.edit()
                .putString(draftKey, targetPath)
                .putString("${draftKey}_peer", peerId)
                .putString("${draftKey}_name", originalName)
                .putString("${draftKey}_mime", mime)
                .putBoolean("${draftKey}_round", false)
                .commit()
            if (!saved) error("Не удалось сохранить очередь пересылки видео.")
            enqueueVideoUploadWorker(context, userId, peerId, persistentVideo, draftKey, targetPath, originalName, mime)
            RoundVideoDiagnostics.record(context, "forwarded video copied to persistent draft and queued; bytes=${persistentVideo.length()}")
        } catch (error: Exception) {
            persistentVideo.delete()
            throw error
        } finally {
            connection.disconnect()
        }
        return@withContext
    } else {
        val connection = URL(signedUrl).openConnection() as HttpURLConnection
        val bytes = try {
            connection.connectTimeout = 15000
            connection.readTimeout = 60000
            connection.inputStream.use { it.readBytes() }
        } finally {
            connection.disconnect()
        }
        if (bytes.size > 50 * 1024 * 1024) error("Вложение больше 50 МБ — пересылка отменена.")
        floustreamClient.storage.from("message-media").upload(targetPath, bytes) {
            contentType = ContentType.parse(mime.ifBlank { "application/octet-stream" })
        }
    }
    sendDirectAttachment(userId, peerId, targetPath, originalName, mime)
}

private suspend fun editDirectMessage(userId: String, messageId: String, content: String) = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла. Войди в аккаунт ещё раз.")
    val encodedId = URLEncoder.encode(messageId, "UTF-8")
    val connection = URL("${BuildConfig.SUPABASE_URL}/rest/v1/direct_messages?id=eq.$encodedId&sender_id=eq.$userId")
        .openConnection() as HttpURLConnection
    try {
        val formatter = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }
        val body = JSONObject().put("content", content.trim()).put("edited_at", formatter.format(java.util.Date())).toString()
        connection.requestMethod = "PATCH"
        connection.doOutput = true
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("Prefer", "return=representation")
        connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        val responseCode = connection.responseCode
        if (responseCode !in 200..299) throw IllegalStateException("Не удалось изменить сообщение.")
        val updated = JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
        if (updated.length() == 0) throw IllegalStateException("Сообщение не изменено: проверь права доступа.")
    } finally {
        connection.disconnect()
    }
}

private suspend fun hideDirectMessage(userId: String, messageId: String) {
    floustreamClient.from("direct_message_hidden").insert(
        NewHiddenDirectMessage(messageId = messageId, userId = userId)
    )
}

private suspend fun deleteDirectMessage(userId: String, messageId: String) = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла. Войди в аккаунт ещё раз.")
    val encodedId = URLEncoder.encode(messageId, "UTF-8")
    val connection = URL("${BuildConfig.SUPABASE_URL}/rest/v1/direct_messages?id=eq.$encodedId&sender_id=eq.$userId")
        .openConnection() as HttpURLConnection
    try {
        connection.requestMethod = "DELETE"
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Prefer", "return=representation")
        val responseCode = connection.responseCode
        if (responseCode !in 200..299) {
            throw IllegalStateException("Не удалось удалить сообщение.")
        }
        // A 2xx response with zero affected rows can mean RLS blocked the delete
        // or the row was already gone. Confirm the server actually removed it.
        val deletedRows = JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
        if (deletedRows.length() == 0) {
            throw IllegalStateException("Сообщение не удалено. Проверь права доступа и попробуй ещё раз.")
        }
    } finally {
        connection.disconnect()
    }
}

private suspend fun loadInboxThreads(
    userId: String,
    existingThreads: List<ChatThread> = emptyList(),
    fullHistory: Boolean = true
): List<ChatThread> {
    // Do a complete paged scan on first load / returning to the inbox. During
    // foreground polling fetch only the newest page and merge it into the cache.
    // This avoids downloading a user's entire message history every five seconds.
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия истекла.")
    val encodedUserId = URLEncoder.encode(userId, "UTF-8")
    val columns = "id,sender_id,recipient_id,content,created_at,read_at,attachment_path,attachment_name,attachment_mime,reply_to_message_id,edited_at"

    suspend fun fetchDirection(column: String): List<DirectMessageDto> = withContext(Dispatchers.IO) {
        val result = mutableListOf<DirectMessageDto>()
        var offset = 0
        val pageSize = 500
        while (true) {
            val url = "${BuildConfig.SUPABASE_URL}/rest/v1/direct_messages?select=$columns&$column=eq.$encodedUserId&order=created_at.desc,id.desc&limit=$pageSize&offset=$offset"
            val rows = withTransientNetworkRetry {
                val connection = URL(url).openConnection() as HttpURLConnection
                try {
                    connection.requestMethod = "GET"
                    connection.connectTimeout = 20000
                    connection.readTimeout = 30000
                    connection.setRequestProperty("Connection", "close")
                    connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                    connection.setRequestProperty("Authorization", "Bearer $token")
                    val code = connection.responseCode
                    if (code !in 200..299) {
                        val detail = connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
                        if (code in 500..599) throw IOException("Не удалось загрузить список чатов (HTTP $code). ${detail.take(180)}")
                        throw IllegalStateException("Не удалось загрузить список чатов ($code). ${detail.take(180)}")
                    }
                    val payload = JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
                    (0 until payload.length()).map { index ->
                        val row = payload.getJSONObject(index)
                        fun nullable(name: String): String? =
                            if (row.isNull(name)) null else row.optString(name).takeIf { it.isNotBlank() }
                        DirectMessageDto(
                            id = row.getString("id"),
                            senderId = row.getString("sender_id"),
                            recipientId = row.getString("recipient_id"),
                            content = row.optString("content"),
                            createdAt = row.getString("created_at"),
                            readAt = nullable("read_at"),
                            attachmentPath = nullable("attachment_path"),
                            attachmentName = nullable("attachment_name"),
                            attachmentMime = nullable("attachment_mime"),
                            replyToMessageId = nullable("reply_to_message_id"),
                            editedAt = nullable("edited_at")
                        )
                    }
                } finally {
                    connection.disconnect()
                }
            }
            result.addAll(rows)
            if (!fullHistory || rows.size < pageSize) break
            offset += rows.size
        }
        result
    }

    val sent = fetchDirection("sender_id")
    val received = fetchDirection("recipient_id")
    val rows = (sent + received).distinctBy { it.id }
    val existingByPeer = existingThreads.associateBy { it.peer.id }
    val peerIds = (rows.map {
        if (it.senderId == userId) it.recipientId else it.senderId
    } + if (fullHistory) emptyList() else existingThreads.map { it.peer.id }).distinct()

    return peerIds.mapNotNull { peerId ->
        val existing = existingByPeer[peerId]
        val profile = existing?.peer ?: (withTransientNetworkRetry {
            floustreamClient.from("profiles").select {
                filter { eq("id", peerId) }
            }.decodeList<ProfileDto>().firstOrNull()
        } ?: ProfileDto(id = peerId, displayName = "Удалённый аккаунт", isDeleted = true))

        val conversation = rows.filter {
            (it.senderId == userId && it.recipientId == peerId) ||
                (it.senderId == peerId && it.recipientId == userId)
        }
        val fetchedLatest = conversation.maxWithOrNull(
            compareBy<DirectMessageDto> { it.createdAt }.thenBy { it.id }
        )
        if (fetchedLatest == null && existing != null) return@mapNotNull existing
        val latest = listOfNotNull(existing?.lastMessage, fetchedLatest).maxWithOrNull(
            compareBy<DirectMessageDto> { it.createdAt }.thenBy { it.id }
        ) ?: return@mapNotNull null

        val unread = if (fullHistory || existing == null) {
            conversation.count {
                it.senderId == peerId && it.recipientId == userId && it.readAt == null
            }
        } else {
            val previousLatest = existing.lastMessage
            val unreadDelta = conversation.count {
                it.senderId == peerId && it.recipientId == userId && it.readAt == null &&
                    compareValuesBy(it, previousLatest, { message -> message.createdAt }, { message -> message.id }) > 0
            }
            existing.unread + unreadDelta
        }
        ChatThread(profile, latest, unread)
    }.sortedWith(
        compareByDescending<ChatThread> { it.lastMessage.createdAt }
            .thenByDescending { it.lastMessage.id }
    )
}
private suspend fun checkRegistrationRisk(email: String): Pair<String, String> = withContext(Dispatchers.IO) {
    val connection = URL("${BuildConfig.SUPABASE_URL}/functions/v1/registration-risk")
        .openConnection() as HttpURLConnection
    try {
        connection.requestMethod = "POST"
        connection.connectTimeout = 8000
        connection.readTimeout = 8000
        connection.doOutput = true
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Content-Type", "application/json")
        connection.outputStream.use {
            it.write(JSONObject().put("email", email).toString().toByteArray(Charsets.UTF_8))
        }
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        val result = JSONObject(stream?.bufferedReader()?.use { it.readText() }.orEmpty())
        if (connection.responseCode !in 200..299 || !result.optBoolean("allowed", false)) {
            throw IllegalStateException("Временные почтовые адреса не поддерживаются. Используй постоянный email.")
        }
        Pair(result.optString("risk", "review"), result.optString("reason", "risk_check_unavailable"))
    } finally { connection.disconnect() }
}

private suspend fun sendAccountEmailLink(email: String, action: String) = withContext(Dispatchers.IO) {
    val redirect = "dolby404://auth-callback?" + if (action == "request_delete") "confirm_delete=1" else "restore=1"
    val encodedRedirect = URLEncoder.encode(redirect, "UTF-8")
    val connection = URL("${BuildConfig.SUPABASE_URL}/auth/v1/otp?redirect_to=$encodedRedirect")
        .openConnection() as HttpURLConnection
    try {
        connection.requestMethod = "POST"
        connection.connectTimeout = 12000
        connection.readTimeout = 12000
        connection.doOutput = true
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Content-Type", "application/json")
        val body = JSONObject().put("email", email).put("create_user", false).toString()
        connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        if (connection.responseCode !in 200..299) {
            val detail = connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
            throw IllegalStateException("Не удалось отправить письмо. $detail")
        }
    } finally { connection.disconnect() }
}

private suspend fun callAccountLifecycle(action: String): String = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken
        ?: throw IllegalStateException("Сессия подтверждения не найдена. Открой ссылку из письма ещё раз.")
    val connection = URL("${BuildConfig.SUPABASE_URL}/functions/v1/account-lifecycle")
        .openConnection() as HttpURLConnection
    try {
        connection.requestMethod = "POST"
        connection.connectTimeout = 12000
        connection.readTimeout = 15000
        connection.doOutput = true
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.outputStream.use { it.write(JSONObject().put("action", action).toString().toByteArray(Charsets.UTF_8)) }
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        val response = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
        if (connection.responseCode !in 200..299) {
            val errorMessage = try { JSONObject(response).optString("error", "Не удалось выполнить действие.") }
                catch (_: Exception) { "Не удалось выполнить действие." }
            throw IllegalStateException(errorMessage)
        }
        response
    } finally { connection.disconnect() }
}

@Composable
private fun MessengerApp(
    pendingLifecycleAction: String?,
    notificationPeerId: String?,
    onLifecycleHandled: () -> Unit,
    onNotificationHandled: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var countryCode by remember { mutableStateOf("DE") }
    var username by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var signedIn by remember { mutableStateOf(false) }
    var authReady by remember { mutableStateOf(false) }
    var isRegistering by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("Войди с тем же аккаунтом, что используешь на сайте FLOUSTREAM.") }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { }

    LaunchedEffect(signedIn) {
        if (signedIn && Build.VERSION.SDK_INT >= 33 &&
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    // Re-register the latest FCM token whenever the app returns to the foreground.
    // This also picks up tokens refreshed while the app was in the background.
    DisposableEffect(signedIn, lifecycleOwner) {
        val userId = floustreamClient.auth.currentUserOrNull()?.id
        if (!signedIn || userId.isNullOrBlank()) {
            onDispose { }
        } else {
            val observer = LifecycleEventObserver { _, event ->
                if (event == Lifecycle.Event.ON_RESUME) registerFcmToken(context, userId)
            }
            lifecycleOwner.lifecycle.addObserver(observer)
            registerFcmToken(context, userId)
            onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
        }
    }

    LaunchedEffect(pendingLifecycleAction) {
        val action = pendingLifecycleAction ?: return@LaunchedEffect
        var attempts = 0
        while (floustreamClient.auth.currentSessionOrNull() == null && attempts < 20) {
            delay(250)
            attempts++
        }
        try {
            if (floustreamClient.auth.currentSessionOrNull() == null) error("Не удалось открыть подтверждённую сессию.")
            callAccountLifecycle(action)
            if (action == "request_delete") {
                Toast.makeText(context, "Аккаунт деактивирован. Его можно восстановить в течение 30 дней.", Toast.LENGTH_LONG).show()
                floustreamClient.auth.signOut()
                signedIn = false
            } else {
                Toast.makeText(context, "Прежний аккаунт восстановлен.", Toast.LENGTH_LONG).show()
                signedIn = true
            }
        } catch (e: Exception) {
            Toast.makeText(context, e.message ?: "Не удалось подтвердить действие.", Toast.LENGTH_LONG).show()
        } finally { onLifecycleHandled() }
    }

    // Restore the saved Supabase session before deciding which screen to show.
    // Closing the app or removing it from Recents must not sign the user out.
    LaunchedEffect(Unit) {
        floustreamClient.auth.sessionStatus.collect { status ->
            when (status) {
                is SessionStatus.Authenticated -> {
                    signedIn = true
                    authReady = true
                }
                is SessionStatus.NotAuthenticated -> {
                    signedIn = false
                    authReady = true
                }
                SessionStatus.Initializing -> {
                    authReady = false
                }
                is SessionStatus.RefreshFailure -> {
                    authReady = true
                    signedIn = floustreamClient.auth.currentSessionOrNull() != null
                }
            }
        }
    }

    fun submitAuth() {
        if (busy || email.isBlank() || password.isBlank()) return
        if (isRegistering && password.length < 8) {
            message = "Пароль должен содержать минимум 8 символов."
            return
        }
        if (isRegistering && (firstName.isBlank() || lastName.isBlank() || countryCode.trim().length != 2)) {
            message = "Укажи имя, фамилию и двухбуквенный код страны (например DE или RU)."
            return
        }
        val normalizedUsername = username.trim().removePrefix("@").lowercase()
        if (isRegistering && !normalizedUsername.matches(Regex("[a-z0-9_]{3,24}"))) {
            message = "Имя пользователя: 3–24 символа, только латинские буквы, цифры и _."
            return
        }
        scope.launch {
            busy = true
            message = if (isRegistering) "Создаём аккаунт FLOUSTREAM..." else "Подключаемся к FLOUSTREAM..."
            try {
                if (isRegistering) {
                    val (registrationRisk, registrationRiskReason) = checkRegistrationRisk(email.trim())
                    val normalizedCountry = countryCode.trim().uppercase()
                    val defaultLanguage = if (normalizedCountry in setOf("RU", "BY", "KZ", "KG")) "ru" else "en"
                    floustreamClient.auth.signUpWith(Email) {
                        this.email = email.trim()
                        this.password = password
                        data = buildJsonObject {
                            put("first_name", firstName.trim())
                            put("last_name", lastName.trim())
                            put("username", normalizedUsername)
                            put("country_code", normalizedCountry)
                            put("preferred_language", defaultLanguage)
                            put("display_name", firstName.trim() + " " + lastName.trim())
                            put("registration_risk", registrationRisk)
                            put("registration_risk_reason", registrationRiskReason)
                        }
                    }
                    if (floustreamClient.auth.currentSessionOrNull() != null) {
                        signedIn = true
                        message = "Регистрация успешна!"
                    } else {
                        message = "Аккаунт создан! Проверь почту и подтверди email. После подтверждения войди здесь с теми же данными, что и на сайте."
                    }
                } else {
                    withTransientNetworkRetry {
                        floustreamClient.auth.signInWith(Email) {
                            this.email = email.trim()
                            this.password = password
                        }
                    }
                    signedIn = true
                    message = "Авторизация успешна."
                }
            } catch (e: Exception) {
                val errorText = e.message.orEmpty()
                message = when {
                    errorText.contains("username", ignoreCase = true) &&
                        (errorText.contains("duplicate", ignoreCase = true) || errorText.contains("unique", ignoreCase = true) || errorText.contains("23505")) ->
                        "Это имя пользователя уже занято. Выбери другое."
                    errorText.contains("username_invalid_format", ignoreCase = true) ->
                        "Имя пользователя должно содержать 3–24 символа: латинские буквы, цифры или _."
                    !isRegistering && isTransientNetworkFailure(e) ->
                        "Не удалось связаться с сервером входа. Проверь интернет или попробуй другую сеть. Повторные попытки уже выполнены; пароль и аккаунт не изменены."
                    else -> e.message ?: if (isRegistering) "Не удалось зарегистрироваться." else "Не удалось войти. Проверь данные."
                }
            } finally {
                busy = false
            }
        }
    }

    Box(
        Modifier.fillMaxSize().background(
            Brush.linearGradient(listOf(Color(0xFF050817), Color(0xFF102B83), Color(0xFF5420A8), Night))
        ),
        contentAlignment = Alignment.Center
    ) {
        if (!authReady) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = Blue)
                Spacer(Modifier.height(14.dp))
                Text("Восстанавливаем сессию FLOUSTREAM…", color = White, fontSize = 14.sp)
            }
        } else if (signedIn) {
            MessengerHome(
                notificationPeerId = notificationPeerId,
                onNotificationHandled = onNotificationHandled,
                onDeleteAccount = {
                    val accountEmail = floustreamClient.auth.currentUserOrNull()?.email
                    if (accountEmail.isNullOrBlank()) {
                        Toast.makeText(context, "Не удалось определить email аккаунта.", Toast.LENGTH_LONG).show()
                    } else {
                        scope.launch {
                            busy = true
                            try {
                                sendAccountEmailLink(accountEmail, "request_delete")
                                Toast.makeText(context, "Письмо отправлено на $accountEmail. Открой ссылку, чтобы подтвердить удаление.", Toast.LENGTH_LONG).show()
                            } catch (e: Exception) {
                                Toast.makeText(context, e.message ?: "Не удалось отправить письмо.", Toast.LENGTH_LONG).show()
                            } finally { busy = false }
                        }
                    }
                },
                onSignOut = {
                    scope.launch {
                        busy = true
                        try {
                            floustreamClient.auth.signOut()
                            signedIn = false
                            message = "Ты вышел из аккаунта."
                        } catch (e: Exception) {
                            message = e.message ?: "Не удалось выйти."
                        } finally { busy = false }
                    }
                }
            )
        } else {
            Surface(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                shape = RoundedCornerShape(28.dp),
                color = Color(0xF0111830)
            ) {
                Column(
                    Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text("FLOUSTREAM", fontSize = 30.sp, fontWeight = FontWeight.Black, color = White)
                    Text("MESSENGER", fontSize = 13.sp, letterSpacing = 5.sp, color = Color(0xFF9FCBFF))
                    Spacer(Modifier.height(12.dp))
                    Text(
                        if (isRegistering) "СОЗДАТЬ АККАУНТ" else "ЕДИНЫЙ АККАУНТ С САЙТОМ",
                        fontSize = 12.sp, letterSpacing = 1.5.sp, color = Color(0xFF9FCBFF)
                    )
                    Spacer(Modifier.height(22.dp))
                    OutlinedTextField(
                        value = email, onValueChange = { email = it },
                        modifier = Modifier.fillMaxWidth(), label = { Text("Email") }, singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                    )
                    Spacer(Modifier.height(12.dp))
                    if (isRegistering) {
                        Spacer(Modifier.height(12.dp))
                        OutlinedTextField(
                            value = username, onValueChange = { username = it.lowercase().filter { ch -> ch in 'a'..'z' || ch in '0'..'9' || ch == '_' }.take(24) },
                            modifier = Modifier.fillMaxWidth(), label = { Text("@Имя пользователя") }, singleLine = true,
                            supportingText = { Text("Уникальное имя для поиска. 3–24 символа: a–z, 0–9 и _") }
                        )
                        Spacer(Modifier.height(8.dp))
                        OutlinedTextField(
                            value = firstName, onValueChange = { firstName = it },
                            modifier = Modifier.fillMaxWidth(), label = { Text("Имя") }, singleLine = true
                        )
                        Spacer(Modifier.height(10.dp))
                        OutlinedTextField(
                            value = lastName, onValueChange = { lastName = it },
                            modifier = Modifier.fillMaxWidth(), label = { Text("Фамилия") }, singleLine = true
                        )
                        Spacer(Modifier.height(10.dp))
                        OutlinedTextField(
                            value = countryCode, onValueChange = { countryCode = it.take(2).uppercase() },
                            modifier = Modifier.fillMaxWidth(), label = { Text("Код страны (DE, RU, US)") }, singleLine = true
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = password, onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text(if (isRegistering) "Пароль (минимум 8 символов)" else "Пароль") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { submitAuth() })
                    )
                    Spacer(Modifier.height(20.dp))
                    Button(
                        onClick = { submitAuth() },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        enabled = !busy && email.isNotBlank() && password.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = Blue),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        if (busy) CircularProgressIndicator(color = White, modifier = Modifier.size(22.dp))
                        else Text(if (isRegistering) "ЗАРЕГИСТРИРОВАТЬСЯ" else "ВОЙТИ В АККАУНТ", fontWeight = FontWeight.Bold)
                    }
                    TextButton(
                        onClick = {
                            if (busy || email.isBlank()) {
                                message = "Введи email прежнего аккаунта для восстановления."
                            } else {
                                scope.launch {
                                    busy = true
                                    try {
                                        sendAccountEmailLink(email.trim(), "restore")
                                        message = "Если аккаунт ожидает удаления, письмо для восстановления отправлено."
                                    } catch (e: Exception) {
                                        message = e.message ?: "Не удалось отправить письмо."
                                    } finally { busy = false }
                                }
                            }
                        },
                        enabled = !busy && email.isNotBlank()
                    ) { Text("Восстановить аккаунт по email", color = Color(0xFF9FCBFF)) }
                    TextButton(
                        onClick = {
                            isRegistering = !isRegistering
                            message = if (isRegistering) "Войди с существующим аккаунтом FLOUSTREAM." else "Создай аккаунт. Он будет работать и на сайте, и в приложении."
                        },
                        enabled = !busy
                    ) {
                        Text(
                            if (isRegistering) "Уже есть аккаунт? Войти" else "Нет аккаунта? Зарегистрироваться",
                            color = Color(0xFF9FCBFF)
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(message, color = Color(0xFFB9D9FF), fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun MessengerHome(
    onSignOut: () -> Unit,
    onDeleteAccount: () -> Unit,
    notificationPeerId: String?,
    onNotificationHandled: () -> Unit
) {
    var tab by remember { mutableStateOf("Чаты") }
    var selectedProfile by remember { mutableStateOf<ProfileDto?>(null) }
    val currentUserId = floustreamClient.auth.currentUserOrNull()?.id.orEmpty()
    var searchOpen by remember { mutableStateOf(false) }
    var search by remember { mutableStateOf("") }
    var infoMessage by remember { mutableStateOf("") }
    var socialOpen by remember { mutableStateOf(false) }
    var socialDrawerOpen by remember { mutableStateOf(false) }
    var socialSection by remember { mutableStateOf("Моя страница") }

    LaunchedEffect(notificationPeerId, currentUserId) {
        val peerId = notificationPeerId?.takeIf { it.isNotBlank() } ?: return@LaunchedEffect
        if (peerId == currentUserId) {
            onNotificationHandled()
            return@LaunchedEffect
        }
        try {
            var peer: ProfileDto? = null
            var lastError: Exception? = null
            // A push can wake the radio before the first Supabase request is ready.
            // Retry the recipient lookup quietly instead of showing a false error dialog.
            repeat(3) { attempt ->
                if (peer == null) {
                    try {
                        peer = floustreamClient.from("profiles").select {
                            filter { eq("id", peerId) }
                        }.decodeList<ProfileDto>().firstOrNull()
                    } catch (e: Exception) {
                        if (e is kotlinx.coroutines.CancellationException) throw e
                        lastError = e
                    }
                    if (peer == null && attempt < 2) delay(900L * (attempt + 1))
                }
            }
            if (peer != null) {
                tab = "Чаты"
                socialOpen = false
                socialDrawerOpen = false
                selectedProfile = peer
            } else if (lastError != null) {
                infoMessage = "Не удалось открыть переписку. Проверь подключение и попробуй ещё раз."
            } else {
                infoMessage = "Этот собеседник больше недоступен."
            }
        } finally {
            onNotificationHandled()
        }
    }

    Surface(Modifier.fillMaxSize(), color = Night) {
        Column(Modifier.fillMaxSize()) {
            if (socialOpen) {
                SocialNetworkScreen(
                    currentUserId = currentUserId,
                    section = socialSection,
                    onOpenDrawer = { socialDrawerOpen = true },
                    onBackToMessenger = { socialOpen = false; socialDrawerOpen = false }
                )
                if (socialDrawerOpen) {
                    Box(Modifier.fillMaxSize()) {
                        Spacer(Modifier.fillMaxSize().background(Color(0x99000000)).clickable { socialDrawerOpen = false })
                        Column(Modifier.align(Alignment.CenterStart).fillMaxHeight().width(304.dp).background(Panel).padding(18.dp)) {
                            Text("FLOUSTREAM", color = White, fontSize = 21.sp, fontWeight = FontWeight.Black)
                            Text("СОЦИАЛЬНАЯ СЕТЬ", color = Color(0xFF9FCBFF), fontSize = 10.sp, letterSpacing = 2.sp)
                            Spacer(Modifier.height(24.dp))
                            listOf("Лента", "Моя страница", "Друзья", "Фото", "Видео", "Поиск и рекомендации", "Настройки соцсети").forEach { item ->
                                Surface(
                                    Modifier.fillMaxWidth().padding(vertical = 3.dp).clickable {
                                        socialSection = item
                                        socialDrawerOpen = false
                                    },
                                    color = if (socialSection == item) Color(0xFF263B68) else Color.Transparent,
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(item, Modifier.padding(horizontal = 14.dp, vertical = 13.dp), color = White, fontSize = 14.sp)
                                }
                            }
                            Spacer(Modifier.weight(1f))
                            HorizontalDivider(color = Color(0xFF31415E))
                            TextButton(onClick = { socialOpen = false; socialDrawerOpen = false }) {
                                Text("← Вернуться в Messenger", color = Color(0xFF9FCBFF))
                            }
                        }
                    }
                }
            } else if (selectedProfile != null) {
                RealConversationScreen(
                    peer = selectedProfile!!,
                    currentUserId = currentUserId,
                    onBack = { selectedProfile = null }
                )
            } else {
                Row(
                    Modifier.fillMaxWidth().background(
                        Brush.horizontalGradient(listOf(Color(0xFF142A59), Color(0xFF241747)))
                    ).padding(start = 20.dp, end = 16.dp, top = 18.dp, bottom = 18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("FLOUSTREAM", fontSize = 23.sp, fontWeight = FontWeight.Black, color = White, letterSpacing = 1.sp)
                        Text("MESSENGER", fontSize = 10.sp, color = Color(0xFF9FCBFF), letterSpacing = 4.sp)
                    }
                    HeaderAction("⌕") { searchOpen = !searchOpen }
                    SocialEntryButton { socialOpen = true; socialDrawerOpen = true }
                }

                if (searchOpen) {
                    OutlinedTextField(
                        value = search, onValueChange = { search = it },
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                        placeholder = { Text("Поиск чатов и сообщений…", color = Muted) },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp)
                    )
                }

                Box(Modifier.weight(1f).fillMaxWidth()) {
                when (tab) {
                    "Чаты" -> ChatsScreen(
                        currentUserId = currentUserId,
                        searchQuery = search,
                        onOpen = { selectedProfile = it }
                    )
                    "Контакты" -> ContactsScreen(onStart = { selectedProfile = it; tab = "Чаты" })
                    else -> SettingsScreen(currentUserId = currentUserId, onBack = { tab = "Чаты" }, onSignOut = onSignOut, onDeleteAccount = onDeleteAccount, onInfo = { infoMessage = it })
                }

                }

                NavigationBar(containerColor = Panel, contentColor = White) {
                    listOf("Чаты" to "▤", "Контакты" to "♙", "Настройки" to "⚙").forEach { item ->
                        NavigationBarItem(
                            selected = tab == item.first,
                            onClick = { tab = item.first; selectedProfile = null },
                            icon = { Text(item.second, fontSize = 20.sp) },
                            label = { Text(item.first, fontSize = 10.sp) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Blue,
                                selectedTextColor = Color(0xFF9FCBFF),
                                indicatorColor = Color(0xFF263B68),
                                unselectedIconColor = Muted,
                                unselectedTextColor = Muted
                            )
                        )
                    }
                }

            }
        }
    }

    if (infoMessage.isNotBlank()) {
        AlertDialog(
            onDismissRequest = { infoMessage = "" },
            containerColor = Panel,
            title = { Text("FLOUSTREAM", color = White) },
            text = { Text(infoMessage, color = Muted) },
            confirmButton = { TextButton(onClick = { infoMessage = "" }) { Text("Понятно") } }
        )
    }
}

@Composable
private fun SocialNetworkScreen(
    currentUserId: String,
    section: String,
    onOpenDrawer: () -> Unit,
    onBackToMessenger: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var profile by remember(currentUserId) { mutableStateOf<ProfileDto?>(null) }
    var posts by remember(currentUserId) { mutableStateOf<List<SocialPostDto>>(emptyList()) }
    var feedPosts by remember(currentUserId) { mutableStateOf<List<SocialFeedItem>>(emptyList()) }
    var friends by remember(currentUserId) { mutableStateOf<List<ProfileDto>>(emptyList()) }
    var incomingFriendRequests by remember(currentUserId) { mutableStateOf<List<Pair<FriendRequestDto, ProfileDto>>>(emptyList()) }
    var friendActionBusyId by remember { mutableStateOf<String?>(null) }
    var publicMedia by remember(currentUserId) { mutableStateOf<List<Pair<MediaLibraryItem, String>>>(emptyList()) }
    var searchText by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<ProfileDto>>(emptyList()) }
    var friendRequestStatus by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    var privacyPublicPhotos by remember(currentUserId) { mutableStateOf(true) }
    var privacyVideos by remember(currentUserId) { mutableStateOf(true) }
    var privacyComments by remember(currentUserId) { mutableStateOf(true) }
    var privacyFeed by remember(currentUserId) { mutableStateOf(true) }
    var privacySaving by remember { mutableStateOf(false) }
    var privacyStatus by remember { mutableStateOf("") }
    var loading by remember(currentUserId) { mutableStateOf(true) }
    var error by remember(currentUserId) { mutableStateOf("") }

    LaunchedEffect(currentUserId, section) {
        loading = true
        error = ""
        try {
            profile = loadCurrentProfile(currentUserId)
            posts = if (section == "Моя страница") loadSocialPosts(currentUserId) else emptyList()
            feedPosts = if (section == "Лента") loadSocialFeed() else emptyList()
            friends = if (section == "Друзья") loadMutualFriends(currentUserId) else emptyList()
            incomingFriendRequests = if (section == "Друзья") loadIncomingFriendRequests(currentUserId) else emptyList()
            if (section == "Настройки соцсети") {
                val settings = loadSocialPrivacySettings(currentUserId)
                privacyPublicPhotos = settings.optBoolean("public_album_visible", true)
                privacyVideos = settings.optBoolean("video_album_visible", true)
                privacyComments = settings.optBoolean("comments_visible", true)
                privacyFeed = settings.optBoolean("feed_posts_visible", true)
            }
            publicMedia = if (section == "Фото" || section == "Видео") {
                loadPublicMediaLibrary(currentUserId)
                    .filter { if (section == "Фото") it.mime.startsWith("image/") else it.mime.startsWith("video/") }
                    .mapNotNull { item ->
                        try {
                            item to floustreamClient.storage.from(item.bucket).createSignedUrl(item.path, 60.minutes)
                        } catch (e: Exception) {
                            if (e is kotlinx.coroutines.CancellationException) throw e
                            null
                        }
                    }
            } else emptyList()
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            error = "Не удалось загрузить раздел. Проверь подключение и попробуй ещё раз."
        } finally {
            loading = false
        }
    }

    LaunchedEffect(searchText, section) {
        if (section == "Поиск и рекомендации") {
            if (searchText.trim().length < 2) searchResults = emptyList()
            else {
                delay(350)
                try { searchResults = findFloustreamUsers(searchText) }
                catch (e: Exception) {
                    if (e is kotlinx.coroutines.CancellationException) throw e
                    searchResults = emptyList()
                }
            }
        }
    }

    Column(
        Modifier.fillMaxSize().background(Night).pointerInput(section) {
            var startX = 0f
            var dragDistance = 0f
            detectHorizontalDragGestures(
                onDragStart = { start -> startX = start.x; dragDistance = 0f },
                onHorizontalDrag = { change, amount ->
                    if (startX <= 48.dp.toPx() && amount > 0f) {
                        dragDistance += amount
                        change.consume()
                    }
                },
                onDragEnd = {
                    if (startX <= 48.dp.toPx() && dragDistance >= 88.dp.toPx()) onOpenDrawer()
                    dragDistance = 0f
                },
                onDragCancel = { dragDistance = 0f }
            )
        }
    ) {
        Row(
            Modifier.fillMaxWidth().background(Brush.horizontalGradient(listOf(Color(0xFF142A59), Color(0xFF241747))))
                .padding(horizontal = 16.dp, vertical = 15.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            SocialMenuButton(onOpenDrawer)
            Column(Modifier.weight(1f).padding(start = 12.dp)) {
                Text("FLOUSTREAM", color = White, fontSize = 19.sp, fontWeight = FontWeight.Black)
                Text("СОЦИАЛЬНАЯ СЕТЬ", color = Color(0xFF9FCBFF), fontSize = 9.sp, letterSpacing = 2.sp)
            }
            TextButton(onClick = onBackToMessenger) { Text("Messenger", color = Color(0xFF9FCBFF)) }
        }
        when {
            loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Blue)
            }
            error.isNotBlank() -> Column(Modifier.fillMaxWidth().padding(20.dp)) {
                Text(error, color = Color(0xFFFF9AA8), fontSize = 13.sp)
            }
            section == "Лента" -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text("Лента публикаций", color = White, fontSize = 23.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(10.dp))
                        SocialPostComposer(currentUserId) { feedPosts = loadSocialFeed() }
                    }
                    if (feedPosts.isEmpty()) item {
                        Text("Пока нет публикаций. Здесь появятся открытые записи пользователей FLOUSTREAM.", color = Muted, fontSize = 13.sp)
                    }
                    items(feedPosts, key = { it.post.id }) { entry ->
                        val post = entry.post
                        val author = entry.author
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = Panel,
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    val authorName = author?.displayName ?: author?.username ?: "Пользователь"
                                    Avatar(authorName.take(1).uppercase(), avatarUrl = author?.avatarUrl)
                                    Spacer(Modifier.width(10.dp))
                                    Column {
                                        Text(authorName, color = White, fontWeight = FontWeight.SemiBold)
                                        Text(author?.username?.let { "@$it" } ?: "FLOUSTREAM", color = Muted, fontSize = 11.sp)
                                    }
                                }
                                post.content?.takeIf { it.isNotBlank() }?.let {
                                    Text(it, color = White, fontSize = 14.sp)
                                }
                                post.imageUrl?.takeIf { it.startsWith("https://") }?.let { url ->
                                    AsyncImage(
                                        model = url,
                                        contentDescription = "Фото публикации",
                                        modifier = Modifier.fillMaxWidth().heightIn(max = 340.dp).clip(RoundedCornerShape(6.dp)),
                                        contentScale = ContentScale.Fit
                                    )
                                }
                                post.createdAt?.let { Text(it.replace("T", " ").take(16), color = Muted, fontSize = 10.sp) }
                            }
                        }
                    }
                }
            }
            section == "Друзья" -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item { Text("Друзья", color = White, fontSize = 23.sp, fontWeight = FontWeight.Bold) }
                    if (incomingFriendRequests.isNotEmpty()) {
                        item { Text("Заявки в друзья", color = White, fontSize = 17.sp, fontWeight = FontWeight.SemiBold) }
                        items(incomingFriendRequests, key = { it.first.id }) { (request, requester) ->
                            Row(
                                Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(14.dp)).padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val requesterName = requester.displayName ?: requester.username ?: "Пользователь"
                                Avatar(requesterName.take(1).uppercase(), avatarUrl = requester.avatarUrl)
                                Spacer(Modifier.width(10.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(requesterName, color = White, fontWeight = FontWeight.SemiBold)
                                    Text(requester.username?.let { "@$it" } ?: "", color = Muted, fontSize = 11.sp)
                                }
                                TextButton(
                                    enabled = friendActionBusyId != request.id,
                                    onClick = {
                                        scope.launch {
                                            friendActionBusyId = request.id
                                            try {
                                                respondToFriendRequest(currentUserId, request.id, true)
                                                incomingFriendRequests = loadIncomingFriendRequests(currentUserId)
                                                friends = loadMutualFriends(currentUserId)
                                            } catch (_: Exception) {
                                                error = "Не удалось принять заявку. Попробуй ещё раз."
                                            } finally {
                                                friendActionBusyId = null
                                            }
                                        }
                                    }
                                ) { Text("Принять", color = Color(0xFF9FCBFF), fontSize = 11.sp) }
                                TextButton(
                                    enabled = friendActionBusyId != request.id,
                                    onClick = {
                                        scope.launch {
                                            friendActionBusyId = request.id
                                            try {
                                                respondToFriendRequest(currentUserId, request.id, false)
                                                incomingFriendRequests = loadIncomingFriendRequests(currentUserId)
                                            } catch (_: Exception) {
                                                error = "Не удалось отклонить заявку. Попробуй ещё раз."
                                            } finally {
                                                friendActionBusyId = null
                                            }
                                        }
                                    }
                                ) { Text("×", color = Color(0xFFFF9AAA), fontSize = 16.sp) }
                            }
                        }
                    }
                    if (friends.isEmpty() && incomingFriendRequests.isEmpty()) item {
                        Text("Пока нет друзей. Найди людей по @имени пользователя.", color = Muted, fontSize = 13.sp)
                    }
                    items(friends, key = { it.id }) { friend ->
                        Row(
                            Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(14.dp)).padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val name = friend.displayName ?: friend.username ?: "Пользователь"
                            Avatar(name.take(1).uppercase(), avatarUrl = friend.avatarUrl)
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(name, color = White, fontWeight = FontWeight.SemiBold)
                                Text(friend.username?.let { "@$it" } ?: "", color = Muted, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
            section == "Поиск и рекомендации" -> {
                Column(Modifier.fillMaxSize().padding(16.dp)) {
                    Text("Поиск людей", color = White, fontSize = 23.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = searchText,
                        onValueChange = { searchText = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        placeholder = { Text("@имя пользователя") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = White, unfocusedTextColor = White,
                            focusedBorderColor = Blue, unfocusedBorderColor = Muted,
                            focusedPlaceholderColor = Muted, unfocusedPlaceholderColor = Muted
                        )
                    )
                    Spacer(Modifier.height(10.dp))
                    if (searchText.trim().length < 2) Text("Введи минимум 2 символа username.", color = Muted, fontSize = 12.sp)
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(searchResults, key = { it.id }) { person ->
                            Row(
                                Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(14.dp)).padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val name = person.displayName ?: person.username ?: "Пользователь"
                                Avatar(name.take(1).uppercase(), avatarUrl = person.avatarUrl)
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(name, color = White, fontWeight = FontWeight.SemiBold)
                                    Text(person.username?.let { "@$it" } ?: "", color = Muted, fontSize = 12.sp)
                                    friendRequestStatus[person.id]?.let { Text(it, color = Muted, fontSize = 10.sp) }
                                }
                                TextButton(
                                    enabled = friendRequestStatus[person.id] == null,
                                    onClick = {
                                        scope.launch {
                                            try {
                                                sendFriendRequest(currentUserId, person.id)
                                                friendRequestStatus = friendRequestStatus + (person.id to "Запрос отправлен")
                                            } catch (_: Exception) {
                                                friendRequestStatus = friendRequestStatus + (person.id to "Запрос уже отправлен или дружба оформлена")
                                            }
                                        }
                                    }
                                ) { Text("В друзья", color = Color(0xFF9FCBFF), fontSize = 11.sp) }
                            }
                        }
                    }
                }
            }
            section == "Фото" || section == "Видео" -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(section, color = White, fontSize = 23.sp, fontWeight = FontWeight.Bold)
                        Text("Только материалы открытого альбома.", color = Muted, fontSize = 12.sp)
                    }
                    if (publicMedia.isEmpty()) item {
                        Text(if (section == "Фото") "В открытом фотоальбоме пока нет фотографий." else "В открытом видеоальбоме пока нет видео.", color = Muted, fontSize = 13.sp)
                    }
                    items(publicMedia, key = { it.first.id }) { (item, url) ->
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = Panel,
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (item.mime.startsWith("image/")) {
                                    AsyncImage(
                                        model = url,
                                        contentDescription = "Фотография из открытого альбома",
                                        modifier = Modifier.fillMaxWidth().heightIn(max = 420.dp).clip(RoundedCornerShape(12.dp)),
                                        contentScale = ContentScale.Fit
                                    )
                                } else {
                                    SocialVideoPlayer(url = url)
                                }
                                Text(item.name, color = Muted, fontSize = 12.sp, maxLines = 1)
                            }
                        }
                    }
                }
            }
            section == "Настройки соцсети" -> {
                Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
                    Text("Настройки соцсети", color = White, fontSize = 23.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Text("Управляй видимостью открытых материалов и публикаций.", color = Muted, fontSize = 13.sp)
                    Spacer(Modifier.height(16.dp))
                    Row(Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(14.dp)).clickable { privacyPublicPhotos = !privacyPublicPhotos }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("Открытый фотоальбом виден другим", color = White, modifier = Modifier.weight(1f), fontSize = 14.sp)
                        Switch(checked = privacyPublicPhotos, onCheckedChange = { privacyPublicPhotos = it })
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(14.dp)).clickable { privacyVideos = !privacyVideos }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("Открытый видеоальбом виден другим", color = White, modifier = Modifier.weight(1f), fontSize = 14.sp)
                        Switch(checked = privacyVideos, onCheckedChange = { privacyVideos = it })
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(14.dp)).clickable { privacyComments = !privacyComments }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("Комментарии разрешены", color = White, modifier = Modifier.weight(1f), fontSize = 14.sp)
                        Switch(checked = privacyComments, onCheckedChange = { privacyComments = it })
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(14.dp)).clickable { privacyFeed = !privacyFeed }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("Публикации видны в ленте", color = White, modifier = Modifier.weight(1f), fontSize = 14.sp)
                        Switch(checked = privacyFeed, onCheckedChange = { privacyFeed = it })
                    }
                    Spacer(Modifier.height(14.dp))
                    Button(onClick = {
                        privacySaving = true
                        privacyStatus = ""
                        scope.launch {
                            try {
                                saveSocialPrivacySettings(currentUserId, JSONObject()
                                    .put("public_album_visible", privacyPublicPhotos)
                                    .put("video_album_visible", privacyVideos)
                                    .put("comments_visible", privacyComments)
                                    .put("feed_posts_visible", privacyFeed)
                                    .put("music_visible", true))
                                privacyStatus = "Настройки сохранены."
                            } catch (_: Exception) {
                                privacyStatus = "Не удалось сохранить. Проверь подключение и попробуй ещё раз."
                            } finally { privacySaving = false }
                        }
                    }, enabled = !privacySaving, modifier = Modifier.fillMaxWidth()) {
                        Text(if (privacySaving) "Сохраняем…" else "Сохранить настройки")
                    }
                    if (privacyStatus.isNotBlank()) Text(privacyStatus, color = Muted, fontSize = 12.sp)
                }
            }
            section == "Моя страница" -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item { SocialPostComposer(currentUserId) { posts = loadSocialPosts(currentUserId) } }
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = Panel,
                            shape = RoundedCornerShape(18.dp)
                        ) {
                            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                val name = profile?.displayName ?: profile?.username ?: "Пользователь"
                                Avatar((name.firstOrNull()?.toString() ?: "F").uppercase(), avatarUrl = profile?.avatarUrl)
                                Spacer(Modifier.width(14.dp))
                                Column {
                                    Text(name, color = White, fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
                                    Text(profile?.username?.let { "@$it" } ?: "", color = Muted, fontSize = 13.sp)
                                }
                            }
                        }
                    }
                    item {
                        Text("Публикации", color = White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    }
                    if (posts.isEmpty()) {
                        item {
                            Text("Пока нет публикаций. Здесь будут отображаться твои записи.", color = Muted, fontSize = 13.sp)
                        }
                    } else {
                        items(posts, key = { it.id }) { post ->
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                color = Panel,
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text(profile?.displayName ?: profile?.username ?: "Пользователь", color = White, fontWeight = FontWeight.SemiBold)
                                    post.createdAt?.let { Text(it.replace("T", " ").take(16), color = Muted, fontSize = 11.sp) }
                                    post.content?.takeIf { it.isNotBlank() }?.let {
                                        Text(it, color = White, fontSize = 14.sp)
                                    }
                                    post.imageUrl?.takeIf { it.startsWith("https://") }?.let { url ->
                                        AsyncImage(
                                            model = url,
                                            contentDescription = "Фото публикации",
                                            modifier = Modifier.fillMaxWidth().heightIn(max = 320.dp).clip(RoundedCornerShape(12.dp)),
                                            contentScale = ContentScale.Crop
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else -> Column(Modifier.fillMaxWidth().padding(20.dp)) {
                Text(section, color = White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(12.dp))
                Text("Раздел «$section» подключим следующим этапом.", color = Muted, fontSize = 13.sp)
            }
        }
    }
}

@Composable
private fun SocialPostComposer(currentUserId: String, onPosted: suspend () -> Unit) {
    var draft by remember { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Panel,
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
            OutlinedTextField(
                value = draft,
                onValueChange = { draft = it; status = "" },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Что нового?", color = Muted) },
                minLines = 2,
                maxLines = 5,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = White,
                    unfocusedTextColor = White,
                    focusedBorderColor = Blue,
                    unfocusedBorderColor = Muted
                )
            )
            Button(
                onClick = {
                    val content = draft.trim()
                    if (content.isNotEmpty() && !sending) {
                        scope.launch {
                            sending = true
                            status = ""
                            try {
                                createSocialPost(currentUserId, content)
                                draft = ""
                                onPosted()
                                status = "Публикация размещена."
                            } catch (_: Exception) {
                                status = "Не удалось опубликовать. Проверь подключение и попробуй ещё раз."
                            } finally {
                                sending = false
                            }
                        }
                    }
                },
                enabled = draft.isNotBlank() && !sending,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(if (sending) "Публикуем…" else "Опубликовать")
            }
            if (status.isNotBlank()) Text(status, color = Muted, fontSize = 11.sp)
        }
    }
}

@Composable
private fun SocialVideoPlayer(url: String) {
    val context = LocalContext.current
    val player = remember(url) {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(url))
            prepare()
        }
    }
    DisposableEffect(player) {
        onDispose { player.release() }
    }
    AndroidView(
        factory = { viewContext ->
            PlayerView(viewContext).apply {
                this.player = player
                useController = true
                resizeMode = androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT
            }
        },
        update = { it.player = player },
        modifier = Modifier.fillMaxWidth().height(300.dp).clip(RoundedCornerShape(12.dp))
    )
}

@Composable
private fun SocialEntryButton(onClick: () -> Unit) {
    Surface(
        modifier = Modifier.padding(start = 8.dp).height(42.dp).clickable { onClick() },
        color = Color(0x332E579F),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            Modifier.padding(horizontal = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(7.dp)
        ) {
            Text("◉", color = Color(0xFF9FCBFF), fontSize = 17.sp)
            Text("Соцсеть", color = White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun SocialMenuButton(onClick: () -> Unit) {
    Surface(
        modifier = Modifier.height(42.dp).clickable { onClick() },
        color = Color(0x332E579F),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            Modifier.padding(horizontal = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(7.dp)
        ) {
            Text("☰", color = White, fontSize = 17.sp)
            Text("Разделы", color = White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun HeaderAction(symbol: String, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.padding(start = 8.dp).size(42.dp).clickable { onClick() },
        color = Color(0x332E579F), shape = CircleShape
    ) {
        Box(contentAlignment = Alignment.Center) { Text(symbol, color = White, fontSize = 23.sp) }
    }
}

@Composable
private fun ChatsScreen(
    currentUserId: String,
    searchQuery: String,
    onOpen: (ProfileDto) -> Unit
) {
    val threads = remember(currentUserId) { mutableStateListOf<ChatThread>() }
    var loading by remember(currentUserId) { mutableStateOf(true) }
    var error by remember(currentUserId) { mutableStateOf("") }
    var hasLoadedInbox by remember(currentUserId) { mutableStateOf(false) }
    val lifecycleOwner = LocalLifecycleOwner.current
    var isInboxResumed by remember { mutableStateOf(lifecycleOwner.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> { error = ""; isInboxResumed = true }
                Lifecycle.Event.ON_PAUSE, Lifecycle.Event.ON_STOP -> isInboxResumed = false
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(currentUserId, isInboxResumed) {
        if (isInboxResumed) {
            var firstSyncAfterResume = true
            do {
                try {
                    // Load the newest page first so a slow regional route cannot keep
                    // the inbox blank while older history is being paged in.
                    val latest = loadInboxThreads(
                        currentUserId,
                        existingThreads = threads.toList(),
                        fullHistory = false
                    )
                    threads.clear()
                    threads.addAll(latest)
                    hasLoadedInbox = true
                    loading = false
                    error = ""
                    if (firstSyncAfterResume) {
                        try {
                            val completeHistory = loadInboxThreads(
                                currentUserId,
                                existingThreads = threads.toList(),
                                fullHistory = true
                            )
                            threads.clear()
                            threads.addAll(completeHistory)
                        } catch (historyError: Exception) {
                            if (historyError is kotlinx.coroutines.CancellationException) throw historyError
                            // Keep the already rendered recent inbox; the next foreground
                            // refresh will reconcile it instead of replacing it with an error.
                        }
                    }
                } catch (e: Exception) {
                    if (e is kotlinx.coroutines.CancellationException) throw e
                    if (!hasLoadedInbox) error = e.message ?: "Не удалось загрузить список чатов."
                } finally {
                    loading = false
                    hasLoadedInbox = true
                }
                firstSyncAfterResume = false
                if (isInboxResumed) delay(5000)
            } while (isInboxResumed)
        }
    }

    var chatFilter by remember(currentUserId) { mutableStateOf("Все") }
    val filtered = threads.filter { thread ->
        val name = thread.peer.displayName ?: thread.peer.username ?: ""
        val preview = thread.lastMessage.content
        val matchesSearch = name.contains(searchQuery, true) || preview.contains(searchQuery, true)
        val matchesFilter = chatFilter == "Все" || (chatFilter == "Непрочитанные" && thread.unread > 0)
        matchesSearch && matchesFilter
    }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Text("Твои переписки", color = White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text("Настоящие сообщения FLOUSTREAM", color = Muted, fontSize = 12.sp)
            }
            Surface(color = PanelSoft, shape = RoundedCornerShape(20.dp)) {
                Text("● синхронизация", Modifier.padding(horizontal = 12.dp, vertical = 7.dp), color = Color(0xFF69DDA8), fontSize = 10.sp)
            }
        }
        Row(
            Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("Все", "Непрочитанные").forEach { filter ->
                val selected = chatFilter == filter
                Surface(
                    modifier = Modifier.clickable { chatFilter = filter },
                    color = if (selected) Color(0xFF263B68) else PanelSoft,
                    shape = RoundedCornerShape(18.dp),
                    border = if (selected) androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF548BFF)) else null
                ) {
                    Text(
                        filter,
                        Modifier.padding(horizontal = 17.dp, vertical = 9.dp),
                        color = if (selected) White else Muted,
                        fontSize = 12.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                    )
                }
            }
        }
        if (error.isNotBlank()) {
            Text(error, Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 6.dp), color = Color(0xFFFF9AA8), fontSize = 11.sp)
        }
        LazyColumn(contentPadding = PaddingValues(bottom = 110.dp)) {
            if (loading && threads.isEmpty()) {
                item {
                    Row(Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(color = Blue, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(12.dp))
                        Text("Загружаем чаты…", color = Muted, fontSize = 13.sp)
                    }
                }
            } else if (filtered.isEmpty()) {
                item {
                    EmptyPanel(
                        "✉",
                        if (searchQuery.isBlank()) "Пока нет переписок" else "Ничего не найдено",
                        if (searchQuery.isBlank()) "Найди человека во вкладке «Контакты» и отправь ему первое сообщение. Диалог появится здесь." else "Попробуй изменить поисковый запрос."
                    )
                }
            }
            items(filtered, key = { it.peer.id }) { thread ->
                val peer = thread.peer
                val title = peer.displayName ?: peer.username ?: "Пользователь"
                val preview = (if (thread.lastMessage.senderId == currentUserId) "Вы: " else "") + thread.lastMessage.content
                Row(
                    Modifier.fillMaxWidth().clickable { onOpen(peer) }.padding(horizontal = 16.dp, vertical = 11.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Avatar((title.firstOrNull()?.toString() ?: "D").uppercase(), avatarUrl = peer.avatarUrl)
                    Spacer(Modifier.width(13.dp))
                    Column(Modifier.weight(1f)) {
                        Text(title, color = White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(preview, color = Muted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(thread.lastMessage.createdAt.substringAfter("T").take(5), color = Muted, fontSize = 10.sp)
                        if (thread.unread > 0) {
                            Spacer(Modifier.height(5.dp))
                            Surface(color = Blue, shape = CircleShape) {
                                Text(thread.unread.toString(), Modifier.padding(horizontal = 7.dp, vertical = 2.dp), color = White, fontSize = 10.sp)
                            }
                        }
                    }
                }
                HorizontalDivider(color = Color(0xFF1B2941), modifier = Modifier.padding(start = 82.dp))
            }
        }
    }
}

@Composable
private fun Avatar(initials: String, online: Boolean = false, avatarUrl: String? = null) {
    val context = LocalContext.current
    val avatarRequest = remember(avatarUrl) {
        if (avatarUrl.isNullOrBlank()) null else coil.request.ImageRequest.Builder(context)
            .data(avatarUrl)
            .crossfade(true)
            // Software bitmaps avoid GPU texture artefacts on some Android devices.
            .allowHardware(false)
            .build()
    }
    Box {
        Surface(
            modifier = Modifier.size(54.dp),
            shape = CircleShape,
            color = PanelSoft
        ) {
            Box(contentAlignment = Alignment.Center) {
                if (avatarRequest != null) {
                    AsyncImage(model = avatarRequest, contentDescription = "Фото профиля", modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                } else {
                    Text(initials, color = White, fontSize = 19.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        if (online) {
            Surface(
                modifier = Modifier.align(Alignment.BottomEnd).size(13.dp),
                shape = CircleShape, color = Color(0xFF4CD99A)
            ) {}
        }
    }
}

@Composable
private fun CallsScreen(onInfo: (String) -> Unit) {
    Column(Modifier.fillMaxSize().padding(20.dp)) {
        Text("Звонки", color = White, fontSize = 23.sp, fontWeight = FontWeight.Bold)
        Text("Голосовая и видеосвязь", color = Muted, fontSize = 12.sp)
        Spacer(Modifier.height(20.dp))
        EmptyPanel("◉", "Здесь будет история звонков", "Когда подключим звонки, здесь появятся входящие, исходящие и пропущенные вызовы.")
        Spacer(Modifier.height(18.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            ActionTile("☎", "Голосовой", Modifier.weight(1f)) { onInfo("Голосовые звонки подключим через защищённое соединение WebRTC.") }
            ActionTile("▣", "Видео", Modifier.weight(1f)) { onInfo("Видеозвонки появятся после подключения WebRTC и разрешения камеры.") }
        }
    }
}

@Composable
private fun ContactsScreen(onStart: (ProfileDto) -> Unit) {
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<ProfileDto>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("Ищи собеседников по их @username из FLOUSTREAM.") }
    val scope = rememberCoroutineScope()

    Column(Modifier.fillMaxSize().padding(20.dp)) {
        Text("Контакты", color = White, fontSize = 23.sp, fontWeight = FontWeight.Bold)
        Text("Находи людей в FLOUSTREAM", color = Muted, fontSize = 12.sp)
        Spacer(Modifier.height(18.dp))
        OutlinedTextField(
            value = query, onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Поиск по @username", color = Muted) },
            singleLine = true, shape = RoundedCornerShape(16.dp)
        )
        Spacer(Modifier.height(10.dp))
        Button(
            onClick = {
                scope.launch {
                    loading = true
                    status = "Ищем пользователей…"
                    try {
                        results = findFloustreamUsers(query)
                        status = if (results.isEmpty()) "Никого не нашли. Проверь @username и попробуй ещё раз." else "Найдено: ${results.size}"
                    } catch (e: Exception) {
                        if (e is kotlinx.coroutines.CancellationException) throw e
                        status = "Поиск временно недоступен: ${e.message ?: "ошибка"}"
                    } finally { loading = false }
                }
            },
            enabled = !loading && query.trim().removePrefix("@").length >= 2,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Blue),
            shape = RoundedCornerShape(14.dp)
        ) {
            if (loading) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = White)
            else Text("НАЙТИ ПОЛЬЗОВАТЕЛЯ", color = White)
        }
        Spacer(Modifier.height(10.dp))
        Text(status, color = Muted, fontSize = 12.sp)
        LazyColumn(contentPadding = PaddingValues(bottom = 20.dp)) {
            items(results) { person ->
                Row(
                    Modifier.fillMaxWidth().clickable { onStart(person) }.padding(vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Avatar((person.displayName ?: person.username ?: "D").take(1).uppercase(), avatarUrl = person.avatarUrl)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(person.displayName ?: person.username ?: "Пользователь", color = White, fontWeight = FontWeight.SemiBold)
                        Text(person.username?.let { "@$it" } ?: "Пользователь FLOUSTREAM", color = Muted, fontSize = 12.sp)
                    }
                    Text("Написать ›", color = Color(0xFF9FCBFF), fontSize = 12.sp)
                }
                HorizontalDivider(color = Color(0xFF1B2941))
            }
        }
    }
}

@Composable
private fun SettingsScreen(currentUserId: String, onBack: () -> Unit, onSignOut: () -> Unit, onDeleteAccount: () -> Unit, onInfo: (String) -> Unit) {
    var confirmSignOut by remember { mutableStateOf(false) }
    var confirmDelete by remember { mutableStateOf(false) }
    var profile by remember(currentUserId) { mutableStateOf<ProfileDto?>(null) }
    LaunchedEffect(currentUserId) {
        while (true) {
            try { profile = loadCurrentProfile(currentUserId) } catch (e: Exception) {
                if (e is kotlinx.coroutines.CancellationException) throw e
            }
            delay(30000)
        }
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("‹", Modifier.clickable { onBack() }.padding(end = 14.dp), color = White, fontSize = 30.sp)
            Column {
                Text("Настройки", color = White, fontSize = 23.sp, fontWeight = FontWeight.Bold)
                Text("Твой аккаунт и приложение", color = Muted, fontSize = 12.sp)
            }
        }
        Spacer(Modifier.height(20.dp))
        Surface(color = Panel, shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Avatar((profile?.displayName ?: listOfNotNull(profile?.firstName, profile?.lastName).joinToString(" ").ifBlank { profile?.username ?: "F" }).take(1).uppercase(), true, profile?.avatarUrl)
                Spacer(Modifier.width(14.dp))
                Column {
                    Text(profile?.displayName?.takeIf { it.isNotBlank() } ?: listOfNotNull(profile?.firstName, profile?.lastName).joinToString(" ").ifBlank { profile?.username ?: "FLOUSTREAM аккаунт" }, color = White, fontWeight = FontWeight.Bold)
                    Text(profile?.username?.let { "@$it" } ?: "Единый аккаунт сайта и приложения", color = Muted, fontSize = 11.sp)
                }
            }
        }
        Spacer(Modifier.height(18.dp))
        SettingsRow("☷", "Профиль", "Имя, фото и статус") { onInfo("Настройки профиля подключим к твоему аккаунту FLOUSTREAM.") }
        SettingsRow("🔔", "Уведомления", "Звуки и оповещения") { onInfo("Здесь будут настройки уведомлений и звуков.") }
        SettingsRow("◈", "Приватность", "Кто может с тобой связаться") { onInfo("Настройки приватности подключим к общей системе FLOUSTREAM.") }
        SettingsRow("⟳", "Синхронизация с сайтом", "Чаты и медиа между сайтом и приложением") { onInfo("Чаты используют общую таблицу direct_messages Supabase. Остальные настройки синхронизации добавим по мере подключения функций.") }
        SettingsRow("⬆", "Обновления приложения", "Обязательные обновления · отключить нельзя") { onInfo("FLOUSTREAM автоматически проверяет обновления. Если выйдет новая версия, приложение попросит установить её перед продолжением работы. Отключить обязательные обновления нельзя.") }
        SettingsRow("⌫", "Удалить учётную запись", "Подтверждение email · 30 дней на восстановление") { confirmDelete = true }
        SettingsRow("◐", "О приложении", "FLOUSTREAM Messenger · ${BuildConfig.VERSION_NAME}") { onInfo("FLOUSTREAM Messenger, версия ${BuildConfig.VERSION_NAME}.") }
        Spacer(Modifier.height(18.dp))
        Surface(
            modifier = Modifier.fillMaxWidth().clickable { confirmSignOut = true },
            color = Color(0xFF2A1724),
            shape = RoundedCornerShape(18.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF6B3047))
        ) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Surface(color = Color(0xFF51263A), shape = RoundedCornerShape(12.dp), modifier = Modifier.size(44.dp)) {
                    Box(contentAlignment = Alignment.Center) { Text("↪", color = Color(0xFFFF9AAA), fontSize = 23.sp) }
                }
                Spacer(Modifier.width(13.dp))
                Column(Modifier.weight(1f)) {
                    Text("Выйти из аккаунта", color = Color(0xFFFF9AAA), fontWeight = FontWeight.Bold)
                    Text("Завершить текущий сеанс на этом устройстве", color = Muted, fontSize = 10.sp)
                }
                Text("›", color = Color(0xFFFF9AAA), fontSize = 25.sp)
            }
        }
    }

    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            containerColor = Panel,
            title = { Text("Удалить учётную запись?", color = White) },
            text = { Text("После подтверждения по email аккаунт будет деактивирован. В течение 30 дней можно восстановить именно прежний аккаунт. После этого личные данные и файлы будут удалены, а текст переписок останется у собеседников.", color = Muted) },
            confirmButton = {
                TextButton(onClick = { confirmDelete = false; onDeleteAccount() }) { Text("Отправить письмо", color = Color(0xFFFF9AAA)) }
            },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Отмена", color = White) } }
        )
    }

    if (confirmSignOut) {
        AlertDialog(
            onDismissRequest = { confirmSignOut = false },
            containerColor = Panel,
            title = { Text("Выйти из FLOUSTREAM?", color = White) },
            text = { Text("Сессия на этом устройстве завершится. При следующем входе используй тот же аккаунт сайта FLOUSTREAM.", color = Muted) },
            confirmButton = {
                TextButton(onClick = { confirmSignOut = false; onSignOut() }) {
                    Text("Выйти", color = Color(0xFFFF9AAA))
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmSignOut = false }) { Text("Отмена", color = White) }
            }
        )
    }
}

@Composable
private fun SettingsRow(icon: String, title: String, subtitle: String, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clickable { onClick() }.padding(vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(color = PanelSoft, shape = RoundedCornerShape(12.dp), modifier = Modifier.size(42.dp)) {
            Box(contentAlignment = Alignment.Center) { Text(icon, color = Color(0xFF9FCBFF), fontSize = 19.sp) }
        }
        Spacer(Modifier.width(13.dp))
        Column(Modifier.weight(1f)) {
            Text(title, color = White, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            Text(subtitle, color = Muted, fontSize = 10.sp)
        }
        Text("›", color = Muted, fontSize = 25.sp)
    }
    HorizontalDivider(color = Color(0xFF1B2941))
}

@Composable
private fun EmptyPanel(icon: String, title: String, description: String) {
    Surface(color = Panel, shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(icon, color = Color(0xFF9FCBFF), fontSize = 34.sp)
            Spacer(Modifier.height(8.dp))
            Text(title, color = White, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(6.dp))
            Text(description, color = Muted, fontSize = 12.sp, lineHeight = 18.sp)
        }
    }
}

@Composable
private fun ActionTile(icon: String, label: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Surface(modifier = modifier.clickable { onClick() }, color = Panel, shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(icon, color = Color(0xFF9FCBFF), fontSize = 25.sp)
            Text(label, color = White, fontSize = 12.sp)
        }
    }
}

private object MessageMediaUrlCache {
    private data class Entry(val url: String, val expiresAtMillis: Long)
    private val entries = ConcurrentHashMap<String, Entry>()

    suspend fun get(path: String): String {
        val now = System.currentTimeMillis()
        entries[path]?.takeIf { it.expiresAtMillis > now }?.let { return it.url }
        val url = floustreamClient.storage.from("message-media").createSignedUrl(path, 30.minutes)
        entries[path] = Entry(url, now + 29L * 60L * 1000L)
        return url
    }

    fun invalidate(path: String) {
        entries.remove(path)
    }
}

@Composable
private fun MessageAttachment(message: DirectMessageDto) {
    val context = LocalContext.current
    val path = message.attachmentPath ?: return
    val mime = message.attachmentMime.orEmpty().lowercase()
    val isRoundVideo = !message.attachmentName.orEmpty().startsWith("normal_")
    var signedUrl by remember(path) { mutableStateOf<String?>(null) }
    var loadError by remember(path) { mutableStateOf(false) }
    var urlRefreshAttempt by remember(path) { mutableIntStateOf(0) }

    LaunchedEffect(path, urlRefreshAttempt) {
        signedUrl = null
        loadError = false
        try {
            if (urlRefreshAttempt > 0) MessageMediaUrlCache.invalidate(path)
            signedUrl = MessageMediaUrlCache.get(path)
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            loadError = true
        }
    }

    var showFullScreen by remember(path) { mutableStateOf(false) }
    var imageLoadError by remember(path) { mutableStateOf(false) }
    val url = signedUrl
    when {
        mime.startsWith("audio/") && url == null && !loadError -> Box(
            Modifier.fillMaxWidth().height(64.dp),
            contentAlignment = Alignment.Center
        ) { CircularProgressIndicator(color = Blue) }
        mime.startsWith("audio/") && loadError -> Row(
            Modifier.fillMaxWidth().height(64.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Text("Не удалось загрузить аудио", color = Muted, fontSize = 11.sp)
            TextButton(onClick = { urlRefreshAttempt++ }) { Text("Повторить", color = Blue) }
        }
        mime.startsWith("video/") && url == null && !loadError -> Box(
            Modifier.size(if (isRoundVideo) 190.dp else 340.dp, if (isRoundVideo) 190.dp else 210.dp)
                .clip(if (isRoundVideo) CircleShape else RoundedCornerShape(18.dp)).background(Color.Black),
            contentAlignment = Alignment.Center
        ) { CircularProgressIndicator(color = Blue) }
        mime.startsWith("video/") && loadError -> Box(
            Modifier.size(if (isRoundVideo) 190.dp else 340.dp, if (isRoundVideo) 190.dp else 210.dp)
                .clip(if (isRoundVideo) CircleShape else RoundedCornerShape(18.dp)).background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Видео недоступно", color = White, fontSize = 11.sp)
                TextButton(onClick = { urlRefreshAttempt++ }) { Text("Повторить", color = Blue) }
            }
        }
        mime.startsWith("image/") && url == null && !loadError -> Box(
            Modifier.fillMaxWidth().height(300.dp),
            contentAlignment = Alignment.Center
        ) { CircularProgressIndicator(color = Blue) }
        mime.startsWith("image/") && (loadError || imageLoadError) -> Row(
            Modifier.fillMaxWidth().height(300.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Text("Не удалось отобразить фото", color = Muted, fontSize = 12.sp)
            TextButton(onClick = { urlRefreshAttempt++; imageLoadError = false; loadError = false }) { Text("Повторить", color = Blue) }
        }
        url == null && !loadError -> CircularProgressIndicator(modifier = Modifier.size(22.dp), color = Blue)
        loadError -> Text("Не удалось получить ссылку на вложение", color = Muted, fontSize = 12.sp)
        mime.startsWith("image/") -> AsyncImage(
            model = ImageRequest.Builder(context).data(url)
                .memoryCacheKey("floustream-media-$path")
                .diskCacheKey("floustream-media-$path")
                .crossfade(false).build(),
            contentDescription = message.attachmentName ?: "Изображение",
            modifier = Modifier.widthIn(max = 240.dp).fillMaxWidth().aspectRatio(9f / 16f)
                .clip(RoundedCornerShape(12.dp)).clickable { showFullScreen = true },
            contentScale = ContentScale.Crop,
            onLoading = { imageLoadError = false },
            onError = { imageLoadError = true }
        )
        mime.startsWith("audio/") -> AudioMessagePlayer(url!!) { urlRefreshAttempt++ }
        mime.startsWith("video/") -> VideoMessagePlayer(
            url!!,
            isRound = !message.attachmentName.orEmpty().startsWith("normal_")
        ) { urlRefreshAttempt++ }
        else -> Row(
            Modifier.fillMaxWidth().clickable {
                try {
                    val intent = Intent(Intent.ACTION_VIEW).setDataAndType(
                        android.net.Uri.parse(url),
                        mime.ifBlank { "*/*" }
                    ).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    context.startActivity(Intent.createChooser(intent, "Открыть файл"))
                } catch (_: Exception) {
                    Toast.makeText(context, "Не найдено приложение для этого файла", Toast.LENGTH_SHORT).show()
                }
            }.padding(vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("📄", fontSize = 25.sp)
            Spacer(Modifier.width(9.dp))
            Column(Modifier.weight(1f)) {
                Text(message.attachmentName ?: "Файл", color = White, fontSize = 13.sp, maxLines = 2)
                Text("Нажми, чтобы открыть", color = Muted, fontSize = 10.sp)
            }
        }
    }
    if (showFullScreen && url != null && mime.startsWith("image/")) {
        Dialog(
            onDismissRequest = { showFullScreen = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(Modifier.fillMaxSize().background(Color.Black)) {
                AsyncImage(
                    model = url,
                    contentDescription = message.attachmentName ?: "Фотография",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
                Text(
                    "×",
                    Modifier.align(Alignment.TopEnd).clickable { showFullScreen = false }.padding(20.dp),
                    color = Color.White,
                    fontSize = 34.sp
                )
            }
        }
    }
}

@Composable
private fun ChatAtmosphereBackground() {
    // One static gradient only: no animated state, blur layers, or radial overlays.
    Box(
        Modifier.fillMaxSize().background(
            Brush.linearGradient(
                colors = listOf(
                    Color(0xFF291747),
                    Color(0xFF244B86),
                    Color(0xFF3C4B5C),
                    Color(0xFF192536)
                )
            )
        )
    )
}
@Composable
private fun FanActionButton(icon: String, label: String, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.size(54.dp).clickable(onClick = onClick),
        color = Color(0xE51A2340),
        shape = RoundedCornerShape(17.dp),
        border = androidx.compose.foundation.BorderStroke(
            0.8.dp,
            Brush.linearGradient(listOf(Color(0xAA69CFFF), Color(0xAA9A70FF), Color(0x8871E4D2)))
        ),
        shadowElevation = 10.dp
    ) {
        Column(
            Modifier.fillMaxSize().padding(vertical = 5.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(icon, color = Color(0xFFB9D8FF), fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
            Text(label, color = White, fontSize = 8.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun FanMediaButton(
    onPhoto: () -> Unit,
    onVideo: () -> Unit,
    onGallery: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val shimmerTransition = rememberInfiniteTransition(label = "floustream-f-logo")
    val shimmer by shimmerTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "f-logo-shimmer"
    )
    val logoTilt by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (expanded) -12f else 0f,
        animationSpec = tween(durationMillis = 260), label = "floustream-f-tilt"
    )
    val logoBrush = Brush.linearGradient(
        colors = listOf(
            Color(0xFF63D8FF),
            Color(0xFF668BFF),
            Color(0xFFB16BFF),
            Color(0xFF69E9E0),
            Color(0xFF63D8FF)
        ),
        start = androidx.compose.ui.geometry.Offset(shimmer * 130f, 0f),
        end = androidx.compose.ui.geometry.Offset(shimmer * 130f + 100f, 100f)
    )

    Box(Modifier.width(154.dp).height(44.dp)) {
        AnimatedVisibility(
            visible = expanded,
            modifier = Modifier.align(Alignment.BottomStart).offset(x = 0.dp, y = (-56).dp),
            enter = fadeIn(tween(190)) + scaleIn(initialScale = 0.68f, animationSpec = tween(220)),
            exit = fadeOut(tween(120)) + scaleOut(targetScale = 0.68f, animationSpec = tween(120))
        ) {
            FanActionButton("▧", "Фото") { expanded = false; onPhoto() }
        }
        AnimatedVisibility(
            visible = expanded,
            modifier = Modifier.align(Alignment.BottomStart).offset(x = 49.dp, y = (-48).dp),
            enter = fadeIn(tween(230, delayMillis = 35)) + scaleIn(initialScale = 0.68f, animationSpec = tween(250, delayMillis = 35)),
            exit = fadeOut(tween(120)) + scaleOut(targetScale = 0.68f, animationSpec = tween(120))
        ) {
            FanActionButton("▶", "Видео") { expanded = false; onVideo() }
        }
        AnimatedVisibility(
            visible = expanded,
            modifier = Modifier.align(Alignment.BottomStart).offset(x = 98.dp, y = (-18).dp),
            enter = fadeIn(tween(270, delayMillis = 70)) + scaleIn(initialScale = 0.68f, animationSpec = tween(280, delayMillis = 70)),
            exit = fadeOut(tween(120)) + scaleOut(targetScale = 0.68f, animationSpec = tween(120))
        ) {
            FanActionButton("▤", "Галерея") { expanded = false; onGallery() }
        }

        Surface(
            modifier = Modifier.align(Alignment.BottomStart).size(44.dp)
                .graphicsLayer { rotationZ = logoTilt; scaleX = if (expanded) 1.04f else 1f; scaleY = if (expanded) 1.04f else 1f }
                .clickable { expanded = !expanded },
            color = Color(0x66131D36),
            shape = CircleShape,
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                Brush.linearGradient(listOf(Color(0xFF5BCFFF), Color(0xFF9464FF), Color(0xFF65E4D9)))
            ),
            shadowElevation = 8.dp
        ) {
            Box(
                Modifier.fillMaxSize().background(
                    Brush.radialGradient(listOf(Color(0x335ACBFF), Color.Transparent)),
                    CircleShape
                ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "f",
                    style = androidx.compose.ui.text.TextStyle(
                        brush = logoBrush,
                        shadow = androidx.compose.ui.graphics.Shadow(
                            color = Color(0xAA6A8CFF), blurRadius = 13f,
                            offset = androidx.compose.ui.geometry.Offset(1.5f, 2f)
                        )
                    ),
                    fontSize = 34.sp,
                    fontWeight = FontWeight.Black,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                    letterSpacing = (-2.5).sp
                )
            }
        }
    }
}

private object FloustreamVideoDiskCache {
    @Volatile private var instance: SimpleCache? = null
    fun get(context: Context): SimpleCache = instance ?: synchronized(this) {
        instance ?: SimpleCache(
            File(context.cacheDir, "floustream-video-cache"),
            LeastRecentlyUsedCacheEvictor(250L * 1024L * 1024L),
            StandaloneDatabaseProvider(context.applicationContext)
        ).also { instance = it }
    }
}

@Composable
private fun VideoMessagePlayer(url: String, isRound: Boolean = true, onRetry: () -> Unit) {
    val context = LocalContext.current
    val player = remember(url) {
        val cachedDataSource = CacheDataSource.Factory()
            .setCache(FloustreamVideoDiskCache.get(context))
            .setUpstreamDataSourceFactory(DefaultDataSource.Factory(context))
            .setCacheKeyFactory { dataSpec -> dataSpec.uri.encodedPath ?: dataSpec.uri.toString() }
            .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
        val mediaSourceFactory = DefaultMediaSourceFactory(context).setDataSourceFactory(cachedDataSource)
        ExoPlayer.Builder(context).setMediaSourceFactory(mediaSourceFactory).build().apply {
            setMediaItem(MediaItem.fromUri(url))
            playWhenReady = false
            prepare()
        }
    }
    var playbackError by remember(url) { mutableStateOf(false) }
    DisposableEffect(player) {
        val listener = object : Player.Listener {
            override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                playbackError = true
                player.pause()
            }
            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_READY) playbackError = false
            }
        }
        player.addListener(listener)
        onDispose {
            player.removeListener(listener)
            player.release()
        }
    }
    var showFullScreen by remember(url) { mutableStateOf(false) }
    Box(
        Modifier.size(if (isRound) 190.dp else 340.dp, if (isRound) 190.dp else 210.dp)
            .clip(if (isRound) CircleShape else RoundedCornerShape(18.dp)).background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        if (!showFullScreen) AndroidView(
            factory = { viewContext ->
                PlayerView(viewContext).apply {
                    this.player = player
                    useController = true
                    resizeMode = androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT
                }
            },
            update = { it.player = player },
            modifier = Modifier.fillMaxSize()
        )
        if (!isRound && !showFullScreen) {
            Text(
                "⛶",
                Modifier.align(Alignment.TopEnd).padding(8.dp)
                    .clip(CircleShape).background(Color(0x99080D1B))
                    .clickable { showFullScreen = true }.padding(horizontal = 11.dp, vertical = 6.dp),
                color = White,
                fontSize = 21.sp
            )
        }
        if (playbackError) {
            Column(
                Modifier.fillMaxSize().background(Color(0xCC080D1B)).clickable { onRetry() }.padding(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text("Не удалось воспроизвести видео", color = White, fontSize = 11.sp)
                Spacer(Modifier.height(6.dp))
                Text("↻ Повторить", color = Color(0xFFB99AFF), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
    if (showFullScreen) {
        Dialog(
            onDismissRequest = { showFullScreen = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(Modifier.fillMaxSize().background(Color.Black)) {
                AndroidView(
                    factory = { viewContext ->
                        PlayerView(viewContext).apply {
                            this.player = player
                            useController = true
                            resizeMode = androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT
                        }
                    },
                    update = { it.player = player },
                    modifier = Modifier.fillMaxSize()
                )
                Text(
                    "×",
                    Modifier.align(Alignment.TopEnd).clickable { showFullScreen = false }
                        .padding(18.dp),
                    color = White,
                    fontSize = 34.sp
                )
            }
        }
    }
}

@Composable
private fun AudioMessagePlayer(url: String, onRetry: () -> Unit) {
    val context = LocalContext.current
    val player = remember(url) {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(url))
            playWhenReady = false
            prepare()
        }
    }
    var isPlaying by remember(url) { mutableStateOf(false) }
    var isBuffering by remember(url) { mutableStateOf(true) }
    var playbackError by remember(url) { mutableStateOf(false) }
    var durationMs by remember(url) { mutableLongStateOf(0L) }
    var positionMs by remember(url) { mutableLongStateOf(0L) }

    DisposableEffect(player) {
        val listener = object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                isBuffering = playbackState == Player.STATE_BUFFERING
                if (playbackState == Player.STATE_READY) {
                    durationMs = player.duration.takeIf { it > 0L } ?: 0L
                    playbackError = false
                }
                if (playbackState == Player.STATE_ENDED) {
                    // ExoPlayer keeps playWhenReady=true after reaching the end.
                    // Pause before rewinding, otherwise seekTo(0) starts the voice note again.
                    player.pause()
                    player.seekTo(0L)
                    isPlaying = false
                    positionMs = 0L
                }
            }
            override fun onIsPlayingChanged(playing: Boolean) {
                isPlaying = playing
            }
            override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                playbackError = true
                isPlaying = false
                isBuffering = false
            }
        }
        player.addListener(listener)
        // The player may already be READY by the time this effect is installed.
        // Synchronize the initial Compose state so the buffering indicator cannot get stuck.
        isBuffering = player.playbackState == Player.STATE_BUFFERING
        isPlaying = player.isPlaying
        durationMs = player.duration.takeIf { player.playbackState == Player.STATE_READY && it > 0L } ?: 0L
        positionMs = player.currentPosition.coerceAtLeast(0L)
        playbackError = player.playerError != null
        onDispose {
            player.removeListener(listener)
            player.release()
        }
    }

    LaunchedEffect(player, isPlaying) {
        while (isPlaying) {
            positionMs = player.currentPosition.coerceAtLeast(0L)
            delay(250L)
        }
    }

    Row(
        Modifier.widthIn(max = 145.dp).fillMaxWidth()
            .background(PanelSoft, RoundedCornerShape(13.dp)).padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            modifier = Modifier.size(42.dp).clickable {
                if (playbackError) {
                    onRetry()
                } else if (player.isPlaying) {
                    player.pause()
                } else {
                    player.play()
                }
            },
            color = if (playbackError) Violet else Blue,
            shape = CircleShape
        ) {
            Box(contentAlignment = Alignment.Center) {
                when {
                    isBuffering && !playbackError -> CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = White,
                        strokeWidth = 2.dp
                    )
                    playbackError -> Text("↻", color = White, fontSize = 22.sp)
                    isPlaying -> Text("Ⅱ", color = White, fontSize = 19.sp)
                    else -> Text("▶", color = White, fontSize = 19.sp)
                }
            }
        }
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text(
                if (playbackError) "Не удалось воспроизвести аудио" else "Голосовое сообщение",
                color = White,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                if (playbackError) "Нажми ↻, чтобы попробовать снова"
                else String.format(
                    "%d:%02d / %d:%02d",
                    positionMs / 60000L,
                    (positionMs / 1000L) % 60L,
                    durationMs / 60000L,
                    (durationMs / 1000L) % 60L
                ),
                color = Muted,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
private fun RealConversationScreen(peer: ProfileDto, currentUserId: String, onBack: () -> Unit) {
    val context = LocalContext.current
    val messages = remember(peer.id) { mutableStateListOf<DirectMessageDto>() }
    var reactions by remember(peer.id) { mutableStateOf<Map<String, List<DirectMessageReactionDto>>>(emptyMap()) }
    var pinnedMessageIds by remember(peer.id) { mutableStateOf<Set<String>>(emptySet()) }
    var favoriteMessageIds by remember(peer.id) { mutableStateOf<Set<String>>(emptySet()) }
    var showFavoritesOnly by remember(peer.id) { mutableStateOf(false) }
    var hasMoreOlderMessages by remember(peer.id) { mutableStateOf(true) }
    var loadingOlderMessages by remember(peer.id) { mutableStateOf(false) }
    var chatSearchOpen by remember(peer.id) { mutableStateOf(false) }
    var chatSearchQuery by remember(peer.id) { mutableStateOf("") }
    var chatSearchDate by remember(peer.id) { mutableStateOf("") }
    var chatSearchMediaFilter by remember(peer.id) { mutableStateOf("Все") }
    var chatSearchIndex by remember(peer.id) { mutableIntStateOf(-1) }
    var draft by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var sending by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val messageListState = rememberLazyListState()
    val normalizedSearchDate = chatSearchDate.trim().let { date ->
        when {
            Regex("\\d{2}\\.\\d{2}\\.\\d{4}").matches(date) ->
                date.substring(6, 10) + "-" + date.substring(3, 5) + "-" + date.substring(0, 2)
            Regex("\\d{4}-\\d{2}-\\d{2}").matches(date) -> date
            else -> ""
        }
    }
    val filteredMessages = messages.filter { msg ->
        val query = chatSearchQuery.trim()
        val textMatches = query.isBlank() ||
            msg.content.contains(query, ignoreCase = true) ||
            msg.attachmentName.orEmpty().contains(query, ignoreCase = true)
        val mime = msg.attachmentMime.orEmpty().lowercase()
        val mediaMatches = when (chatSearchMediaFilter) {
            "Фото" -> mime.startsWith("image/")
            "Видео" -> mime.startsWith("video/")
            "Аудио" -> mime.startsWith("audio/")
            "Файлы" -> !msg.attachmentPath.isNullOrBlank() &&
                !mime.startsWith("image/") && !mime.startsWith("video/") && !mime.startsWith("audio/")
            else -> true
        }
        val dateMatches = normalizedSearchDate.isBlank() || msg.createdAt.startsWith(normalizedSearchDate)
        textMatches && mediaMatches && dateMatches
    }
    val visibleMessages = (if (chatSearchOpen) filteredMessages else messages)
        .filter { !showFavoritesOnly || it.id in favoriteMessageIds }
    val lifecycleOwner = LocalLifecycleOwner.current
    var isResumed by remember { mutableStateOf(lifecycleOwner.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) }
    var didInitialChatScroll by remember(peer.id) { mutableStateOf(false) }
    var refreshInProgress by remember { mutableStateOf(false) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> {
                    errorText = ""
                    isResumed = true
                }
                Lifecycle.Event.ON_PAUSE, Lifecycle.Event.ON_STOP -> isResumed = false
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    suspend fun refresh(silent: Boolean = false): Boolean {
        if (refreshInProgress) return false
        refreshInProgress = true
        val wasAtBottom = messageListState.layoutInfo.totalItemsCount > 0 &&
            messageListState.layoutInfo.visibleItemsInfo.lastOrNull()?.index == messageListState.layoutInfo.totalItemsCount - 1
        var loaded = false
        try {
            val latest = loadDirectMessagesPage(currentUserId, peer.id)
            hasMoreOlderMessages = latest.size >= 100
            // Favorites are supplementary: their endpoint must never prevent the conversation from opening.
            val loadedFavoriteIds = try {
                loadDirectMessageFavorites(currentUserId)
            } catch (e: Exception) {
                if (e is kotlinx.coroutines.CancellationException) throw e
                favoriteMessageIds
            }
            val favoriteMessages = try {
                loadFavoriteDirectMessages(currentUserId, peer.id, loadedFavoriteIds)
            } catch (e: Exception) {
                if (e is kotlinx.coroutines.CancellationException) throw e
                emptyList()
            }
            val refreshedMessages = (latest + favoriteMessages).distinctBy { it.id }
            val merged = (messages.toList() + refreshedMessages).distinctBy { it.id }
                .sortedWith(compareBy<DirectMessageDto> { it.createdAt }.thenBy { it.id })
            val loadedReactions = try {
                loadDirectMessageReactions(merged.map { it.id })
            } catch (e: Exception) {
                if (e is kotlinx.coroutines.CancellationException) throw e
                reactions
            }
            reactions = loadedReactions
            val allIds = merged.map { it.id }.toSet()
            val loadedPinnedIds = try {
                loadDirectMessagePins(currentUserId)
            } catch (e: Exception) {
                if (e is kotlinx.coroutines.CancellationException) throw e
                pinnedMessageIds
            }
            pinnedMessageIds = loadedPinnedIds.intersect(allIds)
            favoriteMessageIds = loadedFavoriteIds.intersect(allIds)
            // Keep previously loaded older pages and all favorited messages; merge by stable ID.
            val insertedMessages = refreshedMessages.count { incoming ->
                messages.none { it.id == incoming.id }
            }
            // Publish all message updates and insertions as one Compose snapshot.
            // LazyColumn must never observe a half-merged conversation during Realtime refresh.
            Snapshot.withMutableSnapshot {
                refreshedMessages.forEach { incoming ->
                    val existingIndex = messages.indexOfFirst { it.id == incoming.id }
                    if (existingIndex >= 0) {
                        if (messages[existingIndex] != incoming) messages[existingIndex] = incoming
                    } else {
                        val insertAt = messages.indexOfFirst { existing ->
                            compareValuesBy(incoming, existing, { it.createdAt }, { it.id }) < 0
                        }
                        if (insertAt >= 0) messages.add(insertAt, incoming) else messages.add(incoming)
                    }
                }
            }
            withContext(Dispatchers.IO) { writeCachedChatMessages(context, currentUserId, peer.id, messages.toList()) }
            if (wasAtBottom && insertedMessages > 0) {
                delay(50L)
                val lastIndex = messageListState.layoutInfo.totalItemsCount - 1
                if (lastIndex >= 0) messageListState.scrollToItem(lastIndex)
            }
            errorText = ""
            loaded = true
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            if (!silent) errorText = e.message ?: "Не удалось загрузить переписку."
        } finally {
            loading = false
            refreshInProgress = false
        }
        return loaded
    }

    // Mark messages read only when the newest message is visible in the resumed chat.
    LaunchedEffect(peer.id, currentUserId, isResumed, loading, messages.size,
        messageListState.firstVisibleItemIndex, chatSearchOpen, showFavoritesOnly) {
        if (!isResumed || loading || messages.isEmpty() || chatSearchOpen || showFavoritesOnly) return@LaunchedEffect
        delay(700L)
        val layout = messageListState.layoutInfo
        val lastIndex = layout.totalItemsCount - 1
        if (lastIndex >= 0 && layout.visibleItemsInfo.any { it.index == lastIndex }) {
            try {
                markIncomingMessagesRead(currentUserId, peer.id)
            } catch (e: Exception) {
                if (e is kotlinx.coroutines.CancellationException) throw e
            }
        }
    }

    // Scroll to the newest message once after the first successful load.
    LaunchedEffect(peer.id, loading, messages.size) {
        if (!loading && messages.isNotEmpty() && !didInitialChatScroll) {
            delay(80L)
            val lastIndex = messageListState.layoutInfo.totalItemsCount - 1
            if (lastIndex >= 0) messageListState.scrollToItem(lastIndex)
            didInitialChatScroll = true
        }
    }

    var uploadingAttachment by remember { mutableStateOf(false) }
    var pendingLocalVideo by remember(peer.id) { mutableStateOf<File?>(null) }
    var pendingVideoUploadFailed by remember { mutableStateOf(false) }
    var pendingVideoReady by remember { mutableStateOf(false) }
    var videoUploadInProgress by remember { mutableStateOf(false) }
    var voiceRecorder by remember { mutableStateOf<MediaRecorder?>(null) }
    var voiceFile by remember { mutableStateOf<File?>(null) }
    var recordingVoice by remember { mutableStateOf(false) }
    var pendingDeleteMessage by remember { mutableStateOf<DirectMessageDto?>(null) }
    var pendingMessageActions by remember { mutableStateOf<DirectMessageDto?>(null) }
    var messageInfoTarget by remember { mutableStateOf<DirectMessageDto?>(null) }
    var replyToMessage by remember { mutableStateOf<DirectMessageDto?>(null) }
    var editingMessage by remember { mutableStateOf<DirectMessageDto?>(null) }
    var forwardingMessage by remember { mutableStateOf<DirectMessageDto?>(null) }
    var forwardTargetQuery by remember { mutableStateOf("") }
    var forwardCandidates by remember { mutableStateOf<List<ProfileDto>>(emptyList()) }
    var searchingForwardTargets by remember { mutableStateOf(false) }
    var forwarding by remember { mutableStateOf(false) }
    var editDraft by remember { mutableStateOf("") }
    var savingEdit by remember { mutableStateOf(false) }
    var deletingMessage by remember { mutableStateOf(false) }
    var voiceRecordingStartedAt by remember { mutableLongStateOf(0L) }
    var voiceElapsedSeconds by remember { mutableIntStateOf(0) }
    LaunchedEffect(recordingVoice, voiceRecordingStartedAt) {
        if (recordingVoice && voiceRecordingStartedAt > 0L) {
            while (recordingVoice) {
                voiceElapsedSeconds = ((System.currentTimeMillis() - voiceRecordingStartedAt) / 1000L).toInt()
                delay(250L)
            }
        } else {
            voiceElapsedSeconds = 0
        }
    }
    DisposableEffect(peer.id) {
        onDispose {
            val recorder = voiceRecorder
            voiceRecorder = null
            try { recorder?.stop() } catch (_: Exception) { }
            try { recorder?.reset() } catch (_: Exception) { }
            try { recorder?.release() } catch (_: Exception) { }
            voiceFile?.delete()
            voiceFile = null
            recordingVoice = false
        }
    }
    val microphonePermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        errorText = if (granted) "Микрофон разрешён. Удержи кнопку отправки ещё раз для записи." else "Для голосовых сообщений нужно разрешить доступ к микрофону."
    }

    fun startVoiceRecording(): Boolean {
        if (context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            microphonePermission.launch(Manifest.permission.RECORD_AUDIO)
            return false
        }
        var createdRecorder: MediaRecorder? = null
        var createdFile: File? = null
        return try {
            val file = File(context.cacheDir, "voice_${UUID.randomUUID()}.m4a")
            createdFile = file
            val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) MediaRecorder(context) else MediaRecorder()
            createdRecorder = recorder
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC)
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            recorder.setAudioEncodingBitRate(96000)
            recorder.setAudioSamplingRate(44100)
            recorder.setOutputFile(file.absolutePath)
            recorder.prepare()
            recorder.start()
            voiceFile = file
            voiceRecorder = recorder
            voiceRecordingStartedAt = System.currentTimeMillis()
            voiceElapsedSeconds = 0
            recordingVoice = true
            true
        } catch (_: Exception) {
            try { createdRecorder?.reset() } catch (_: Exception) { }
            try { createdRecorder?.release() } catch (_: Exception) { }
            createdFile?.delete()
            voiceRecorder = null
            voiceFile = null
            recordingVoice = false
            voiceRecordingStartedAt = 0L
            voiceElapsedSeconds = 0
            errorText = "Не удалось начать запись. Проверь разрешение микрофона."
            false
        }
    }

    suspend fun finishVoiceRecording(send: Boolean) {
        val recorder = voiceRecorder
        val file = voiceFile
        val recordedSeconds = if (voiceRecordingStartedAt > 0L) {
            ((System.currentTimeMillis() - voiceRecordingStartedAt) / 1000L).toInt()
        } else voiceElapsedSeconds
        voiceRecorder = null
        voiceFile = null
        recordingVoice = false
        voiceRecordingStartedAt = 0L

        var recordingSaved = true
        try {
            recorder?.stop()
        } catch (_: Exception) {
            recordingSaved = false
        } finally {
            try { recorder?.reset() } catch (_: Exception) { }
            try { recorder?.release() } catch (_: Exception) { }
        }

        if (!send || file == null) {
            file?.delete()
            return
        }
        if (!recordingSaved || !file.exists() || file.length() < 1500L || recordedSeconds < 1) {
            file.delete()
            errorText = "Голосовое сообщение не сохранилось. Удерживай кнопку не менее секунды и попробуй ещё раз."
            return
        }
        uploadingAttachment = true
        try {
            if (file.length() > 45L * 1024L * 1024L) error("Голосовая запись превышает допустимый размер 45 МБ.")
            val bytes = withContext(Dispatchers.IO) { file.readBytes() }
            if (bytes.isEmpty()) error("Голосовая запись пустая.")
            val name = "voice_${System.currentTimeMillis()}.m4a"
            val path = "$currentUserId/${UUID.randomUUID()}_$name"
            withContext(Dispatchers.IO) {
                floustreamClient.storage.from("message-media").upload(path, bytes) { contentType = ContentType.parse("audio/mp4") }
            }
            sendDirectAttachment(currentUserId, peer.id, path, name, "audio/mp4")
            refresh()
            errorText = ""
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            errorText = "Не удалось отправить голосовое сообщение: " +
                (e.message?.takeIf { it.isNotBlank() } ?: "проверь интернет и попробуй ещё раз.")
        } finally {
            file.delete()
            uploadingAttachment = false
        }
    }
    var showGallerySourceDialog by remember { mutableStateOf(false) }
    var showVideoRecorder by remember { mutableStateOf(false) }
    var videoCaptureMode by remember { mutableStateOf(VideoCaptureMode.NORMAL_SWITCHABLE) }
    var showPhotoCamera by remember { mutableStateOf(false) }
    var showMediaLibrary by remember { mutableStateOf(false) }
    var mediaLibrary by remember { mutableStateOf<List<MediaLibraryItem>>(emptyList()) }
    var selectedMediaIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    var showPhoneMediaPicker by remember { mutableStateOf(false) }

    fun uploadVideoDraft(file: File) {
        if (videoUploadInProgress) return
        pendingLocalVideo = file
        pendingVideoReady = true
        pendingVideoUploadFailed = false
        videoUploadInProgress = true
        uploadingAttachment = true
        try {
            RoundVideoDiagnostics.record(context, "video draft queued; file=${file.name}; exists=${file.exists()}; bytes=${file.length()}")
            if (!isFinalizedVideoFile(file)) error("Файл видеосообщения не сохранился или ещё не завершён.")
            if (file.length() > 50L * 1024L * 1024L) error("Видео превышает лимит отправки 50 МБ. Файл сохранён в памяти приложения.")
            val draftPrefs = context.getSharedPreferences("floustream_video_drafts", Context.MODE_PRIVATE)
            val draftKey = file.name
            val roundDraft = draftPrefs.getBoolean("${draftKey}_round", videoCaptureMode == VideoCaptureMode.ROUND_FRONT)
            val name = draftPrefs.getString("${draftKey}_name", null) ?: (
                (if (roundDraft) "round_" else "normal_") + "video_" + System.currentTimeMillis() + ".mp4"
            )
            val mime = draftPrefs.getString("${draftKey}_mime", "video/mp4") ?: "video/mp4"
            val objectPath = draftPrefs.getString(draftKey, null) ?: (
                currentUserId + "/" + UUID.randomUUID().toString() + "_" + name
            )
            val saved = draftPrefs.edit()
                .putString(draftKey, objectPath)
                .putString("${draftKey}_peer", peer.id)
                .putString("${draftKey}_name", name)
                .putString("${draftKey}_mime", "video/mp4")
                .putBoolean("${draftKey}_round", roundDraft)
                .commit()
            if (!saved) error("Не удалось сохранить очередь отправки видео.")
            enqueueVideoUploadWorker(context, currentUserId, peer.id, file, draftKey, objectPath, name, mime)
            RoundVideoDiagnostics.record(context, "video draft queued in WorkManager; objectPathStored=true")
            errorText = "Видео отправляется в фоне. Можно выйти из чата."
        } catch (e: Exception) {
            videoUploadInProgress = false
            uploadingAttachment = false
            pendingVideoUploadFailed = true
            RoundVideoDiagnostics.record(context, "video queue failed; type=${e.javaClass.name}; message=${e.message}", e)
            errorText = e.message ?: "Не удалось поставить видео в очередь отправки."
        }
    }

    LaunchedEffect(peer.id, currentUserId) {
        val workManager = WorkManager.getInstance(context)
        val workTag = "floustream-video-peer-${peer.id}"
        var lastSuccessCount = 0
        while (true) {
            val infos = withContext(Dispatchers.IO) {
                workManager.getWorkInfosByTag(workTag).get()
            }
            val active = infos.any {
                it.state == androidx.work.WorkInfo.State.ENQUEUED ||
                    it.state == androidx.work.WorkInfo.State.RUNNING ||
                    it.state == androidx.work.WorkInfo.State.BLOCKED
            }
            videoUploadInProgress = active

            val currentDraftPath = pendingLocalVideo?.absolutePath
            if (!active && currentDraftPath.isNullOrBlank()) {
                val failedBackgroundVideo = infos.firstOrNull { info ->
                    info.state == androidx.work.WorkInfo.State.FAILED &&
                        info.outputData.getString("file_path")?.let { File(it).isFile } == true
                }
                val failedPath = failedBackgroundVideo?.outputData?.getString("file_path")
                if (!failedPath.isNullOrBlank()) {
                    pendingLocalVideo = File(failedPath)
                    pendingVideoReady = true
                    pendingVideoUploadFailed = true
                    uploadingAttachment = false
                    errorText = failedBackgroundVideo.outputData.getString("error")
                        ?: "Видео не отправлено. Файл сохранён — нажми «Повторить»."
                }
            }

            val currentPath = pendingLocalVideo?.absolutePath
            if (!active && !currentPath.isNullOrBlank()) {
                val currentSucceeded = infos.any {
                    it.state == androidx.work.WorkInfo.State.SUCCEEDED &&
                        it.outputData.getString("file_path") == currentPath
                }
                val currentFailed = infos.firstOrNull {
                    it.state == androidx.work.WorkInfo.State.FAILED &&
                        it.outputData.getString("file_path") == currentPath
                }
                if (currentSucceeded) {
                    pendingLocalVideo = null
                    pendingVideoReady = false
                    pendingVideoUploadFailed = false
                    uploadingAttachment = false
                    errorText = ""
                    refresh(silent = true)
                } else if (currentFailed != null) {
                    uploadingAttachment = false
                    pendingVideoUploadFailed = true
                    errorText = currentFailed.outputData.getString("error")
                        ?: "Не удалось отправить видео. Файл сохранён — можно повторить отправку."
                }
            }

            val successCount = infos.count { it.state == androidx.work.WorkInfo.State.SUCCEEDED }
            if (!active && successCount > lastSuccessCount) {
                lastSuccessCount = successCount
                if (pendingLocalVideo == null && errorText.startsWith("Видео отправляется в фоне")) {
                    errorText = ""
                }
                refresh(silent = true)
            }
            delay(1500)
        }
    }

    LaunchedEffect(peer.id, currentUserId) {
        if (pendingLocalVideo == null && currentUserId.isNotBlank()) {
            val draftPrefs = context.getSharedPreferences("floustream_video_drafts", Context.MODE_PRIVATE)
            val draftsDir = File(context.filesDir, "video-drafts")
            val recoverable = withContext(Dispatchers.IO) {
                draftPrefs.all.keys
                    .filter { it.endsWith("_peer") && draftPrefs.getString(it, null) == peer.id }
                    .mapNotNull { peerKey ->
                        val fileName = peerKey.removeSuffix("_peer")
                        val draftFile = File(draftsDir, fileName)
                        if (isFinalizedVideoFile(draftFile)) {
                            fileName to draftFile
                        } else {
                            RoundVideoDiagnostics.record(
                                context,
                                "Skipped incomplete or invalid recovered video draft; file=$fileName; bytes=${draftFile.length()}"
                            )
                            null
                        }
                    }
                    .maxByOrNull { it.second.lastModified() }
            }

            recoverable?.let { (fileName, draftFile) ->
                val workInfos = withContext(Dispatchers.IO) {
                    WorkManager.getInstance(context).getWorkInfosForUniqueWork("floustream-video-$fileName").get()
                }
                val queued = workInfos.any {
                    it.state == androidx.work.WorkInfo.State.ENQUEUED ||
                        it.state == androidx.work.WorkInfo.State.RUNNING ||
                        it.state == androidx.work.WorkInfo.State.BLOCKED
                }
                val isRound = draftPrefs.getBoolean("${fileName}_round", true)
                videoCaptureMode = if (isRound) VideoCaptureMode.ROUND_FRONT else VideoCaptureMode.NORMAL_SWITCHABLE
                pendingLocalVideo = draftFile
                pendingVideoReady = true
                pendingVideoUploadFailed = !queued
                videoUploadInProgress = queued
                errorText = if (queued) {
                    "Видео уже отправляется в фоне. Можно выйти из чата."
                } else {
                    "Найдено несохранённое видео. Нажми «Повторить», чтобы продолжить отправку."
                }
                RoundVideoDiagnostics.record(context, "Recovered pending video draft for current chat; queued=$queued; file=$fileName; bytes=${draftFile.length()}")
            }
        }
    }

    fun uploadPickedAttachments(uris: List<Uri>) {
        if (uris.isNotEmpty() && !uploadingAttachment) scope.launch {
            uploadingAttachment = true
            var sentCount = 0
            var queuedVideoCount = 0
            val failures = mutableListOf<String>()
            try {
                uris.forEach { uri ->
                    var name = "attachment"
                    try {
                        val resolver = context.contentResolver
                        var mime = (resolver.getType(uri)?.substringBefore(';')?.trim()?.lowercase())
                            ?.takeIf { it.contains('/') } ?: "application/octet-stream"
                        var declaredSize = -1L
                        name = resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { cursor ->
                            if (cursor.moveToFirst()) {
                                declaredSize = cursor.getLong(cursor.getColumnIndexOrThrow(OpenableColumns.SIZE))
                                cursor.getString(cursor.getColumnIndexOrThrow(OpenableColumns.DISPLAY_NAME))
                            } else null
                        } ?: "attachment"
                        if (declaredSize > 50L * 1024L * 1024L) error("$name: размер превышает 50 МБ.")
                        if (mime.startsWith("video/")) {
                            val safeName = name.substringAfterLast('/').replace(Regex("[^A-Za-z0-9._-]"), "_").take(100).ifBlank { "video.mp4" }
                            val draftKey = "picked_video_${UUID.randomUUID()}.mp4"
                            val draftsDir = File(context.filesDir, "video-drafts").apply { mkdirs() }
                            val persistentVideo = File(draftsDir, draftKey)
                            val objectPath = "$currentUserId/${UUID.randomUUID()}_$safeName"
                            // Photo Picker grants temporary URI access. Finish the copy and enqueue
                            // the durable worker in a NonCancellable section so leaving this chat
                            // cannot cancel preparation and delete the only copy of the video.
                            withContext(NonCancellable + Dispatchers.IO) {
                                try {
                                    resolver.openInputStream(uri)?.use { input ->
                                        persistentVideo.outputStream().buffered().use { output ->
                                            val buffer = ByteArray(256 * 1024)
                                            var total = 0L
                                            while (true) {
                                                val read = input.read(buffer)
                                                if (read < 0) break
                                                total += read
                                                if (total > 50L * 1024L * 1024L) error("$name: размер превышает 50 МБ.")
                                                output.write(buffer, 0, read)
                                            }
                                        }
                                    } ?: error("Не удалось прочитать видео.")
                                    if (persistentVideo.length() <= 0L) error("$name: видео пустое или недоступно.")
                                    val draftPrefs = context.getSharedPreferences("floustream_video_drafts", Context.MODE_PRIVATE)
                                    val saved = draftPrefs.edit()
                                        .putString(draftKey, objectPath)
                                        .putString("${draftKey}_peer", peer.id)
                                        .putString("${draftKey}_name", name)
                                        .putString("${draftKey}_mime", mime)
                                        .putBoolean("${draftKey}_round", false)
                                        .commit()
                                    if (!saved) error("Не удалось сохранить очередь отправки видео.")
                                    enqueueVideoUploadWorker(context, currentUserId, peer.id, persistentVideo, draftKey, objectPath, name, mime)
                                    RoundVideoDiagnostics.record(context, "gallery video copied to persistent draft and queued; bytes=${persistentVideo.length()}")
                                } catch (error: Exception) {
                                    persistentVideo.delete()
                                    throw error
                                }
                            }
                            queuedVideoCount++
                            return@forEach
                        }
                        var bytes = withContext(Dispatchers.IO) {
                            resolver.openInputStream(uri)?.use { it.readBytes() } ?: error("Не удалось прочитать файл.")
                        }
                        // Android gallery providers may return HEIC/HEIF/AVIF images.
                        // The chat renderer reliably supports JPEG, so normalize these formats
                        // before upload instead of storing an image the recipient cannot decode.
                        val lowerName = name.lowercase()
                        val needsImageNormalization = mime in setOf("image/heic", "image/heif", "image/avif") ||
                            lowerName.endsWith(".heic") || lowerName.endsWith(".heif") || lowerName.endsWith(".avif")
                        if (needsImageNormalization && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                            val normalized = withContext(Dispatchers.IO) {
                                try {
                                    val source = android.graphics.ImageDecoder.createSource(resolver, uri)
                                    val bitmap = android.graphics.ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
                                        decoder.allocator = android.graphics.ImageDecoder.ALLOCATOR_SOFTWARE
                                        val maxDimension = 2048
                                        val scale = minOf(1f, maxDimension.toFloat() / maxOf(info.size.width, info.size.height).toFloat())
                                        decoder.setTargetSize(
                                            (info.size.width * scale).toInt().coerceAtLeast(1),
                                            (info.size.height * scale).toInt().coerceAtLeast(1)
                                        )
                                    }
                                    val output = java.io.ByteArrayOutputStream()
                                    val saved = bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 92, output)
                                    bitmap.recycle()
                                    if (saved) output.toByteArray() else null
                                } catch (_: Exception) { null }
                            }
                            if (normalized != null && normalized.isNotEmpty()) {
                                bytes = normalized
                                mime = "image/jpeg"
                                name = name.substringBeforeLast('.', name) + ".jpg"
                            }
                        }
                        if (bytes.isEmpty()) error("$name: файл пустой или недоступен.")
                        if (bytes.size > 50 * 1024 * 1024) error("$name: размер превышает 50 МБ.")
                        val safeName = name.substringAfterLast('/').replace(Regex("[^A-Za-z0-9._-]"), "_").take(100).ifBlank { "attachment" }
                        val path = "$currentUserId/${UUID.randomUUID()}_$safeName"
                        withContext(Dispatchers.IO) {
                            floustreamClient.storage.from("message-media").upload(path, bytes) {
                                contentType = ContentType.parse(mime)
                            }
                        }
                        sendDirectAttachment(currentUserId, peer.id, path, name, mime)
                        sentCount++
                    } catch (e: Exception) {
                        if (e is kotlinx.coroutines.CancellationException) throw e
                        val reason = e.message?.takeIf { it.isNotBlank() } ?: "ошибка загрузки или сохранения сообщения"
                        failures += "$name: $reason"
                    }
                }
                if (sentCount > 0) refresh()
                errorText = when {
                    failures.isNotEmpty() -> "Отправлено $sentCount, видео в очереди $queuedVideoCount. ${failures.distinct().joinToString("; ")}"
                    queuedVideoCount > 0 -> "Видео отправляется в фоне. Можно выйти из чата."
                    else -> ""
                }
            } finally {
                uploadingAttachment = false
            }
        }
    }

    LaunchedEffect(peer.id, currentUserId, isResumed) {
        if (isResumed) {
            // Paint the last locally cached page immediately; the network refresh below reconciles it.
            if (messages.isEmpty()) {
                val cached = withContext(Dispatchers.IO) { readCachedChatMessages(context, currentUserId, peer.id) }
                if (cached.isNotEmpty()) {
                    Snapshot.withMutableSnapshot { messages.addAll(cached) }
                    hasMoreOlderMessages = cached.size >= 500
                    loading = false
                }
            }
            // Notification/deep-link launches can race session restoration or a brief
            // network wake-up. Retry once before showing a red error to the user.
            var loaded = refresh(silent = true)
            if (!loaded && messages.isEmpty() && isResumed) {
                loading = true
                delay(900)
                if (isResumed) loaded = refresh(silent = true)
                if (!loaded && messages.isEmpty() && isResumed) {
                    delay(1800)
                    if (isResumed) refresh(silent = false)
                }
            }

            // Recreate the channel after transient socket failures instead of
            // remaining in polling mode until the user leaves and reopens the chat.
            var reconnectDelayMs = 5_000L
            while (isResumed) {
                val channel = floustreamClient.channel("direct-chat:$currentUserId:${peer.id}")
                val messageChanges = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
                    table = "direct_messages"
                }
                val reactionChanges = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
                    table = "direct_message_reactions"
                }
                val messageCollector = launch {
                    try {
                        messageChanges.collect { if (isResumed) refresh(silent = true) }
                    } catch (e: Exception) {
                        if (e is kotlinx.coroutines.CancellationException) throw e
                    }
                }
                val reactionCollector = launch {
                    try {
                        reactionChanges.collect { if (isResumed) refresh(silent = true) }
                    } catch (e: Exception) {
                        if (e is kotlinx.coroutines.CancellationException) throw e
                    }
                }

                try {
                    val accessToken = floustreamClient.auth.currentSessionOrNull()?.accessToken
                        ?: throw IllegalStateException("Нет активной сессии для синхронизации.")
                    floustreamClient.realtime.setAuth(accessToken)
                    floustreamClient.realtime.connect()
                    // Wait for the server to confirm the subscription before treating Realtime as active.
                    channel.subscribe(blockUntilSubscribed = true)
                    reconnectDelayMs = 5_000L

                    // Periodic safety refresh covers events missed during short socket interruptions.
                    var safetySyncElapsed = 0
                    while (isResumed) {
                        delay(5_000)
                        if (messageCollector.isCompleted || reactionCollector.isCompleted) {
                            throw IllegalStateException("Realtime change stream stopped.")
                        }
                        safetySyncElapsed += 5
                        if (safetySyncElapsed >= 30) {
                            if (isResumed) refresh(silent = true)
                            safetySyncElapsed = 0
                        }
                    }
                } catch (cancelled: kotlinx.coroutines.CancellationException) {
                    throw cancelled
                } catch (_: Exception) {
                    // Keep messages current while waiting, then try to establish Realtime again.
                    var waitedMs = 0L
                    while (isResumed && waitedMs < reconnectDelayMs) {
                        delay(5_000)
                        waitedMs += 5_000
                        if (isResumed) refresh(silent = true)
                    }
                    reconnectDelayMs = (reconnectDelayMs * 2).coerceAtMost(30_000L)
                } finally {
                    messageCollector.cancel()
                    reactionCollector.cancel()
                    try { floustreamClient.realtime.removeChannel(channel) } catch (_: Exception) { }
                }
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        ChatAtmosphereBackground()
        Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().background(Color(0xAA111A2D)).padding(horizontal = 8.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("‹", Modifier.clickable { onBack() }.padding(horizontal = 10.dp), color = White, fontSize = 32.sp)
            Avatar((peer.displayName ?: peer.username ?: "D").take(1).uppercase(), avatarUrl = peer.avatarUrl)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(peer.displayName ?: peer.username ?: "Пользователь", color = White, fontWeight = FontWeight.Bold, maxLines = 1)
                Text(if (peer.isDeleted) "История переписки сохранена" else peer.username?.let { "@$it" } ?: "FLOUSTREAM", color = Muted, fontSize = 10.sp)
            }
            Text("★", Modifier.clickable {
                showFavoritesOnly = !showFavoritesOnly
                if (showFavoritesOnly) chatSearchOpen = false
            }.padding(horizontal = 7.dp, vertical = 6.dp), color = if (showFavoritesOnly) Color(0xFFFFD36A) else White, fontSize = 20.sp)
            Text("☎", Modifier.clickable {
                Toast.makeText(context, "Аудиозвонки появятся в следующем этапе", Toast.LENGTH_SHORT).show()
            }.padding(horizontal = 7.dp, vertical = 6.dp), color = White, fontSize = 21.sp)
            Text("⌕", Modifier.clickable {
                chatSearchOpen = !chatSearchOpen
                if (!chatSearchOpen) {
                    chatSearchQuery = ""
                    chatSearchDate = ""
                    chatSearchMediaFilter = "Все"
                    chatSearchIndex = -1
                }
            }.padding(horizontal = 8.dp, vertical = 6.dp), color = White, fontSize = 25.sp)
            Text("▣", Modifier.clickable {
                Toast.makeText(context, "Видеозвонки появятся в следующем этапе", Toast.LENGTH_SHORT).show()
            }.padding(horizontal = 7.dp, vertical = 6.dp), color = White, fontSize = 20.sp)
        }
        if (chatSearchOpen) {
            Column(
                Modifier.fillMaxWidth().background(PanelSoft).padding(horizontal = 10.dp, vertical = 6.dp),
                verticalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = chatSearchQuery,
                        onValueChange = { chatSearchQuery = it; chatSearchIndex = -1 },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        placeholder = { Text("Поиск в переписке", color = Muted) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = White,
                            unfocusedTextColor = White,
                            focusedBorderColor = Blue,
                            unfocusedBorderColor = Muted,
                            cursorColor = Blue
                        )
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(if (chatSearchQuery.isBlank() && chatSearchDate.isBlank() && chatSearchMediaFilter == "Все") "—" else "${filteredMessages.size}", color = Muted, fontSize = 11.sp)
                    TextButton(
                        enabled = filteredMessages.isNotEmpty(),
                        onClick = {
                            if (filteredMessages.isNotEmpty()) {
                                chatSearchIndex = if (chatSearchIndex < 0) filteredMessages.lastIndex
                                    else (chatSearchIndex - 1 + filteredMessages.size) % filteredMessages.size
                                val targetIndex = filteredMessages.indexOfFirst { it.id == filteredMessages[chatSearchIndex].id }
                                if (targetIndex >= 0) scope.launch { messageListState.animateScrollToItem(targetIndex) }
                            }
                        },
                        contentPadding = PaddingValues(horizontal = 2.dp)
                    ) { Text("↑", color = White) }
                    TextButton(
                        enabled = filteredMessages.isNotEmpty(),
                        onClick = {
                            if (filteredMessages.isNotEmpty()) {
                                chatSearchIndex = (chatSearchIndex + 1).mod(filteredMessages.size)
                                val targetIndex = filteredMessages.indexOfFirst { it.id == filteredMessages[chatSearchIndex].id }
                                if (targetIndex >= 0) scope.launch { messageListState.animateScrollToItem(targetIndex) }
                            }
                        },
                        contentPadding = PaddingValues(horizontal = 2.dp)
                    ) { Text("↓", color = White) }
                }
                Row(
                    Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    listOf("Все", "Фото", "Видео", "Аудио", "Файлы").forEach { filter ->
                        TextButton(
                            onClick = { chatSearchMediaFilter = filter; chatSearchIndex = -1 },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)
                        ) {
                            Text(filter, color = if (chatSearchMediaFilter == filter) Blue else Muted, fontSize = 11.sp)
                        }
                    }
                    OutlinedTextField(
                        value = chatSearchDate,
                        onValueChange = { value -> chatSearchDate = value.take(10); chatSearchIndex = -1 },
                        modifier = Modifier.width(150.dp),
                        singleLine = true,
                        placeholder = { Text("ДД.ММ.ГГГГ", color = Muted, fontSize = 11.sp) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = White,
                            unfocusedTextColor = White,
                            focusedBorderColor = Blue,
                            unfocusedBorderColor = Muted,
                            cursorColor = Blue
                        )
                    )
                }
                if (chatSearchDate.isNotBlank() && normalizedSearchDate.isBlank()) {
                    Text("Дата: ДД.ММ.ГГГГ или ГГГГ-ММ-ДД", color = Muted, fontSize = 10.sp)
                }
            }
        }
        if (peer.isDeleted) {
            Text("Этот аккаунт удалён. История сообщений сохранена, отправка новых сообщений недоступна.", Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp), color = Muted, fontSize = 12.sp)
        }
        if (errorText.isNotBlank()) {
            Text(errorText, Modifier.fillMaxWidth().padding(10.dp), color = Color(0xFFFF9AA8), fontSize = 11.sp)
        }
        if (recordingVoice) {
            Text(
                "● Запись ${voiceElapsedSeconds / 60}:" + String.format("%02d", voiceElapsedSeconds % 60) + " — отпусти для отправки",
                Modifier.fillMaxWidth().background(PanelSoft).padding(horizontal = 16.dp, vertical = 9.dp),
                color = Color(0xFFFF8EAD), fontSize = 12.sp, fontWeight = FontWeight.SemiBold
            )
        }
        val firstPinnedMessage = messages.firstOrNull { it.id in pinnedMessageIds }
        if (firstPinnedMessage != null) {
            Surface(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp)
                    .clickable {
                        val index = messages.indexOfFirst { it.id == firstPinnedMessage.id }
                        if (index >= 0) scope.launch { messageListState.animateScrollToItem(index) }
                    },
                color = PanelSoft,
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(Modifier.padding(horizontal = 12.dp, vertical = 9.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("📌", fontSize = 16.sp)
                    Spacer(Modifier.width(8.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Закреплённое сообщение", color = Color(0xFF9FCBFF), fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                        Text((firstPinnedMessage.content.ifBlank { firstPinnedMessage.attachmentName ?: "Вложение" }).take(90), color = White, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Text("Перейти", color = Muted, fontSize = 10.sp)
                }
            }
        }
        LazyColumn(
            state = messageListState,
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = PaddingValues(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (messages.isNotEmpty() && hasMoreOlderMessages) {
                item(key = "load_older_messages") {
                    TextButton(
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !loadingOlderMessages,
                        onClick = {
                            scope.launch {
                                loadingOlderMessages = true
                                try {
                                    val oldestMessage = messages.firstOrNull()
                                    val oldestTimestamp = oldestMessage?.createdAt
                                    val oldestId = oldestMessage?.id
                                    if (oldestTimestamp.isNullOrBlank() || oldestId.isNullOrBlank()) {
                                        hasMoreOlderMessages = false
                                    } else {
                                        val older = loadDirectMessagesPage(currentUserId, peer.id, oldestTimestamp, oldestId)
                                        val existingIds = messages.mapTo(hashSetOf()) { it.id }
                                        val additions = older.filterNot { it.id in existingIds }
                                        if (additions.isNotEmpty()) {
                                            // Keep the prepend atomic; stable LazyColumn keys preserve the visible anchor.
                                            Snapshot.withMutableSnapshot { messages.addAll(0, additions) }
                                            withContext(Dispatchers.IO) { writeCachedChatMessages(context, currentUserId, peer.id, messages.toList()) }
                                            val olderReactions = try {
                                                loadDirectMessageReactions(additions.map { it.id })
                                            } catch (e: Exception) {
                                                if (e is kotlinx.coroutines.CancellationException) throw e
                                                emptyMap()
                                            }
                                            reactions = reactions + olderReactions
                                            val allIds = messages.map { it.id }.toSet()
                                            val loadedPins = try {
                                                loadDirectMessagePins(currentUserId)
                                            } catch (e: Exception) {
                                                if (e is kotlinx.coroutines.CancellationException) throw e
                                                pinnedMessageIds
                                            }
                                            pinnedMessageIds = loadedPins.intersect(allIds)
                                            val loadedFavorites = try {
                                                loadDirectMessageFavorites(currentUserId)
                                            } catch (e: Exception) {
                                                if (e is kotlinx.coroutines.CancellationException) throw e
                                                favoriteMessageIds
                                            }
                                            favoriteMessageIds = loadedFavorites.intersect(allIds)
                                        }
                                        hasMoreOlderMessages = older.size >= 100 && additions.isNotEmpty()
                                    }
                                } catch (e: Exception) {
                                    if (e is kotlinx.coroutines.CancellationException) throw e
                                    errorText = e.message ?: "Не удалось загрузить старые сообщения."
                                } finally {
                                    loadingOlderMessages = false
                                }
                            }
                        }
                    ) {
                        Text(if (loadingOlderMessages) "Загружаем старые сообщения…" else "↑ Загрузить более ранние сообщения", color = Blue)
                    }
                }
            }
            if (loading && messages.isEmpty()) {
                item { Text("Загружаем переписку…", color = Muted) }
            } else if (messages.isEmpty()) {
                item { Text("Это начало вашей переписки. Отправь первое сообщение!", Modifier.fillMaxWidth().padding(20.dp), color = Muted, fontSize = 13.sp) }
            } else if (visibleMessages.isEmpty() && showFavoritesOnly) {
                item { Text("В этой переписке пока нет избранных сообщений.", Modifier.fillMaxWidth().padding(20.dp), color = Muted, fontSize = 13.sp) }
            } else if (visibleMessages.isEmpty() && chatSearchOpen) {
                item {
                    Text(
                        "По этим условиям ничего не найдено.",
                        Modifier.fillMaxWidth().padding(20.dp),
                        color = Muted,
                        fontSize = 13.sp
                    )
                }
            }
            items(visibleMessages, key = { it.id }) { msg ->
                val mine = msg.senderId == currentUserId
                val isImageAttachment = !msg.attachmentPath.isNullOrBlank() &&
                    msg.attachmentMime.orEmpty().startsWith("image/")
                val isVoiceAttachment = !msg.attachmentPath.isNullOrBlank() &&
                    msg.attachmentMime.orEmpty().startsWith("audio/")
                val hasAttachment = !msg.attachmentPath.isNullOrBlank()
                Row(
                    Modifier.fillMaxWidth().padding(start = if (hasAttachment) 7.dp else 0.dp),
                    horizontalArrangement = if (hasAttachment) Arrangement.Start else if (mine) Arrangement.End else Arrangement.Start
                ) {
                    Column(horizontalAlignment = if (hasAttachment) Alignment.Start else if (mine) Alignment.End else Alignment.Start) {
                        Surface(
                            color = if (isImageAttachment) Color.Transparent
                                else if (isVoiceAttachment) Color(0xD918243B)
                                else if (mine) Color(0xD9254D91) else Color(0xD918243B),
                            shape = RoundedCornerShape(12.dp),
                            shadowElevation = if (isImageAttachment) 0.dp else 5.dp,
                            border = if (isVoiceAttachment) androidx.compose.foundation.BorderStroke(
                                0.5.dp, Color(0x334D8BFF)
                            ) else null,
                            modifier = Modifier.widthIn(max = if (isImageAttachment || msg.attachmentMime.orEmpty().startsWith("video/")) 360.dp else 290.dp)
                                .combinedClickable(
                                    onClick = { },
                                    onLongClick = { pendingMessageActions = msg }
                                )
                        ) {
                            Column(
                                Modifier.padding(
                                    horizontal = if (!msg.attachmentPath.isNullOrBlank() &&
                                        msg.attachmentMime.orEmpty().startsWith("image/")) 2.dp else 13.dp,
                                    vertical = if (!msg.attachmentPath.isNullOrBlank() &&
                                        msg.attachmentMime.orEmpty().startsWith("image/")) 2.dp else 9.dp
                                )
                            ) {
                                if (msg.id in pinnedMessageIds) {
                                    Text("📌 Закреплено", color = Color(0xFF9FCBFF), fontSize = 9.sp, fontWeight = FontWeight.SemiBold)
                                }
                                msg.replyToMessageId?.let { replyId ->
                                    messages.firstOrNull { it.id == replyId }?.let { quoted ->
                                        Text(
                                            "↪ " + (quoted.content.ifBlank { quoted.attachmentName ?: "Вложение" }).take(90),
                                            color = Color(0xFFBBD5FF),
                                            fontSize = 11.sp,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                                if (!msg.attachmentPath.isNullOrBlank()) {
                                    MessageAttachment(msg)
                                    if (!msg.content.isNullOrBlank() && msg.content != msg.attachmentName) {
                                        Text(msg.content, color = White, fontSize = 13.sp)
                                    }
                                } else Text(msg.content, color = White, fontSize = 14.sp)
                                if (msg.editedAt != null) Text("изменено", color = Color(0xFFB4C7E5), fontSize = 9.sp)
                                Row(
                                    Modifier.align(Alignment.End),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(3.dp)
                                ) {
                                    Text(
                                        msg.createdAt.substringAfter("T").take(5),
                                        color = Color(0xFFB4C7E5), fontSize = 9.sp
                                    )
                                    if (mine) {
                                        Text(
                                            if (msg.readAt != null) "✓✓" else "✓",
                                            color = if (msg.readAt != null) Color(0xFF72C8FF) else Color(0xFFB4C7E5),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                        val messageReactions = reactions[msg.id].orEmpty().groupBy { it.emoji }
                        if (messageReactions.isNotEmpty()) {
                            Row(Modifier.padding(top = 3.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                messageReactions.forEach { (emoji, users) ->
                                    val mineReaction = users.any { it.userId == currentUserId }
                                    Surface(
                                        color = if (mineReaction) Color(0xFF315A91) else PanelSoft,
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text("$emoji ${users.size}", Modifier.padding(horizontal = 7.dp, vertical = 3.dp), color = White, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            pendingLocalVideo?.let { localFile ->
                item(key = "pending-local-video") {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        Column(
                            Modifier.widthIn(max = 290.dp).background(Color(0xFF254D91), RoundedCornerShape(12.dp)).padding(9.dp),
                            horizontalAlignment = Alignment.End
                        ) {
                            if (pendingVideoReady) {
                                VideoMessagePlayer(
                                    localFile.toURI().toString(),
                                    isRound = videoCaptureMode == VideoCaptureMode.ROUND_FRONT
                                ) { }
                            } else {
                                val isRoundDraft = videoCaptureMode == VideoCaptureMode.ROUND_FRONT
                                Box(
                                    Modifier.size(if (isRoundDraft) 190.dp else 250.dp, if (isRoundDraft) 190.dp else 150.dp)
                                        .clip(if (isRoundDraft) CircleShape else RoundedCornerShape(18.dp))
                                        .background(Color.Black),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        CircularProgressIndicator(Modifier.size(22.dp), color = Blue, strokeWidth = 2.dp)
                                        Spacer(Modifier.height(7.dp))
                                        Text("Подготавливаем видео…", color = White, fontSize = 10.sp)
                                    }
                                }
                            }
                            Spacer(Modifier.height(5.dp))
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                if (videoUploadInProgress) CircularProgressIndicator(Modifier.size(12.dp), color = White, strokeWidth = 1.5.dp)
                                Text(
                                    if (pendingVideoUploadFailed) "Сохранено · отправка не удалась" else "Отправляется…",
                                    color = Color(0xFFB4C7E5), fontSize = 10.sp
                                )
                                if (pendingVideoUploadFailed) {
                                    TextButton(
                                        onClick = { uploadVideoDraft(localFile) },
                                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp)
                                    ) { Text("Повторить", color = Color(0xFF9FCBFF), fontSize = 10.sp) }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (!peer.isDeleted) Column(
            Modifier.fillMaxWidth().background(Color(0xAA111A2D))
        ) {
            replyToMessage?.let { quoted ->
                Row(
                    Modifier.fillMaxWidth().padding(start = 12.dp, end = 12.dp, top = 8.dp, bottom = 2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("Ответ на сообщение", color = Color(0xFF9FCBFF), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        Text((quoted.content.ifBlank { quoted.attachmentName ?: "Вложение" }).take(100), color = Muted, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Text("×", Modifier.clickable { replyToMessage = null }.padding(8.dp), color = White, fontSize = 20.sp)
                }
            }
            Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            FanMediaButton(
                onPhoto = {
                    if (uploadingAttachment) errorText = "Дождись завершения текущей отправки."
                    else showPhotoCamera = true
                },
                onVideo = {
                    if (pendingLocalVideo != null) errorText = "Сначала отправь сохранённое видео или нажми «Повторить» в его сообщении."
                    else { videoCaptureMode = VideoCaptureMode.NORMAL_SWITCHABLE; showVideoRecorder = true }
                },
                onGallery = { showGallerySourceDialog = true }
            )
            OutlinedTextField(
                value = draft, onValueChange = { draft = it },
                modifier = Modifier.weight(1f).padding(horizontal = 7.dp),
                placeholder = { Text("Сообщение", color = Muted) },
                shape = RoundedCornerShape(24.dp),
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = {
                    val text = draft.trim()
                    if (text.isNotEmpty() && !sending) {
                        scope.launch {
                            sending = true
                            try {
                                sendDirectMessage(currentUserId, peer.id, text, replyToMessage?.id)
                                draft = ""
                                replyToMessage = null
                                refresh()
                            } catch (e: Exception) {
                                if (e is kotlinx.coroutines.CancellationException) throw e
                                errorText = e.message ?: "Не удалось отправить сообщение."
                            } finally { sending = false }
                        }
                    }
                })
            )
            Surface(
                modifier = Modifier.size(44.dp).pointerInput(draft, sending, uploadingAttachment) {
                    awaitEachGesture {
                        val down = awaitFirstDown(requireUnconsumed = false)
                        val startedAt = System.currentTimeMillis()
                        var movedToCancel = false
                        val longHold = withTimeoutOrNull(450L) {
                            while (true) {
                                val event = awaitPointerEvent()
                                val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                if (!change.pressed) break
                                if (change.position.x < down.position.x - 72.dp.toPx()) {
                                    movedToCancel = true
                                    break
                                }
                            }
                            false
                        } ?: true
                        if (longHold && !movedToCancel) {
                            val started = startVoiceRecording()
                            if (started) {
                                while (true) {
                                    val event = awaitPointerEvent()
                                    val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                    if (change.position.x < down.position.x - 90.dp.toPx()) movedToCancel = true
                                    if (!change.pressed) break
                                }
                                scope.launch { finishVoiceRecording(!movedToCancel) }
                            }
                        } else if (!movedToCancel && System.currentTimeMillis() - startedAt < 2000L) {
                            val text = draft.trim()
                            if (text.isNotEmpty() && !sending && !uploadingAttachment) {
                                scope.launch {
                                    sending = true
                                    try {
                                        sendDirectMessage(currentUserId, peer.id, text, replyToMessage?.id)
                                        draft = ""
                                        replyToMessage = null
                                        refresh()
                                    } catch (e: Exception) {
                                        if (e is kotlinx.coroutines.CancellationException) throw e
                                        errorText = "Не удалось отправить сообщение. Проверь интернет и попробуй ещё раз."
                                    } finally { sending = false }
                                }
                            }
                        }
                    }
                },
                color = if (recordingVoice) Violet else Blue, shape = CircleShape
            ) {
                Box(contentAlignment = Alignment.Center) {
                    when {
                        sending || uploadingAttachment -> CircularProgressIndicator(modifier = Modifier.size(18.dp), color = White)
                        recordingVoice -> Text(
                            "● " + String.format("%d:%02d", voiceElapsedSeconds / 60, voiceElapsedSeconds % 60),
                            color = White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        else -> Text("➤", color = White, fontSize = 20.sp)
                    }
                }
            }
        }
    }
    }

    if (showPhotoCamera) {
        PhotoCameraCapture(
            onDismiss = { showPhotoCamera = false },
            onPhotoCaptured = { file ->
                showPhotoCamera = false
                scope.launch {
                    uploadingAttachment = true
                    try {
                        if (!file.isFile || file.length() <= 0L) error("Снимок не сохранился.")
                        if (file.length() > 50L * 1024L * 1024L) error("Фото превышает допустимый размер 50 МБ.")
                        val name = "photo_${System.currentTimeMillis()}.jpg"
                        val path = "$currentUserId/${UUID.randomUUID()}_$name"
                        val bytes = withContext(Dispatchers.IO) { file.readBytes() }
                        withContext(Dispatchers.IO) {
                            floustreamClient.storage.from("message-media").upload(path, bytes) {
                                contentType = ContentType.parse("image/jpeg")
                            }
                        }
                        sendDirectAttachment(currentUserId, peer.id, path, name, "image/jpeg")
                        refresh()
                        errorText = ""
                    } catch (e: Exception) {
                        if (e is kotlinx.coroutines.CancellationException) throw e
                        errorText = "Не удалось отправить фото: " + (e.message ?: "попробуй ещё раз.")
                    } finally {
                        file.delete()
                        uploadingAttachment = false
                    }
                }
            }
        )
    }

    if (showVideoRecorder) {
        RoundVideoRecorder(
            mode = videoCaptureMode,
            onDismiss = { showVideoRecorder = false },
            onRecordingFinishing = { file ->
                showVideoRecorder = false
                pendingLocalVideo = file
                pendingVideoReady = false
                pendingVideoUploadFailed = false
                context.getSharedPreferences("floustream_video_drafts", Context.MODE_PRIVATE).edit()
                    .putString("${file.name}_peer", peer.id)
                    .putBoolean("${file.name}_round", videoCaptureMode == VideoCaptureMode.ROUND_FRONT)
                    .apply()
                scope.launch {
                    delay(40L)
                    val lastIndex = messageListState.layoutInfo.totalItemsCount - 1
                    if (lastIndex >= 0) messageListState.animateScrollToItem(lastIndex)
                }
            },
            onError = { message ->
                errorText = message
                showVideoRecorder = false
                if (!pendingVideoReady) pendingLocalVideo = null
            },
            onRecorded = { file ->
                showVideoRecorder = false
                pendingLocalVideo = file
                pendingVideoReady = true
                pendingVideoUploadFailed = false
                scope.launch {
                    delay(60L)
                    val lastIndex = messageListState.layoutInfo.totalItemsCount - 1
                    if (lastIndex >= 0) messageListState.animateScrollToItem(lastIndex)
                }
                uploadVideoDraft(file)
            }
        )
    }

    if (pendingMessageActions != null) {
        val target = pendingMessageActions!!
        AlertDialog(
            onDismissRequest = { pendingMessageActions = null },
            containerColor = Panel,
            title = { Text("Действия с сообщением", color = White) },
            text = {
                Column {
                    Text((target.content.ifBlank { target.attachmentName ?: "Вложение" }).take(180), color = Muted, fontSize = 12.sp)
                    Spacer(Modifier.height(8.dp))
                    TextButton(onClick = {
                        val textToCopy = target.content.takeIf { it.isNotBlank() } ?: target.attachmentName.orEmpty()
                        val clipboard = context.getSystemService(android.content.ClipboardManager::class.java)
                        clipboard?.setPrimaryClip(android.content.ClipData.newPlainText("FLOUSTREAM message", textToCopy))
                        pendingMessageActions = null
                        Toast.makeText(context, "Скопировано", Toast.LENGTH_SHORT).show()
                    }) { Text("Копировать", color = White) }
                    Text("Реакция", color = Color(0xFF9FCBFF), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        listOf("👍", "❤️", "😂", "😮", "😢", "🙏").forEach { emoji ->
                            TextButton(
                                onClick = {
                                    val current = reactions[target.id].orEmpty()
                                        .firstOrNull { it.userId == currentUserId }?.emoji
                                    scope.launch {
                                        try {
                                            setDirectMessageReaction(currentUserId, target.id, emoji, current)
                                            refresh(silent = true)
                                        } catch (e: Exception) {
                                            if (e is kotlinx.coroutines.CancellationException) throw e
                                            errorText = e.message ?: "Не удалось сохранить реакцию."
                                        }
                                    }
                                    pendingMessageActions = null
                                },
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp)
                            ) { Text(emoji, fontSize = 20.sp) }
                        }
                    }
                    TextButton(
                        onClick = {
                            val shouldFavorite = target.id !in favoriteMessageIds
                            scope.launch {
                                try {
                                    setDirectMessageFavorite(currentUserId, target.id, shouldFavorite)
                                    favoriteMessageIds = if (shouldFavorite) favoriteMessageIds + target.id else favoriteMessageIds - target.id
                                    Toast.makeText(context, if (shouldFavorite) "Добавлено в избранное" else "Убрано из избранного", Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    if (e is kotlinx.coroutines.CancellationException) throw e
                                    errorText = e.message ?: "Не удалось изменить избранное."
                                }
                            }
                            pendingMessageActions = null
                        }
                    ) { Text(if (target.id in favoriteMessageIds) "★ Убрать из избранного" else "☆ В избранное", color = Color(0xFFFFD36A)) }
                    TextButton(
                        onClick = {
                            val shouldPin = target.id !in pinnedMessageIds
                            scope.launch {
                                try {
                                    setDirectMessagePin(currentUserId, target.id, shouldPin)
                                    pinnedMessageIds = if (shouldPin) pinnedMessageIds + target.id else pinnedMessageIds - target.id
                                    Toast.makeText(context, if (shouldPin) "Сообщение закреплено" else "Закрепление снято", Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    if (e is kotlinx.coroutines.CancellationException) throw e
                                    errorText = e.message ?: "Не удалось изменить закрепление."
                                }
                            }
                            pendingMessageActions = null
                        }
                    ) { Text(if (target.id in pinnedMessageIds) "Открепить" else "Закрепить", color = White) }
                    TextButton(onClick = {
                        messageInfoTarget = target
                        pendingMessageActions = null
                    }) { Text("Информация", color = White) }
                    TextButton(onClick = {
                        forwardingMessage = target
                        forwardTargetQuery = ""
                        forwardCandidates = emptyList()
                        pendingMessageActions = null
                    }) { Text("Переслать", color = White) }
                    if (target.senderId == currentUserId && target.attachmentPath.isNullOrBlank()) TextButton(onClick = {
                        editDraft = target.content
                        editingMessage = target
                        pendingMessageActions = null
                    }) { Text("Изменить", color = White) }
                    TextButton(onClick = {
                        replyToMessage = target
                        pendingMessageActions = null
                    }) { Text("Ответить", color = White) }
                    TextButton(onClick = {
                        pendingMessageActions = null
                        pendingDeleteMessage = target
                    }) { Text("Удалить", color = Color(0xFFFF9AAA)) }
                }
            },
            confirmButton = { TextButton(onClick = { pendingMessageActions = null }) { Text("Закрыть", color = White) } }
        )
    }

    if (messageInfoTarget != null) {
        val info = messageInfoTarget!!
        AlertDialog(
            onDismissRequest = { messageInfoTarget = null },
            containerColor = Panel,
            title = { Text("Информация о сообщении", color = White) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Отправлено: ${info.createdAt.replace("T", " ").take(16)}", color = Muted, fontSize = 13.sp)
                    if (info.senderId == currentUserId) {
                        Text(
                            if (info.readAt != null) "Прочитано: ${info.readAt.replace("T", " ").take(16)}"
                            else "Пока не прочитано",
                            color = if (info.readAt != null) Color(0xFF72C8FF) else Muted,
                            fontSize = 13.sp
                        )
                    } else {
                        Text("Сообщение получено от собеседника", color = Muted, fontSize = 13.sp)
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { messageInfoTarget = null }) { Text("Закрыть", color = White) }
            }
        )
    }

    if (forwardingMessage != null) {
        AlertDialog(
            onDismissRequest = { if (!forwarding) forwardingMessage = null },
            containerColor = Panel,
            title = { Text("Переслать сообщение", color = White) },
            text = {
                Column(Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = forwardTargetQuery,
                        onValueChange = { forwardTargetQuery = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        label = { Text("Имя пользователя") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = White,
                            unfocusedTextColor = White,
                            focusedBorderColor = Blue,
                            unfocusedBorderColor = Muted,
                            cursorColor = Blue
                        )
                    )
                    TextButton(
                        enabled = !searchingForwardTargets && forwardTargetQuery.trim().length >= 2,
                        onClick = {
                            scope.launch {
                                searchingForwardTargets = true
                                try {
                                    forwardCandidates = findFloustreamUsers(forwardTargetQuery)
                                } catch (e: Exception) {
                                    if (e is kotlinx.coroutines.CancellationException) throw e
                                    errorText = e.message ?: "Не удалось найти пользователя."
                                } finally {
                                    searchingForwardTargets = false
                                }
                            }
                        }
                    ) { Text(if (searchingForwardTargets) "Ищем…" else "Найти", color = White) }
                    if (forwardCandidates.isEmpty()) {
                        Text("Введи минимум 2 символа имени пользователя и нажми «Найти».", color = Muted, fontSize = 12.sp)
                    } else {
                        Column(Modifier.heightIn(max = 240.dp).verticalScroll(rememberScrollState())) {
                            forwardCandidates.forEach { candidate ->
                                TextButton(
                                    enabled = !forwarding,
                                    onClick = {
                                        val target = forwardingMessage ?: return@TextButton
                                        scope.launch {
                                            forwarding = true
                                            try {
                                                forwardDirectMessage(context, currentUserId, candidate.id, target)
                                                forwardingMessage = null
                                                forwardCandidates = emptyList()
                                                Toast.makeText(context, "Сообщение переслано пользователю ${candidate.username ?: candidate.displayName ?: "FLOUSTREAM"}", Toast.LENGTH_SHORT).show()
                                                if (candidate.id == peer.id) refresh(silent = true)
                                            } catch (e: Exception) {
                                                if (e is kotlinx.coroutines.CancellationException) throw e
                                                errorText = e.message ?: "Не удалось переслать сообщение."
                                            } finally {
                                                forwarding = false
                                            }
                                        }
                                    }
                                ) {
                                    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.Start) {
                                        Text(candidate.displayName?.takeIf { it.isNotBlank() } ?: candidate.username ?: "Пользователь", color = White)
                                        candidate.username?.let { Text("@$it", color = Muted, fontSize = 11.sp) }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = { TextButton(enabled = !forwarding, onClick = { forwardingMessage = null }) { Text("Закрыть", color = White) } }
        )
    }

    if (editingMessage != null) {
        AlertDialog(
            onDismissRequest = { if (!savingEdit) editingMessage = null },
            containerColor = Panel,
            title = { Text("Изменить сообщение", color = White) },
            text = {
                OutlinedTextField(
                    value = editDraft,
                    onValueChange = { editDraft = it },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 6,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = White,
                        unfocusedTextColor = White,
                        focusedBorderColor = Blue,
                        unfocusedBorderColor = Muted,
                        cursorColor = Blue
                    )
                )
            },
            confirmButton = {
                TextButton(
                    enabled = !savingEdit && editDraft.isNotBlank() && editDraft.trim() != editingMessage?.content,
                    onClick = {
                        val target = editingMessage ?: return@TextButton
                        scope.launch {
                            savingEdit = true
                            try {
                                editDirectMessage(currentUserId, target.id, editDraft)
                                refresh(silent = true)
                                editingMessage = null
                            } catch (e: Exception) {
                                if (e is kotlinx.coroutines.CancellationException) throw e
                                errorText = e.message ?: "Не удалось изменить сообщение."
                            } finally {
                                savingEdit = false
                            }
                        }
                    }
                ) { Text(if (savingEdit) "Сохраняем…" else "Сохранить", color = White) }
            },
            dismissButton = {
                TextButton(enabled = !savingEdit, onClick = { editingMessage = null }) { Text("Отмена", color = White) }
            }
        )
    }

    if (pendingDeleteMessage != null) {
        AlertDialog(
            onDismissRequest = { if (!deletingMessage) pendingDeleteMessage = null },
            containerColor = Panel,
            title = { Text("Удалить сообщение?", color = White) },
            text = {
                Text(
                    if (pendingDeleteMessage?.senderId == currentUserId) "Сообщение будет удалено у тебя и собеседника."
                    else "Сообщение будет скрыто только в твоей переписке.",
                    color = Muted
                )
            },
            confirmButton = {
                TextButton(
                    enabled = !deletingMessage,
                    onClick = {
                        val target = pendingDeleteMessage ?: return@TextButton
                        scope.launch {
                            deletingMessage = true
                            try {
                                if (target.senderId == currentUserId) deleteDirectMessage(currentUserId, target.id)
                                else hideDirectMessage(currentUserId, target.id)
                                messages.removeAll { it.id == target.id }
                                pendingDeleteMessage = null
                            } catch (e: Exception) {
                                if (e is kotlinx.coroutines.CancellationException) throw e
                                errorText = e.message ?: "Не удалось удалить сообщение."
                            } finally {
                                deletingMessage = false
                            }
                        }
                    }
                ) {
                    Text(
                        if (deletingMessage) "Удаляем…"
                        else if (pendingDeleteMessage?.senderId == currentUserId) "Удалить у всех" else "Удалить у меня",
                        color = Color(0xFFFF9AAA)
                    )
                }
            },
            dismissButton = {
                TextButton(enabled = !deletingMessage, onClick = { pendingDeleteMessage = null }) {
                    Text("Отмена", color = White)
                }
            }
        )
    }

    if (showGallerySourceDialog) {
        AlertDialog(
            onDismissRequest = { showGallerySourceDialog = false },
            containerColor = Panel,
            title = { Text("Галерея", color = White) },
            text = { Text("Выбери, откуда добавить фотографии или видео.", color = Muted) },
            confirmButton = {
                TextButton(
                    onClick = {
                        showGallerySourceDialog = false
                        showPhoneMediaPicker = true
                    }
                ) { Text("Галерея телефона", color = White) }
            },
            dismissButton = {
                Row {
                    TextButton(
                        onClick = {
                            showGallerySourceDialog = false
                            scope.launch {
                                try {
                                    mediaLibrary = loadPublicMediaLibrary(currentUserId)
                                    selectedMediaIds = emptySet()
                                    showMediaLibrary = true
                                } catch (e: Exception) {
                                    if (e is kotlinx.coroutines.CancellationException) throw e
                                    errorText = e.message ?: "Не удалось открыть медиатеку."
                                }
                            }
                        }
                    ) { Text("Альбомы FLOUSTREAM", color = Blue) }
                    TextButton(onClick = { showGallerySourceDialog = false }) {
                        Text("Отмена", color = Muted)
                    }
                }
            }
        )
    }

    if (showMediaLibrary) {
        AlertDialog(
            onDismissRequest = { showMediaLibrary = false },
            containerColor = Panel,
            title = { Text("Медиатека FLOUSTREAM", color = White) },
            text = {
                if (mediaLibrary.isEmpty()) {
                    Text("В открытых фото- и видеоальбомах пока нет файлов. Секретный альбом сюда не попадает.", color = Muted)
                } else {
                    Column(Modifier.heightIn(max = 380.dp).verticalScroll(rememberScrollState())) {
                        mediaLibrary.forEach { item ->
                            Row(
                                Modifier.fillMaxWidth().clickable {
                                    selectedMediaIds = if (item.id in selectedMediaIds) selectedMediaIds - item.id else selectedMediaIds + item.id
                                }.padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = item.id in selectedMediaIds,
                                    onCheckedChange = { checked ->
                                        selectedMediaIds = if (checked) selectedMediaIds + item.id else selectedMediaIds - item.id
                                    }
                                )
                                Text(if (item.mime.startsWith("video/")) "🎬" else "🖼", fontSize = 22.sp)
                                Spacer(Modifier.width(10.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(item.name, color = White, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                    Text(if (item.mime.startsWith("video/")) "Видеоальбом" else "Фотоальбом", color = Muted, fontSize = 10.sp)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(
                    enabled = selectedMediaIds.isNotEmpty() && !uploadingAttachment,
                    onClick = {
                        val selected = mediaLibrary.filter { it.id in selectedMediaIds }
                        showMediaLibrary = false
                        scope.launch {
                            uploadingAttachment = true
                            var sentCount = 0
                            val failures = mutableListOf<String>()
                            try {
                                selected.forEach { item ->
                                    try {
                                        sendLibraryMedia(context, currentUserId, peer.id, item)
                                        sentCount++
                                    } catch (e: Exception) {
                                        if (e is kotlinx.coroutines.CancellationException) throw e
                                        failures += e.message ?: "Не удалось отправить файл."
                                    }
                                }
                                refresh()
                                errorText = if (failures.isEmpty()) "" else "Отправлено " + sentCount + " из " + selected.size + ". " + failures.joinToString("; ")
                            } finally { uploadingAttachment = false }
                        }
                    }
                ) { Text("Отправить (" + selectedMediaIds.size + ")") }
            },
            dismissButton = {
                TextButton(onClick = { showMediaLibrary = false }) { Text("Закрыть", color = White) }
            }
        )
    }

    if (showPhoneMediaPicker) {
        PhoneMediaPickerDialog(
            onDismiss = { showPhoneMediaPicker = false },
            onSelected = { uris ->
                showPhoneMediaPicker = false
                uploadPickedAttachments(uris)
            }
        )
    }
}

}

@Composable
private fun ConversationScreen(name: String, onBack: () -> Unit, onInfo: () -> Unit) {
    val messages = remember(name) {
        mutableStateListOf(
            ChatMessage("Привет! Это тестовый экран переписки FLOUSTREAM.", false, "12:40"),
            ChatMessage("Здесь появятся настоящие сообщения после подключения чатов.", true, "12:41")
        )
    }
    var draft by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().background(Night)) {
        Row(
            Modifier.fillMaxWidth().background(Panel).padding(horizontal = 8.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("‹", Modifier.clickable { onBack() }.padding(horizontal = 10.dp), color = White, fontSize = 32.sp)
            Avatar(name.take(1).uppercase())
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(name, color = White, fontWeight = FontWeight.Bold, maxLines = 1)
                Text("FLOUSTREAM Messenger", color = Muted, fontSize = 10.sp)
            }
            HeaderAction("☎") { onInfo() }
            HeaderAction("▣") { onInfo() }
            HeaderAction("⋮") { onInfo() }
        }

        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = PaddingValues(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            item {
                Text(
                    "Это демонстрационный экран. Сообщения пока хранятся только на экране и не отправляются собеседнику.",
                    Modifier.fillMaxWidth().padding(8.dp),
                    color = Muted, fontSize = 10.sp, lineHeight = 15.sp
                )
            }
            items(messages) { msg ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = if (msg.mine) Arrangement.End else Arrangement.Start) {
                    Surface(
                        color = if (msg.mine) Color(0xFF254D91) else PanelSoft,
                        shape = RoundedCornerShape(17.dp),
                        modifier = Modifier.widthIn(max = 290.dp)
                    ) {
                        Column(Modifier.padding(horizontal = 13.dp, vertical = 9.dp)) {
                            Text(msg.text, color = White, fontSize = 14.sp)
                            Text(msg.time, Modifier.align(Alignment.End), color = Color(0xFFB4C7E5), fontSize = 9.sp)
                        }
                    }
                }
            }
        }

        Row(
            Modifier.fillMaxWidth().background(Panel).padding(horizontal = 8.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            HeaderAction("+") { onInfo() }
            OutlinedTextField(
                value = draft, onValueChange = { draft = it },
                modifier = Modifier.weight(1f).padding(horizontal = 7.dp),
                placeholder = { Text("Сообщение", color = Muted) },
                shape = RoundedCornerShape(24.dp),
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = {
                    if (draft.isNotBlank()) {
                        messages.add(ChatMessage(draft.trim(), true, "сейчас"))
                        draft = ""
                    }
                })
            )
            Surface(
                modifier = Modifier.size(44.dp).clickable {
                    if (draft.isNotBlank()) {
                        messages.add(ChatMessage(draft.trim(), true, "сейчас"))
                        draft = ""
                    } else onInfo()
                },
                color = Blue, shape = CircleShape
            ) {
                Box(contentAlignment = Alignment.Center) { Text("➤", color = White, fontSize = 20.sp) }
            }
        }
    }
}

// Durable, lifecycle-independent video upload. The local file is kept until both
// the Storage object and its single direct-message row are confirmed.
private fun enqueueVideoUploadWorker(
    context: Context,
    userId: String,
    peerId: String,
    file: File,
    draftKey: String,
    objectPath: String,
    name: String,
    mime: String
) {
    val request = OneTimeWorkRequestBuilder<FloustreamVideoUploadWorker>()
        .setInputData(
            workDataOf(
                "user_id" to userId,
                "peer_id" to peerId,
                "file_path" to file.absolutePath,
                "draft_key" to draftKey,
                "object_path" to objectPath,
                "file_name" to name,
                "mime_type" to mime
            )
        )
        .setConstraints(
            Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
        )
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
        .addTag("floustream-video-peer-$peerId")
        .build()

    WorkManager.getInstance(context.applicationContext).enqueueUniqueWork(
        "floustream-video-$draftKey",
        ExistingWorkPolicy.KEEP,
        request
    )
}

@OptIn(kotlin.time.ExperimentalTime::class)
internal class FloustreamVideoUploadWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val userId = inputData.getString("user_id") ?: return Result.failure()
        val peerId = inputData.getString("peer_id") ?: return Result.failure()
        val filePath = inputData.getString("file_path") ?: return Result.failure()
        val draftKey = inputData.getString("draft_key") ?: return Result.failure()
        val objectPath = inputData.getString("object_path") ?: return Result.failure()
        val name = inputData.getString("file_name") ?: "video.mp4"
        val mime = inputData.getString("mime_type") ?: "video/mp4"
        val file = File(filePath)
        if (!file.isFile || file.length() <= 0L) {
            return Result.failure(workDataOf("error" to "Локальный файл видео не найден. Выбери его ещё раз.", "file_path" to filePath))
        }
        if (file.length() > 50L * 1024L * 1024L) {
            return Result.failure(workDataOf("error" to "Видео превышает лимит 50 МБ.", "file_path" to filePath))
        }

        val notificationId = (draftKey.hashCode() and 0x7fffffff).coerceAtLeast(1)
        try {
            setForeground(createForegroundInfo(notificationId, name, 0))
            val prefs = applicationContext.getSharedPreferences("floustream_video_drafts", Context.MODE_PRIVATE)
            val currentSession = floustreamClient.auth.currentSessionOrNull()
            if (
                currentSession == null ||
                currentSession.expiresAt <= Clock.System.now() + 60.seconds
            ) {
                floustreamClient.auth.refreshCurrentSession()
            }
            val accessToken = floustreamClient.auth.currentSessionOrNull()?.accessToken
                ?: error("Сессия недоступна. Открой FLOUSTREAM и повтори отправку.")

            if (!prefs.getBoolean("${draftKey}_uploaded", false)) {
                withContext(Dispatchers.IO) {
                    TusVideoUploader.upload(
                        context = applicationContext,
                        bucket = "message-media",
                        objectPath = objectPath,
                        file = file,
                        accessToken = accessToken,
                        apiKey = BuildConfig.SUPABASE_PUBLISHABLE_KEY,
                        refreshAccessToken = {
                            floustreamClient.auth.refreshCurrentSession()
                            floustreamClient.auth.currentSessionOrNull()?.accessToken
                                ?: error("Не удалось обновить сессию для продолжения загрузки видео.")
                        },
                        contentType = mime,
                        onProgress = { uploaded, total ->
                            val percent = if (total > 0L) ((uploaded * 100L) / total).toInt().coerceIn(0, 100) else 0
                            setProgress(workDataOf("uploaded_bytes" to uploaded, "total_bytes" to total, "progress_percent" to percent))
                            setForeground(createForegroundInfo(notificationId, name, percent))
                        }
                    )
                }
                prefs.edit().putBoolean("${draftKey}_uploaded", true).commit()
            }

            val alreadyCommitted = withContext(Dispatchers.IO) {
                floustreamClient.from("direct_messages").select {
                    filter {
                        eq("sender_id", userId)
                        eq("recipient_id", peerId)
                        eq("attachment_path", objectPath)
                    }
                }.decodeList<DirectMessageDto>().isNotEmpty()
            }
            if (!alreadyCommitted) {
                sendDirectAttachment(userId, peerId, objectPath, name, mime)
            }

            prefs.edit()
                .remove(draftKey)
                .remove("${draftKey}_uploaded")
                .remove("${draftKey}_peer")
                .remove("${draftKey}_name")
                .remove("${draftKey}_mime")
                .remove("${draftKey}_round")
                .commit()
            file.delete()
            return Result.success(workDataOf("file_path" to file.absolutePath))
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (error: Exception) {
            RoundVideoDiagnostics.record(applicationContext, "background video worker failed; attempt=$runAttemptCount; type=${error.javaClass.name}; message=${error.message}", error)
            return if (runAttemptCount < 8) {
                Result.retry()
            } else {
                Result.failure(
                    workDataOf(
                        "error" to (error.message ?: "Не удалось отправить видео."),
                        "file_path" to file.absolutePath
                    )
                )
            }
        }
    }

    private fun createForegroundInfo(notificationId: Int, fileName: String, progress: Int): ForegroundInfo {
        val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(
                    "floustream_video_uploads",
                    "Отправка видео",
                    NotificationManager.IMPORTANCE_LOW
                )
            )
        }
        val notification = NotificationCompat.Builder(applicationContext, "floustream_video_uploads")
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setContentTitle("FLOUSTREAM — отправка видео")
            .setContentText("$fileName · $progress%")
            .setProgress(100, progress, false)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()
        return ForegroundInfo(
            notificationId,
            notification,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
        )
    }
}

