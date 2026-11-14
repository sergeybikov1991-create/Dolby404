package com.dolby404.messenger

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.handleDeeplinks
import io.github.jan.supabase.auth.providers.builtin.Email
import kotlinx.coroutines.launch

private val dolbyClient = createSupabaseClient(
    supabaseUrl = BuildConfig.SUPABASE_URL,
    supabaseKey = BuildConfig.SUPABASE_PUBLISHABLE_KEY
) {
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
                    primary = Color(0xFF5D8CFF),
                    secondary = Color(0xFFB45CFF),
                    background = Color(0xFF070B19),
                    surface = Color(0xFF111A32)
                )
            ) {
                MessengerApp()
            }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        dolbyClient.handleDeeplinks(intent)
    }
}

@Composable
private fun MessengerApp() {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var signedIn by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("Войди с тем же аккаунтом, что используешь на сайте Dolby404.") }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    listOf(Color(0xFF050817), Color(0xFF102B83), Color(0xFF5420A8), Color(0xFF050817))
                )
            )
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            color = Color(0xE6101830)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "DOLBY404",
                    fontSize = 30.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Text(
                    text = "MESSENGER",
                    fontSize = 13.sp,
                    letterSpacing = 5.sp,
                    color = Color(0xFF9FCBFF)
                )
                Spacer(Modifier.height(30.dp))

                if (signedIn) {
                    Text("Ты вошёл в Dolby404", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(10.dp))
                    Text("Аккаунт сайта и приложения общий.", color = Color(0xFFB9D9FF))
                    Spacer(Modifier.height(24.dp))
                    Text("Следующий этап — подключение списка чатов и сообщений.", color = Color.LightGray)
                    Spacer(Modifier.height(24.dp))
                    Button(
                        onClick = {
                            scope.launch {
                                busy = true
                                try {
                                    dolbyClient.auth.signOut()
                                    signedIn = false
                                    message = "Ты вышел из аккаунта."
                                } catch (e: Exception) {
                                    message = e.message ?: "Не удалось выйти."
                                } finally {
                                    busy = false
                                }
                            }
                        },
                        enabled = !busy
                    ) { Text("Выйти") }
                } else {
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Email") },
                        singleLine = true
                    )
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Пароль") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation()
                    )
                    Spacer(Modifier.height(20.dp))
                    Button(
                        onClick = {
                            scope.launch {
                                busy = true
                                message = "Подключаемся к Dolby404..."
                                try {
                                    dolbyClient.auth.signInWith(Email) {
                                        this.email = email.trim()
                                        this.password = password
                                    }
                                    signedIn = true
                                    message = "Авторизация успешна."
                                } catch (e: Exception) {
                                    message = e.message ?: "Не удалось войти. Проверь данные."
                                } finally {
                                    busy = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !busy && email.isNotBlank() && password.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF315DDA))
                    ) {
                        if (busy) CircularProgressIndicator()
                        else Text("ВОЙТИ В АККАУНТ")
                    }
                }

                Spacer(Modifier.height(18.dp))
                Text(message, color = Color(0xFFB9D9FF), fontSize = 13.sp)
            }
        }
    }
}
