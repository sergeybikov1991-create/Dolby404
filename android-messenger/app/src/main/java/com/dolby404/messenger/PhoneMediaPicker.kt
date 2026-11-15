package com.dolby404.messenger

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect

/**
 * Opens Android's native Photo Picker instead of a document/file browser.
 * The system picker grants temporary read access to the selected media,
 * so the app does not need broad photo-library permissions for attachments.
 */
@Composable
internal fun PhoneMediaPickerDialog(
    isVideo: Boolean,
    onDismiss: () -> Unit,
    onSelected: (List<Uri>) -> Unit
) {
    val picker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickMultipleVisualMedia(20)
    ) { uris ->
        if (uris.isEmpty()) {
            onDismiss()
        } else {
            onSelected(uris)
        }
    }

    LaunchedEffect(isVideo) {
        val mediaType = if (isVideo) {
            ActivityResultContracts.PickVisualMedia.VideoOnly
        } else {
            ActivityResultContracts.PickVisualMedia.ImageOnly
        }
        picker.launch(PickVisualMediaRequest(mediaType))
    }
}
