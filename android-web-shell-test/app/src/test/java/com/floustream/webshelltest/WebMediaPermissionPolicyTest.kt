package com.floustream.webshelltest

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WebMediaPermissionPolicyTest {
    @Test
    fun trustsOnlyTheProductionHttpsOrigin() {
        assertTrue(
            WebMediaPermissionPolicy.isTrustedOrigin(
                "https",
                "sergeybikov1991-create.github.io"
            )
        )
        assertFalse(
            WebMediaPermissionPolicy.isTrustedOrigin(
                "http",
                "sergeybikov1991-create.github.io"
            )
        )
        assertFalse(
            WebMediaPermissionPolicy.isTrustedOrigin(
                "https",
                "untrusted.example"
            )
        )
        assertFalse(
            WebMediaPermissionPolicy.isTrustedOrigin(
                "https",
                "github.io"
            )
        )
    }

    @Test
    fun rejectsEmptyOrUnsupportedCaptureRequests() {
        assertFalse(WebMediaPermissionPolicy.isSupportedRequest(emptyList()))
        assertFalse(
            WebMediaPermissionPolicy.isSupportedRequest(
                listOf(WebMediaPermissionPolicy.AUDIO_CAPTURE, "android.webkit.resource.MIDI_SYSEX")
            )
        )
    }

    @Test
    fun mapsAudioAndVideoToTheirOwnRuntimePermissions() {
        assertEquals(
            listOf(WebMediaPermissionPolicy.RECORD_AUDIO_PERMISSION),
            WebMediaPermissionPolicy.requiredRuntimePermissions(
                listOf(WebMediaPermissionPolicy.AUDIO_CAPTURE)
            )
        )
        assertEquals(
            listOf(WebMediaPermissionPolicy.CAMERA_PERMISSION),
            WebMediaPermissionPolicy.requiredRuntimePermissions(
                listOf(WebMediaPermissionPolicy.VIDEO_CAPTURE)
            )
        )
        assertEquals(
            listOf(
                WebMediaPermissionPolicy.RECORD_AUDIO_PERMISSION,
                WebMediaPermissionPolicy.CAMERA_PERMISSION
            ),
            WebMediaPermissionPolicy.requiredRuntimePermissions(
                listOf(
                    WebMediaPermissionPolicy.AUDIO_CAPTURE,
                    WebMediaPermissionPolicy.VIDEO_CAPTURE
                )
            )
        )
    }

    @Test
    fun grantsOnlyCapabilitiesWhoseAndroidPermissionWasGranted() {
        val requested = listOf(
            WebMediaPermissionPolicy.AUDIO_CAPTURE,
            WebMediaPermissionPolicy.VIDEO_CAPTURE
        )
        assertEquals(
            listOf(WebMediaPermissionPolicy.AUDIO_CAPTURE),
            WebMediaPermissionPolicy.grantableResources(
                requested,
                setOf(WebMediaPermissionPolicy.RECORD_AUDIO_PERMISSION)
            )
        )
        assertEquals(
            listOf(WebMediaPermissionPolicy.VIDEO_CAPTURE),
            WebMediaPermissionPolicy.grantableResources(
                requested,
                setOf(WebMediaPermissionPolicy.CAMERA_PERMISSION)
            )
        )
        assertTrue(
            WebMediaPermissionPolicy.grantableResources(requested, emptySet()).isEmpty()
        )
    }

    @Test
    fun neverGrantsUnknownResourcesEvenWhenPermissionsAreGranted() {
        assertTrue(
            WebMediaPermissionPolicy.grantableResources(
                listOf("android.webkit.resource.MIDI_SYSEX"),
                setOf(
                    WebMediaPermissionPolicy.RECORD_AUDIO_PERMISSION,
                    WebMediaPermissionPolicy.CAMERA_PERMISSION
                )
            ).isEmpty()
        )
    }
}
