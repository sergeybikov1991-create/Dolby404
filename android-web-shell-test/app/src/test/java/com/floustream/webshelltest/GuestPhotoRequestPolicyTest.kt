package com.floustream.webshelltest

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GuestPhotoRequestPolicyTest {
    @Test
    fun guestAlbumTableRequestsAreBlocked() {
        assertTrue(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/rest/v1/photo_album_photos?select=*",
                emptyMap()
            )
        )
        assertTrue(
            GuestPhotoRequestPolicy.shouldBlock(
                "",
                "/rest/v1/private_album_photos?select=*",
                emptyMap()
            )
        )
    }

    @Test
    fun guestAlbumStorageObjectsAreBlockedForBothBuckets() {
        assertTrue(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/storage/v1/object/sign/photo-albums/user/photo.jpg",
                emptyMap()
            )
        )
        assertTrue(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/storage/v1/object/private-albums/user/photo.webp",
                emptyMap()
            )
        )
    }

    @Test
    fun guestVideoAlbumRowsAndSignedUrlEndpointsAreBlocked() {
        assertTrue(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/rest/v1/video_album_videos?select=*",
                emptyMap()
            )
        )
        assertTrue(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/rest/v1/private_video_album_videos?select=*",
                emptyMap()
            )
        )
        assertTrue(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/storage/v1/object/sign/photo-albums",
                emptyMap()
            )
        )
        assertTrue(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/storage/v1/object/sign/video-albums",
                emptyMap()
            )
        )
    }

    @Test
    fun guestProfileAndPostImagesAreBlockedButNonImageFilesAreNot() {
        assertTrue(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/storage/v1/object/public/avatars/user/avatar.png",
                mapOf("Accept" to "image/avif,image/webp,*/*")
            )
        )
        assertTrue(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/storage/v1/object/public/posts/user/clip.jpg",
                emptyMap()
            )
        )
        assertFalse(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/storage/v1/object/public/posts/user/video.mp4",
                emptyMap()
            )
        )
        assertFalse(
            GuestPhotoRequestPolicy.shouldBlock(
                null,
                "/storage/v1/object/public/message-media/user/document.pdf",
                emptyMap()
            )
        )
    }

    @Test
    fun authenticatedUserCanLoadTheirPermittedAlbumResources() {
        assertFalse(
            GuestPhotoRequestPolicy.shouldBlock(
                "b7b9a3b5-4b3c-4f91-9a25-62b2dcd0f4c1",
                "/rest/v1/private_album_photos?select=*",
                emptyMap()
            )
        )
        assertFalse(
            GuestPhotoRequestPolicy.shouldBlock(
                "b7b9a3b5-4b3c-4f91-9a25-62b2dcd0f4c1",
                "/storage/v1/object/sign/photo-albums/user/photo.jpg",
                emptyMap()
            )
        )
    }
}
