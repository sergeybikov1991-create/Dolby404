package com.dolby404.messenger

import android.os.Bundle
import android.media.MediaRecorder
import java.io.File
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
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
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
import androidx.media3.ui.PlayerView
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.auth.handleDeeplinks
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
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
import kotlin.math.abs
import kotlin.time.Duration.Companion.minutes
import coil.compose.AsyncImage
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.google.firebase.messaging.FirebaseMessaging

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
    @SerialName("attachment_mime") val attachmentMime: String? = null
)

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
    @SerialName("attachment_mime") val attachmentMime: String? = null
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

private suspend fun sendLibraryMedia(userId: String, peerId: String, item: MediaLibraryItem) = withContext(Dispatchers.IO) {
    val signedUrl = floustreamClient.storage.from(item.bucket).createSignedUrl(item.path, 10.minutes)
    val connection = URL(signedUrl).openConnection() as HttpURLConnection
    val bytes = try {
        connection.connectTimeout = 15000
        connection.readTimeout = 60000
        connection.inputStream.use { it.readBytes() }
    } finally { connection.disconnect() }
    if (bytes.size > 50 * 1024 * 1024) error("Файл больше 50 МБ.")
    val safeName = item.name.replace(Regex("[^A-Za-z0-9._-]"), "_").take(100).ifBlank { "attachment" }
    val targetPath = userId + "/" + UUID.randomUUID().toString() + "_" + safeName
    floustreamClient.storage.from("message-media").upload(targetPath, bytes) {
        contentType = ContentType.parse(item.mime.ifBlank { "application/octet-stream" })
    }
    sendDirectAttachment(userId, peerId, targetPath, item.name, item.mime)
}

private suspend fun findFloustreamUsers(query: String): List<ProfileDto> {
    val term = query.trim().removePrefix("@")
    if (term.length < 2) return emptyList()
    return floustreamClient.from("profiles").select {
        filter { ilike("username", "%$term%") }
    }.decodeList<ProfileDto>().filter {
        it.id != floustreamClient.auth.currentUserOrNull()?.id && !it.isDeleted
    }.take(30)
}

private suspend fun loadDirectMessages(userId: String, peerId: String): List<DirectMessageDto> {
    val sent = floustreamClient.from("direct_messages").select {
        filter {
            eq("sender_id", userId)
            eq("recipient_id", peerId)
        }
    }.decodeList<DirectMessageDto>()
    val received = floustreamClient.from("direct_messages").select {
        filter {
            eq("sender_id", peerId)
            eq("recipient_id", userId)
        }
    }.decodeList<DirectMessageDto>()
    val hiddenIds = floustreamClient.from("direct_message_hidden").select {
        filter { eq("user_id", userId) }
    }.decodeList<HiddenDirectMessageDto>().map { it.messageId }.toSet()
    return (sent + received).filterNot { it.id in hiddenIds }.sortedBy { it.createdAt }.takeLast(200)
}

private suspend fun markIncomingMessagesRead(userId: String, peerId: String) = withContext(Dispatchers.IO) {
    val token = floustreamClient.auth.currentSessionOrNull()?.accessToken ?: return@withContext
    val connection = URL("${BuildConfig.SUPABASE_URL}/rest/v1/direct_messages?sender_id=eq.$peerId&recipient_id=eq.$userId&read_at=is.null").openConnection() as HttpURLConnection
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
        if (connection.responseCode !in 200..299) throw IllegalStateException("Не удалось отметить сообщения прочитанными.")
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
    floustreamClient.from("direct_messages").insert(
        NewDirectMessage(senderId = userId, recipientId = peerId, content = name, attachmentPath = path, attachmentName = name, attachmentMime = mime)
    )
}

private suspend fun sendDirectMessage(userId: String, peerId: String, content: String) {
    floustreamClient.from("direct_messages").insert(
        NewDirectMessage(senderId = userId, recipientId = peerId, content = content)
    )
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
        connection.setRequestProperty("Prefer", "return=minimal")
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException("Не удалось удалить сообщение.")
        }
    } finally {
        connection.disconnect()
    }
}

private suspend fun loadInboxThreads(userId: String): List<ChatThread> {
    val sent = floustreamClient.from("direct_messages").select {
        filter { eq("sender_id", userId) }
    }.decodeList<DirectMessageDto>()
    val received = floustreamClient.from("direct_messages").select {
        filter { eq("recipient_id", userId) }
    }.decodeList<DirectMessageDto>()

    val rows = (sent + received)
        .distinctBy { it.id }
        .sortedByDescending { it.createdAt }
        .take(500)

    val peerIds = rows.map {
        if (it.senderId == userId) it.recipientId else it.senderId
    }.distinct()

    return peerIds.mapNotNull { peerId ->
        val profile = floustreamClient.from("profiles").select {
            filter { eq("id", peerId) }
        }.decodeList<ProfileDto>().firstOrNull()
            ?: ProfileDto(id = peerId, displayName = "Удалённый аккаунт", isDeleted = true)

        val conversation = rows.filter {
            (it.senderId == userId && it.recipientId == peerId) ||
                (it.senderId == peerId && it.recipientId == userId)
        }.sortedBy { it.createdAt }

        val latest = conversation.lastOrNull() ?: return@mapNotNull null
        val unread = conversation.count {
            it.senderId == peerId && it.recipientId == userId && it.readAt == null
        }
        ChatThread(profile, latest, unread)
    }.sortedByDescending { it.lastMessage.createdAt }
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
                    floustreamClient.auth.signInWith(Email) {
                        this.email = email.trim()
                        this.password = password
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
            val peer = floustreamClient.from("profiles").select {
                filter { eq("id", peerId) }
            }.decodeList<ProfileDto>().firstOrNull()
            if (peer != null) {
                tab = "Чаты"
                socialOpen = false
                socialDrawerOpen = false
                selectedProfile = peer
            } else {
                infoMessage = "Этот собеседник больше недоступен."
            }
        } catch (_: Exception) {
            infoMessage = "Не удалось открыть переписку. Попробуй ещё раз."
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
                        runCatching {
                            item to floustreamClient.storage.from(item.bucket).createSignedUrl(item.path, 60.minutes)
                        }.getOrNull()
                    }
            } else emptyList()
        } catch (_: Exception) {
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
                catch (_: Exception) { searchResults = emptyList() }
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
        modifier = Modifier.fillMaxWidth().height(240.dp).clip(RoundedCornerShape(12.dp))
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
            do {
                try {
                    val latest = loadInboxThreads(currentUserId)
                    threads.clear()
                    threads.addAll(latest)
                    error = ""
                } catch (e: Exception) {
                    if (!hasLoadedInbox) error = e.message ?: "Не удалось загрузить список чатов."
                } finally {
                    loading = false
                    hasLoadedInbox = true
                }
                if (isInboxResumed) delay(5000)
            } while (isInboxResumed)
        }
    }

    val filtered = threads.filter { thread ->
        val name = thread.peer.displayName ?: thread.peer.username ?: ""
        val preview = thread.lastMessage.content
        name.contains(searchQuery, true) || preview.contains(searchQuery, true)
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
    Box {
        Surface(
            modifier = Modifier.size(54.dp),
            shape = CircleShape,
            color = Brush.linearGradient(listOf(Color(0xFF326DCE), Color(0xFF7B45BD))).let { PanelSoft }
        ) {
            Box(contentAlignment = Alignment.Center) {
                if (!avatarUrl.isNullOrBlank()) {
                    AsyncImage(model = avatarUrl, contentDescription = "Фото профиля", modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
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
            try { profile = loadCurrentProfile(currentUserId) } catch (_: Exception) { }
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

@Composable
private fun MessageAttachment(message: DirectMessageDto) {
    val context = LocalContext.current
    val path = message.attachmentPath ?: return
    val mime = message.attachmentMime.orEmpty().lowercase()
    var signedUrl by remember(path) { mutableStateOf<String?>(null) }
    var loadError by remember(path) { mutableStateOf(false) }

    LaunchedEffect(path) {
        try {
            signedUrl = floustreamClient.storage.from("message-media").createSignedUrl(path, 30.minutes)
        } catch (_: Exception) {
            loadError = true
        }
    }

    var showFullScreen by remember(path) { mutableStateOf(false) }
    val url = signedUrl
    when {
        url == null && !loadError -> CircularProgressIndicator(modifier = Modifier.size(22.dp), color = Blue)
        loadError -> Text("Не удалось загрузить вложение", color = Muted, fontSize = 12.sp)
        mime.startsWith("image/") -> AsyncImage(
            model = url,
            contentDescription = message.attachmentName ?: "Изображение",
            modifier = Modifier.fillMaxWidth().heightIn(max = 280.dp)
                .clip(RoundedCornerShape(5.dp)).clickable { showFullScreen = true },
            contentScale = ContentScale.Fit
        )
        mime.startsWith("audio/") -> AudioMessagePlayer(url!!)
        mime.startsWith("video/") -> {
            val player = remember(url) {
                ExoPlayer.Builder(context).build().apply {
                    setMediaItem(MediaItem.fromUri(url!!))
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
                        resizeMode = androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                    }
                },
                update = { it.player = player },
                modifier = Modifier.size(190.dp).clip(CircleShape)
            )
        }
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
private fun AudioMessagePlayer(url: String) {
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
                    isPlaying = false
                    positionMs = 0L
                    player.seekTo(0L)
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
        Modifier.fillMaxWidth().background(PanelSoft, RoundedCornerShape(13.dp)).padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            modifier = Modifier.size(42.dp).clickable(enabled = !playbackError) {
                if (player.isPlaying) player.pause() else player.play()
            },
            color = if (playbackError) Muted else Blue,
            shape = CircleShape
        ) {
            Box(contentAlignment = Alignment.Center) {
                when {
                    isBuffering && !playbackError -> CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = White,
                        strokeWidth = 2.dp
                    )
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
                if (playbackError) "Файл повреждён или недоступен"
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
    var draft by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var sending by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf("") }
    var hasLoadedOnce by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val lifecycleOwner = LocalLifecycleOwner.current
    var isResumed by remember { mutableStateOf(lifecycleOwner.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) }

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

    suspend fun refresh(silent: Boolean = false) {
        try {
            try { markIncomingMessagesRead(currentUserId, peer.id) } catch (_: Exception) { }
            val latest = loadDirectMessages(currentUserId, peer.id)
            messages.clear()
            messages.addAll(latest)
            errorText = ""
        } catch (e: Exception) {
            if (!silent) errorText = e.message ?: "Не удалось загрузить переписку."
        } finally {
            loading = false
            hasLoadedOnce = true
        }
    }

    var uploadingAttachment by remember { mutableStateOf(false) }
    var voiceRecorder by remember { mutableStateOf<MediaRecorder?>(null) }
    var voiceFile by remember { mutableStateOf<File?>(null) }
    var recordingVoice by remember { mutableStateOf(false) }
    var pendingDeleteMessage by remember { mutableStateOf<DirectMessageDto?>(null) }
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
        val recordedSeconds = voiceElapsedSeconds
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
            val bytes = withContext(Dispatchers.IO) { file.readBytes() }
            if (bytes.size > 50 * 1024 * 1024) error("Запись превышает допустимый размер.")
            val name = "voice_${System.currentTimeMillis()}.m4a"
            val path = "$currentUserId/${UUID.randomUUID()}_$name"
            withContext(Dispatchers.IO) {
                floustreamClient.storage.from("message-media").upload(path, bytes) { contentType = ContentType.parse("audio/mp4") }
            }
            sendDirectAttachment(currentUserId, peer.id, path, name, "audio/mp4")
            refresh()
            errorText = ""
        } catch (_: Exception) {
            errorText = "Не удалось отправить голосовое сообщение. Проверь интернет и попробуй ещё раз."
        } finally {
            file.delete()
            uploadingAttachment = false
        }
    }
    var showAttachmentMenu by remember { mutableStateOf(false) }
    var showRoundVideoRecorder by remember { mutableStateOf(false) }
    var showMediaLibrary by remember { mutableStateOf(false) }
    var mediaLibrary by remember { mutableStateOf<List<MediaLibraryItem>>(emptyList()) }
    var selectedMediaIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    val attachmentPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        if (uris.isNotEmpty() && !uploadingAttachment) scope.launch {
            uploadingAttachment = true
            var sentCount = 0
            val failures = mutableListOf<String>()
            try {
                uris.forEach { uri ->
                    try {
                        val resolver = context.contentResolver
                        val mime = resolver.getType(uri) ?: "application/octet-stream"
                        val name = resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                            if (cursor.moveToFirst()) cursor.getString(0) else null
                        } ?: "attachment"
                        val bytes = withContext(Dispatchers.IO) {
                            resolver.openInputStream(uri)?.use { it.readBytes() } ?: error("Не удалось прочитать файл.")
                        }
                        if (bytes.size > 50 * 1024 * 1024) error("$name: размер превышает 50 МБ.")
                        val safeName = name.substringAfterLast('/').replace(Regex("[^A-Za-z0-9._-]"), "_").take(100).ifBlank { "attachment" }
                        val path = "$currentUserId/${UUID.randomUUID()}_$safeName"
                        withContext(Dispatchers.IO) { floustreamClient.storage.from("message-media").upload(path, bytes) { contentType = ContentType.parse(mime) } }
                        sendDirectAttachment(currentUserId, peer.id, path, name, mime)
                        sentCount++
                    } catch (_: Exception) {
                        failures += "Не удалось отправить один из файлов. Проверьте интернет и попробуйте ещё раз."
                    }
                }
                if (sentCount > 0) refresh()
                errorText = if (failures.isEmpty()) "" else "Отправлено $sentCount из ${uris.size}. ${failures.distinct().joinToString("; ")}"
            } finally { uploadingAttachment = false }
        }
    }

    LaunchedEffect(peer.id, isResumed) {
        if (isResumed) {
            refresh(silent = hasLoadedOnce)
            while (isResumed) {
                delay(5000)
                if (isResumed) refresh(silent = true)
            }
        }
    }

    Column(Modifier.fillMaxSize().background(Night)) {
        Row(
            Modifier.fillMaxWidth().background(Panel).padding(horizontal = 8.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("‹", Modifier.clickable { onBack() }.padding(horizontal = 10.dp), color = White, fontSize = 32.sp)
            Avatar((peer.displayName ?: peer.username ?: "D").take(1).uppercase(), avatarUrl = peer.avatarUrl)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(peer.displayName ?: peer.username ?: "Пользователь", color = White, fontWeight = FontWeight.Bold, maxLines = 1)
                Text(if (peer.isDeleted) "История переписки сохранена" else peer.username?.let { "@$it" } ?: "FLOUSTREAM", color = Muted, fontSize = 10.sp)
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
        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = PaddingValues(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (loading && messages.isEmpty()) {
                item { Text("Загружаем переписку…", color = Muted) }
            } else if (messages.isEmpty()) {
                item { Text("Это начало вашей переписки. Отправь первое сообщение!", Modifier.fillMaxWidth().padding(20.dp), color = Muted, fontSize = 13.sp) }
            }
            items(messages) { msg ->
                val mine = msg.senderId == currentUserId
                Row(Modifier.fillMaxWidth(), horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start) {
                    Surface(
                        color = if (mine) Color(0xFF254D91) else PanelSoft,
                        shape = RoundedCornerShape(17.dp),
                        modifier = Modifier.widthIn(max = 290.dp)
                            .combinedClickable(
                                onClick = { pendingDeleteMessage = msg },
                                onLongClick = { pendingDeleteMessage = msg }
                            )
                            .pointerInput(msg.id, mine) {
                                var dragTotal = 0f
                                detectHorizontalDragGestures(
                                    onHorizontalDrag = { change, amount ->
                                        dragTotal += amount
                                        change.consume()
                                    },
                                    onDragEnd = {
                                        if (abs(dragTotal) > 84.dp.toPx()) pendingDeleteMessage = msg
                                        dragTotal = 0f
                                    },
                                    onDragCancel = { dragTotal = 0f }
                                )
                            }
                    ) {
                        Column(Modifier.padding(horizontal = 13.dp, vertical = 9.dp)) {
                            if (!msg.attachmentPath.isNullOrBlank()) {
                                MessageAttachment(msg)
                                if (!msg.content.isNullOrBlank() && msg.content != msg.attachmentName) {
                                    Text(msg.content, color = White, fontSize = 13.sp)
                                }
                            } else Text(msg.content, color = White, fontSize = 14.sp)
                            Text(
                                msg.createdAt.substringAfter("T").take(5),
                                Modifier.align(Alignment.End),
                                color = Color(0xFFB4C7E5), fontSize = 9.sp
                            )
                        }
                    }
                }
            }
        }
        if (!peer.isDeleted) Row(
            Modifier.fillMaxWidth().background(Panel).padding(horizontal = 8.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box {
                Surface(modifier = Modifier.size(42.dp).clickable { showAttachmentMenu = true }, color = PanelSoft, shape = CircleShape) {
                    Box(contentAlignment = Alignment.Center) {
                        if (uploadingAttachment) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Blue)
                        else Text("+", color = White, fontSize = 25.sp)
                    }
                }
                DropdownMenu(expanded = showAttachmentMenu, onDismissRequest = { showAttachmentMenu = false }) {
                    DropdownMenuItem(
                        text = { Text("Фото из галереи") },
                        onClick = {
                            showAttachmentMenu = false
                            attachmentPicker.launch("image/*")
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Видео из галереи") },
                        onClick = {
                            showAttachmentMenu = false
                            attachmentPicker.launch("video/*")
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Медиатека FLOUSTREAM") },
                        onClick = {
                            showAttachmentMenu = false
                            scope.launch {
                                try {
                                    mediaLibrary = loadPublicMediaLibrary(currentUserId)
                                    selectedMediaIds = emptySet()
                                    showMediaLibrary = true
                                } catch (e: Exception) {
                                    errorText = e.message ?: "Не удалось открыть медиатеку."
                                }
                            }
                        }
                    )
                }
            }
            Surface(
                modifier = Modifier.size(42.dp).clickable { showRoundVideoRecorder = true },
                color = PanelSoft, shape = CircleShape
            ) {
                Box(contentAlignment = Alignment.Center) { Text("📹", fontSize = 19.sp) }
            }
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
                                sendDirectMessage(currentUserId, peer.id, text)
                                draft = ""
                                refresh()
                            } catch (e: Exception) {
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
                                        sendDirectMessage(currentUserId, peer.id, text)
                                        draft = ""
                                        refresh()
                                    } catch (_: Exception) {
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
                        recordingVoice -> Text("●", color = White, fontSize = 20.sp)
                        else -> Text("➤", color = White, fontSize = 20.sp)
                    }
                }
            }
        }
    }

    if (showRoundVideoRecorder) {
        RoundVideoRecorder(
            onDismiss = { showRoundVideoRecorder = false },
            onError = { message ->
                errorText = message
                showRoundVideoRecorder = false
            },
            onRecorded = { file ->
                showRoundVideoRecorder = false
                scope.launch {
                    uploadingAttachment = true
                    try {
                        val bytes = withContext(Dispatchers.IO) { file.readBytes() }
                        if (bytes.size > 50 * 1024 * 1024) error("Видео превышает допустимый размер 50 МБ.")
                        val name = "video_" + System.currentTimeMillis() + ".mp4"
                        val path = currentUserId + "/" + UUID.randomUUID().toString() + "_" + name
                        withContext(Dispatchers.IO) {
                            floustreamClient.storage.from("message-media").upload(path, bytes) {
                                contentType = ContentType.parse("video/mp4")
                            }
                        }
                        sendDirectAttachment(currentUserId, peer.id, path, name, "video/mp4")
                        refresh()
                        errorText = ""
                    } catch (_: Exception) {
                        errorText = "Не удалось отправить видеосообщение. Проверь интернет и попробуй ещё раз."
                    } finally {
                        file.delete()
                        uploadingAttachment = false
                    }
                }
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
                                        sendLibraryMedia(currentUserId, peer.id, item)
                                        sentCount++
                                    } catch (e: Exception) {
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
