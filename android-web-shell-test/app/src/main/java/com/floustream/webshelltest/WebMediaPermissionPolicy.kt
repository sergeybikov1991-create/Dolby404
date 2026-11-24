package com.floustream.webshelltest

/**
 * Least-privilege policy for WebView media capture.
 *
 * Only the production FLOUSTREAM HTTPS origin may request microphone or
 * camera access. Every requested WebView capability must have its matching
 * Android runtime permission before it is granted.
 */
internal object WebMediaPermissionPolicy {
    const val AUDIO_CAPTURE = "android.webkit.resource.AUDIO_CAPTURE"
    const val VIDEO_CAPTURE = "android.webkit.resource.VIDEO_CAPTURE"
    const val RECORD_AUDIO_PERMISSION = "android.permission.RECORD_AUDIO"
    const val CAMERA_PERMISSION = "android.permission.CAMERA"

    private val supportedResources = setOf(AUDIO_CAPTURE, VIDEO_CAPTURE)

    fun isTrustedOrigin(scheme: String?, host: String?): Boolean =
        scheme == "https" && host == "sergeybikov1991-create.github.io"

    fun isSupportedRequest(resources: Collection<String>): Boolean =
        resources.isNotEmpty() && resources.all { it in supportedResources }

    fun requiredRuntimePermissions(resources: Collection<String>): List<String> {
        if (!isSupportedRequest(resources)) return emptyList()
        return buildList {
            if (AUDIO_CAPTURE in resources) add(RECORD_AUDIO_PERMISSION)
            if (VIDEO_CAPTURE in resources) add(CAMERA_PERMISSION)
        }
    }

    fun grantableResources(
        resources: Collection<String>,
        grantedPermissions: Set<String>
    ): List<String> {
        if (!isSupportedRequest(resources)) return emptyList()
        return resources.filter { resource ->
            when (resource) {
                AUDIO_CAPTURE -> RECORD_AUDIO_PERMISSION in grantedPermissions
                VIDEO_CAPTURE -> CAMERA_PERMISSION in grantedPermissions
                else -> false
            }
        }
    }
}
