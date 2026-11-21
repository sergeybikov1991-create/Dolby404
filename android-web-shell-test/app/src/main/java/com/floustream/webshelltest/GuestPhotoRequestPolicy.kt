package com.floustream.webshelltest

/**
 * Native request gate for photo-album media. A guest must not download album
 * rows or photo objects even if a hosted page accidentally exposes a URL.
 */
internal object GuestPhotoRequestPolicy {
    private val imageExtensions = setOf(
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".heic", ".heif"
    )

    fun shouldBlock(
        authenticatedUserId: String?,
        encodedPath: String,
        requestHeaders: Map<String, String>
    ): Boolean {
        if (!authenticatedUserId.isNullOrBlank()) return false

        val path = encodedPath.lowercase()
        val accept = requestHeaders.entries
            .firstOrNull { it.key.equals("Accept", ignoreCase = true) }
            ?.value.orEmpty()
        val isImageRequest = accept.contains("image/", ignoreCase = true)
        val imageExtension = imageExtensions.any(path::endsWith)

        val albumTableRequest =
            path.contains("/rest/v1/photo_album_photos") ||
            path.contains("/rest/v1/private_album_photos")

        val albumStorageRequest = path.contains("/storage/v1/object/") &&
            (path.contains("/photo-albums/") || path.contains("/private-albums/"))

        val profileOrPostImageRequest = path.contains("/storage/v1/object/") &&
            (path.contains("/avatars/") || path.contains("/posts/")) &&
            (isImageRequest || imageExtension)

        return albumTableRequest || albumStorageRequest || profileOrPostImageRequest
    }
}
