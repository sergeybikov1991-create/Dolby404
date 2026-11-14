package com.dolby404.messenger

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.auth.handleDeeplinks
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val Night = Color(0xFF080D1B)
private val Panel = Color(0xFF111A2D)
private val PanelSoft = Color(0xFF18243B)
private val Blue = Color(0xFF548BFF)
private val Violet = Color(0xFF9A65FF)
private val Muted = Color(0xFF91A2BF)
private val White = Color(0xFFF4F7FF)

private val dolbyClient = createSupabaseClient(
    supabaseUrl = BuildConfig.SUPABASE_URL,
    supabaseKey = BuildConfig.SUPABASE_PUBLISHABLE_KEY
) {
    install(Postgrest)
    install(Auth) {
        scheme = "dolby404"
        host = "auth-callback"
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        dolbyClient.handleDeeplinks(intent)
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
            ) { androidx.compose.foundation.layout.Box(Modifier.fillMaxSize()) { MessengerApp(); AppUpdatePrompt() } }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        dolbyClient.handleDeeplinks(intent)
    }
}

private data class DemoChat(
    val name: String,
    val preview: String,
    val time: String,
    val initials: String,
    val unread: Int = 0,
    val online: Boolean = false
)

private data class ChatMessage(val text: String, val mine: Boolean, val time: String)

@Serializable
private data class ProfileDto(
    @SerialName("id") val id: String,
    @SerialName("username") val username: String? = null,
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null
)

@Serializable
private data class DirectMessageDto(
    @SerialName("id") val id: String,
    @SerialName("sender_id") val senderId: String,
    @SerialName("recipient_id") val recipientId: String,
    @SerialName("content") val content: String,
    @SerialName("created_at") val createdAt: String
)

@Serializable
private data class NewDirectMessage(
    @SerialName("sender_id") val senderId: String,
    @SerialName("recipient_id") val recipientId: String,
    @SerialName("content") val content: String
)

private suspend fun findDolbyUsers(query: String): List<ProfileDto> {
    val term = query.trim().removePrefix("@")
    if (term.length < 2) return emptyList()
    return dolbyClient.from("profiles").select {
        filter { ilike("username", "%$term%") }
    }.decodeList<ProfileDto>().filter {
        it.id != dolbyClient.auth.currentUserOrNull()?.id
    }.take(30)
}

private suspend fun loadDirectMessages(userId: String, peerId: String): List<DirectMessageDto> {
    val sent = dolbyClient.from("direct_messages").select {
        filter {
            eq("sender_id", userId)
            eq("recipient_id", peerId)
        }
    }.decodeList<DirectMessageDto>()
    val received = dolbyClient.from("direct_messages").select {
        filter {
            eq("sender_id", peerId)
            eq("recipient_id", userId)
        }
    }.decodeList<DirectMessageDto>()
    return (sent + received).sortedBy { it.createdAt }.takeLast(200)
}

private suspend fun sendDirectMessage(userId: String, peerId: String, content: String) {
    dolbyClient.from("direct_messages").insert(
        NewDirectMessage(senderId = userId, recipientId = peerId, content = content)
    )
}

@Composable
private fun MessengerApp() {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var signedIn by remember { mutableStateOf(false) }
    var authReady by remember { mutableStateOf(false) }
    var isRegistering by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("Войди с тем же аккаунтом, что используешь на сайте Dolby404.") }
    val scope = rememberCoroutineScope()

    // Restore the saved Supabase session before deciding which screen to show.
    // Closing the app or removing it from Recents must not sign the user out.
    LaunchedEffect(Unit) {
        dolbyClient.auth.sessionStatus.collect { status ->
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
                    signedIn = dolbyClient.auth.currentSessionOrNull() != null
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
        scope.launch {
            busy = true
            message = if (isRegistering) "Создаём аккаунт Dolby404..." else "Подключаемся к Dolby404..."
            try {
                if (isRegistering) {
                    dolbyClient.auth.signUpWith(Email) {
                        this.email = email.trim()
                        this.password = password
                    }
                    if (dolbyClient.auth.currentSessionOrNull() != null) {
                        signedIn = true
                        message = "Регистрация успешна!"
                    } else {
                        message = "Аккаунт создан! Проверь почту и подтверди email. После подтверждения войди здесь с теми же данными, что и на сайте."
                    }
                } else {
                    dolbyClient.auth.signInWith(Email) {
                        this.email = email.trim()
                        this.password = password
                    }
                    signedIn = true
                    message = "Авторизация успешна."
                }
            } catch (e: Exception) {
                message = e.message ?: if (isRegistering) "Не удалось зарегистрироваться." else "Не удалось войти. Проверь данные."
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
                Text("Восстанавливаем сессию Dolby404…", color = White, fontSize = 14.sp)
            }
        } else if (signedIn) {
            MessengerHome(
                onSignOut = {
                    scope.launch {
                        busy = true
                        try {
                            dolbyClient.auth.signOut()
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
                    Text("DOLBY404", fontSize = 30.sp, fontWeight = FontWeight.Black, color = White)
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
                            isRegistering = !isRegistering
                            message = if (isRegistering) "Войди с существующим аккаунтом Dolby404." else "Создай аккаунт. Он будет работать и на сайте, и в приложении."
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
private fun MessengerHome(onSignOut: () -> Unit) {
    var tab by remember { mutableStateOf("Чаты") }
    var selectedChat by remember { mutableStateOf<String?>(null) }
    var selectedProfile by remember { mutableStateOf<ProfileDto?>(null) }
    val currentUserId = dolbyClient.auth.currentUserOrNull()?.id.orEmpty()
    var searchOpen by remember { mutableStateOf(false) }
    var search by remember { mutableStateOf("") }
    var showNewChat by remember { mutableStateOf(false) }
    var infoMessage by remember { mutableStateOf("") }

    val chats = remember {
        listOf(
            DemoChat("Команда Dolby404", "Добро пожаловать в Messenger!", "12:42", "D", 2, true),
            DemoChat("Тестовый диалог", "Здесь появятся ваши сообщения", "Вчера", "T", 0, false),
            DemoChat("Избранное", "Личные заметки и файлы", "Пн", "★", 0, false)
        )
    }

    Surface(Modifier.fillMaxSize(), color = Night) {
        Column(Modifier.fillMaxSize()) {
            if (selectedProfile != null) {
                RealConversationScreen(
                    peer = selectedProfile!!,
                    currentUserId = currentUserId,
                    onBack = { selectedProfile = null }
                )
            } else if (selectedChat != null) {
                ConversationScreen(
                    name = selectedChat!!,
                    onBack = { selectedChat = null },
                    onInfo = { infoMessage = "Это демонстрационный диалог. Для настоящей переписки выбери пользователя во вкладке «Контакты»." }
                )
            } else {
                Row(
                    Modifier.fillMaxWidth().background(
                        Brush.horizontalGradient(listOf(Color(0xFF142A59), Color(0xFF241747)))
                    ).padding(start = 20.dp, end = 16.dp, top = 18.dp, bottom = 18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("DOLBY404", fontSize = 23.sp, fontWeight = FontWeight.Black, color = White, letterSpacing = 1.sp)
                        Text("MESSENGER", fontSize = 10.sp, color = Color(0xFF9FCBFF), letterSpacing = 4.sp)
                    }
                    HeaderAction("⌕") { searchOpen = !searchOpen }
                    HeaderAction("⋮") { infoMessage = "Меню приложения: настройки, помощь и информация." }
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

                when (tab) {
                    "Чаты" -> ChatsScreen(chats.filter {
                        it.name.contains(search, true) || it.preview.contains(search, true)
                    }, onOpen = { selectedChat = it })
                    "Звонки" -> CallsScreen(onInfo = { infoMessage = it })
                    "Контакты" -> ContactsScreen(onStart = { selectedProfile = it; selectedChat = null; tab = "Чаты" })
                    else -> SettingsScreen(onSignOut = onSignOut, onInfo = { infoMessage = it })
                }

                NavigationBar(containerColor = Panel, contentColor = White) {
                    listOf("Чаты" to "▤", "Звонки" to "◉", "Контакты" to "♙", "Настройки" to "⚙").forEach { item ->
                        NavigationBarItem(
                            selected = tab == item.first,
                            onClick = { tab = item.first; selectedChat = null; selectedProfile = null },
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

                if (tab == "Чаты") {
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.BottomEnd) {
                        FloatingActionButton(
                            onClick = { showNewChat = true },
                            modifier = Modifier.padding(end = 20.dp, bottom = 84.dp),
                            containerColor = Blue,
                            contentColor = White,
                            shape = RoundedCornerShape(18.dp)
                        ) { Text("+", fontSize = 30.sp, fontWeight = FontWeight.Light) }
                    }
                }
            }
        }
    }

    if (showNewChat) {
        AlertDialog(
            onDismissRequest = { showNewChat = false },
            containerColor = Panel,
            title = { Text("Новый чат", color = White) },
            text = { Text("Выбери «Контакты», чтобы найти собеседника. Создание групп подключим вместе с серверной частью.", color = Muted) },
            confirmButton = {
                TextButton(onClick = { showNewChat = false; tab = "Контакты" }) { Text("К контактам") }
            },
            dismissButton = { TextButton(onClick = { showNewChat = false }) { Text("Закрыть") } }
        )
    }
    if (infoMessage.isNotBlank()) {
        AlertDialog(
            onDismissRequest = { infoMessage = "" },
            containerColor = Panel,
            title = { Text("Dolby404", color = White) },
            text = { Text(infoMessage, color = Muted) },
            confirmButton = { TextButton(onClick = { infoMessage = "" }) { Text("Понятно") } }
        )
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
private fun ChatsScreen(chats: List<DemoChat>, onOpen: (String) -> Unit) {
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Твои переписки", color = White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text("Общайся без границ", color = Muted, fontSize = 12.sp)
            }
            Surface(color = PanelSoft, shape = RoundedCornerShape(20.dp)) {
                Text("● онлайн", Modifier.padding(horizontal = 12.dp, vertical = 7.dp), color = Color(0xFF69DDA8), fontSize = 11.sp)
            }
        }
        LazyColumn(contentPadding = PaddingValues(bottom = 110.dp)) {
            items(chats) { chat ->
                Row(
                    Modifier.fillMaxWidth().clickable { onOpen(chat.name) }.padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Avatar(chat.initials, chat.online)
                    Spacer(Modifier.width(13.dp))
                    Column(Modifier.weight(1f)) {
                        Text(chat.name, color = White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                        Text(chat.preview, color = Muted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(chat.time, color = Muted, fontSize = 10.sp)
                        if (chat.unread > 0) {
                            Spacer(Modifier.height(5.dp))
                            Surface(color = Blue, shape = CircleShape) {
                                Text(chat.unread.toString(), Modifier.padding(horizontal = 7.dp, vertical = 2.dp), color = White, fontSize = 10.sp)
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
private fun Avatar(initials: String, online: Boolean = false) {
    Box {
        Surface(
            modifier = Modifier.size(54.dp),
            shape = CircleShape,
            color = Brush.linearGradient(listOf(Color(0xFF326DCE), Color(0xFF7B45BD))).let { PanelSoft }
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(initials, color = White, fontSize = 19.sp, fontWeight = FontWeight.Bold)
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
    var status by remember { mutableStateOf("Ищи собеседников по их @username из Dolby404.") }
    val scope = rememberCoroutineScope()

    Column(Modifier.fillMaxSize().padding(20.dp)) {
        Text("Контакты", color = White, fontSize = 23.sp, fontWeight = FontWeight.Bold)
        Text("Находи людей в Dolby404", color = Muted, fontSize = 12.sp)
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
                        results = findDolbyUsers(query)
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
                    Avatar((person.displayName ?: person.username ?: "D").take(1).uppercase())
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(person.displayName ?: person.username ?: "Пользователь", color = White, fontWeight = FontWeight.SemiBold)
                        Text(person.username?.let { "@$it" } ?: "Пользователь Dolby404", color = Muted, fontSize = 12.sp)
                    }
                    Text("Написать ›", color = Color(0xFF9FCBFF), fontSize = 12.sp)
                }
                HorizontalDivider(color = Color(0xFF1B2941))
            }
        }
    }
}

@Composable
private fun SettingsScreen(onSignOut: () -> Unit, onInfo: (String) -> Unit) {
    Column(Modifier.fillMaxSize().padding(20.dp)) {
        Text("Настройки", color = White, fontSize = 23.sp, fontWeight = FontWeight.Bold)
        Text("Твой аккаунт и приложение", color = Muted, fontSize = 12.sp)
        Spacer(Modifier.height(20.dp))
        Surface(color = Panel, shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Avatar("D", true)
                Spacer(Modifier.width(14.dp))
                Column {
                    Text("Dolby404 аккаунт", color = White, fontWeight = FontWeight.Bold)
                    Text("Единый аккаунт сайта и приложения", color = Muted, fontSize = 11.sp)
                }
            }
        }
        Spacer(Modifier.height(18.dp))
        SettingsRow("☷", "Профиль", "Имя, фото и статус") { onInfo("Настройки профиля подключим к твоему аккаунту Dolby404.") }
        SettingsRow("🔔", "Уведомления", "Звуки и оповещения") { onInfo("Здесь будут настройки уведомлений и звуков.") }
        SettingsRow("◈", "Приватность", "Кто может с тобой связаться") { onInfo("Настройки приватности подключим к общей системе Dolby404.") }
        SettingsRow("⟳", "Синхронизация с сайтом", "Чаты и медиа между сайтом и приложением") { onInfo("Переключатель синхронизации появится после настройки общей модели чатов на сервере. Сейчас ничего не синхронизируется.") }
        SettingsRow("◐", "О приложении", "Dolby404 Messenger · 0.2.0") { onInfo("Dolby404 Messenger, версия 0.2.0.") }
        Spacer(Modifier.height(16.dp))
        OutlinedButton(onClick = onSignOut, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) {
            Text("Выйти из аккаунта", color = Color(0xFFFF8B9A))
        }
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
private fun RealConversationScreen(peer: ProfileDto, currentUserId: String, onBack: () -> Unit) {
    val messages = remember(peer.id) { mutableStateListOf<DirectMessageDto>() }
    var draft by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var sending by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    suspend fun refresh() {
        try {
            val latest = loadDirectMessages(currentUserId, peer.id)
            messages.clear()
            messages.addAll(latest)
            errorText = ""
        } catch (e: Exception) {
            errorText = e.message ?: "Не удалось загрузить переписку."
        } finally { loading = false }
    }

    LaunchedEffect(peer.id) {
        refresh()
        while (true) {
            delay(5000)
            refresh()
        }
    }

    Column(Modifier.fillMaxSize().background(Night)) {
        Row(
            Modifier.fillMaxWidth().background(Panel).padding(horizontal = 8.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("‹", Modifier.clickable { onBack() }.padding(horizontal = 10.dp), color = White, fontSize = 32.sp)
            Avatar((peer.displayName ?: peer.username ?: "D").take(1).uppercase())
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(peer.displayName ?: peer.username ?: "Пользователь", color = White, fontWeight = FontWeight.Bold, maxLines = 1)
                Text(peer.username?.let { "@$it" } ?: "Dolby404", color = Muted, fontSize = 10.sp)
            }
        }
        if (errorText.isNotBlank()) {
            Text(errorText, Modifier.fillMaxWidth().padding(10.dp), color = Color(0xFFFF9AA8), fontSize = 11.sp)
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
                    ) {
                        Column(Modifier.padding(horizontal = 13.dp, vertical = 9.dp)) {
                            Text(msg.content, color = White, fontSize = 14.sp)
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
        Row(
            Modifier.fillMaxWidth().background(Panel).padding(horizontal = 8.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
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
                modifier = Modifier.size(44.dp).clickable {
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
                },
                color = Blue, shape = CircleShape
            ) {
                Box(contentAlignment = Alignment.Center) {
                    if (sending) CircularProgressIndicator(modifier = Modifier.size(18.dp), color = White)
                    else Text("➤", color = White, fontSize = 20.sp)
                }
            }
        }
    }
}

@Composable
private fun ConversationScreen(name: String, onBack: () -> Unit, onInfo: () -> Unit) {
    val messages = remember(name) {
        mutableStateListOf(
            ChatMessage("Привет! Это тестовый экран переписки Dolby404.", false, "12:40"),
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
                Text("Dolby404 Messenger", color = Muted, fontSize = 10.sp)
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
