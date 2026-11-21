package com.floustream.webshelltest

/**
 * Native request gate for guest media. It blocks album REST reads and all
 * Storage object operations for album buckets, including signed-URL creation
 * endpoints whose URL ends at the bucket name (without an object path).
 */
internal object GuestPhotoRequestPolicy {
    private val imageExtensions = setOf(
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".heic", ".heif"
    )
    private val albumBuckets = setOf(
        "photo-albums",
        "private-albums",
        "video-albums",
        "private-video-albums"
    )
    private val albumTables = setOf(
        "photo_album_photos",
        "private_album_photos",
        "private_photo_albums",
        "video_album_videos",
        "private_video_album_videos"
    )

    fun shouldBlock(
        authenticatedUserId: String?,
        encodedPath: String,
        requestHeaders: Map<String, String>
    ): Boolean {
        if (!authenticatedUserId.isNullOrBlank()) return false

        val path = encodedPath.lowercase()
        val segments = path.split('/').filter(String::isNotBlank)
        val accept = requestHeaders.entries
            .firstOrNull { it.key.equals("Accept", ignoreCase = true) }
            ?.value.orEmpty()
        val isImageRequest = accept.contains("image/", ignoreCase = true)
        val imageExtension = imageExtensions.any(path::endsWith)

        val restTable = if (segments.size >= 3 && segments[0] == "rest" && segments[1] == "v1") {
            segments[2].substringBefore('?')
        } else ""
        val albumTableRequest = restTable in albumTables

        val objectIndex = segments.indexOf("object")
        val storageBucket = if (objectIndex >= 0) segments.getOrNull(objectIndex + 2) else null
        val albumStorageRequest =
            segments.size >= 3 &&
            segments[0] == "storage" &&
            segments[1] == "v1" &&
            storageBucket in albumBuckets

        val profileOrPostImageRequest = segments.size >= 4 &&
            segments[0] == "storage" &&
            segments[1] == "v1" &&
            segments[2] == "object" &&
            (segments[3] == "avatars" || segments[3] == "posts") &&
            (isImageRequest || imageExtension)

        return albumTableRequest || albumStorageRequest || profileOrPostImageRequest
    }
}
