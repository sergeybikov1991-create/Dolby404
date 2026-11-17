package com.dolby404.messenger

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect

/**
 * Opens the system Photo Picker with both photos and videos in one gallery.
 * Android grants temporary read access only to the selected media.
 */
@Composable
internal fun PhoneMediaPickerDialog(
    onDismiss: () -> Unit,
    onSelected: (List<Uri>) -> Unit
) {
    val picker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickMultipleVisualMedia(20)
    ) { uris ->
        if (uris.isEmpty()) onDismiss() else onSelected(uris)
    }

    LaunchedEffect(Unit) {
        picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageAndVideo))
    }
}
