package com.dolby404.messenger

import android.Manifest
import android.content.ContentUris
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.BaseColumns
import android.provider.MediaStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private data class PhoneMediaItem(
    val uri: Uri,
    val name: String,
    val mime: String
)

@Composable
internal fun PhoneMediaPickerDialog(
    isVideo: Boolean,
    onDismiss: () -> Unit,
    onSelected: (List<Uri>) -> Unit
) {
    val context = LocalContext.current
    val mediaPermission = remember(isVideo) {
        when {
            Build.VERSION.SDK_INT >= 34 -> if (isVideo) Manifest.permission.READ_MEDIA_VIDEO else Manifest.permission.READ_MEDIA_IMAGES
            Build.VERSION.SDK_INT >= 33 -> if (isVideo) Manifest.permission.READ_MEDIA_VIDEO else Manifest.permission.READ_MEDIA_IMAGES
            else -> Manifest.permission.READ_EXTERNAL_STORAGE
        }
    }
    val extraPermission = if (Build.VERSION.SDK_INT >= 34) Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED else null
    fun permissionGranted(): Boolean {
        val primary = ContextCompat.checkSelfPermission(context, mediaPermission) == PackageManager.PERMISSION_GRANTED
        val selected = extraPermission?.let {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        } ?: false
        return primary || selected
    }

    var hasPermission by remember { mutableStateOf(permissionGranted()) }
    var permissionDenied by remember { mutableStateOf(false) }
    var media by remember { mutableStateOf<List<PhoneMediaItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var selectedUris by remember { mutableStateOf<Set<Uri>>(emptySet()) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        hasPermission = permissionGranted() || result.values.any { it }
        permissionDenied = !hasPermission
    }

    fun requestPermission() {
        val requested = buildList {
            add(mediaPermission)
            extraPermission?.let { add(it) }
        }.toTypedArray()
        permissionLauncher.launch(requested)
    }

    LaunchedEffect(Unit) {
        if (!hasPermission) requestPermission()
    }

    LaunchedEffect(hasPermission, isVideo) {
        if (!hasPermission) {
            loading = false
            return@LaunchedEffect
        }
        loading = true
        media = withContext(Dispatchers.IO) {
            val collection = if (isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI
                else MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            val projection = arrayOf(
                BaseColumns._ID,
                MediaStore.MediaColumns.DISPLAY_NAME,
                MediaStore.MediaColumns.MIME_TYPE
            )
            val result = mutableListOf<PhoneMediaItem>()
            context.contentResolver.query(
                collection,
                projection,
                null,
                null,
                "${MediaStore.MediaColumns.DATE_ADDED} DESC"
            )?.use { cursor ->
                val idIndex = cursor.getColumnIndexOrThrow(BaseColumns._ID)
                val nameIndex = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
                val mimeIndex = cursor.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE)
                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idIndex)
                    val name = if (nameIndex >= 0) cursor.getString(nameIndex) ?: "Медиафайл" else "Медиафайл"
                    val mime = if (mimeIndex >= 0) cursor.getString(mimeIndex) ?: if (isVideo) "video/*" else "image/*" else if (isVideo) "video/*" else "image/*"
                    result += PhoneMediaItem(ContentUris.withAppendedId(collection, id), name, mime)
                }
            }
            result
        }
        loading = false
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Column(
            Modifier.fillMaxSize().background(Color(0xFF080D1B)).padding(14.dp)
        ) {
            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f)) {
                    Text(if (isVideo) "Видео телефона" else "Галерея телефона", color = Color.White, fontSize = 20.sp)
                    Text("Выбрано: ${selectedUris.size}", color = Color(0xFF91A2BF), fontSize = 12.sp)
                }
                TextButton(onClick = onDismiss) { Text("Закрыть") }
            }
            when {
                loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF548BFF))
                }
                !hasPermission -> Column(
                    Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        if (permissionDenied) "Разреши доступ к фото и видео, чтобы открыть галерею."
                        else "Нужен доступ к медиатеке телефона.",
                        color = Color(0xFF91A2BF)
                    )
                    Button(onClick = { requestPermission() }) { Text("Разрешить доступ") }
                }
                media.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(if (isVideo) "В телефоне пока нет видео." else "В телефоне пока нет фотографий.", color = Color(0xFF91A2BF))
                }
                else -> LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentPadding = PaddingValues(vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(media, key = { it.uri.toString() }) { item ->
                        val chosen = item.uri in selectedUris
                        Box(
                            Modifier.aspectRatio(1f).clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF18243B))
                                .clickable {
                                    selectedUris = if (chosen) selectedUris - item.uri else selectedUris + item.uri
                                }
                        ) {
                            AsyncImage(
                                model = item.uri,
                                contentDescription = item.name,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                            if (chosen) {
                                Surface(
                                    Modifier.align(Alignment.TopEnd).padding(5.dp),
                                    color = Color(0xFF548BFF),
                                    shape = RoundedCornerShape(20.dp)
                                ) {
                                    Text("✓", Modifier.padding(horizontal = 7.dp, vertical = 2.dp), color = Color.White, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
            if (hasPermission) {
                Button(
                    onClick = { if (selectedUris.isNotEmpty()) onSelected(selectedUris.toList()) },
                    enabled = selectedUris.isNotEmpty(),
                    modifier = Modifier.fillMaxWidth().padding(top = 10.dp)
                ) {
                    Text("Добавить выбранное (${selectedUris.size})")
                }
            }
        }
    }
}
