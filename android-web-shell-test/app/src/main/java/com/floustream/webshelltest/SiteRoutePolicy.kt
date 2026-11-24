package com.floustream.webshelltest

import java.net.URI

/**
 * Validates FLOUSTREAM Pages URLs and SPA route names passed from the
 * token-scoped native WebView bridge.
 */
internal object SiteRoutePolicy {
    private const val SITE_HOST = "sergeybikov1991-create.github.io"
    private const val SITE_PATH = "/Dolby404/"
    private val knownRoutes = setOf(
        "index.html",
        "portal.html",
        "home.html",
        "profile.html",
        "messages.html",
        "friends.html",
        "public-profile.html",
        "music.html",
        "backgammon.html"
    )

    fun isTrustedOrigin(value: String?): Boolean {
        val uri = parse(value) ?: return false
        return uri.scheme.equals("https", ignoreCase = true) &&
            uri.host.equals(SITE_HOST, ignoreCase = true)
    }

    fun isTrustedSiteUrl(value: String?): Boolean {
        val uri = parse(value) ?: return false
        if (!isTrustedOrigin(value)) return false
        val path = uri.path.orEmpty()
        return path == SITE_PATH.removeSuffix("/") || path.startsWith(SITE_PATH)
    }

    fun routeName(value: String?): String? {
        val uri = parse(value) ?: return null
        if (!isTrustedSiteUrl(value)) return null
        val path = uri.path.orEmpty()
        val relative = when {
            path == SITE_PATH.removeSuffix("/") -> ""
            path.startsWith(SITE_PATH) -> path.removePrefix(SITE_PATH)
            else -> return null
        }
        return relative.substringBefore('/').ifBlank { "index.html" }
    }

    fun isKnownRouteName(route: String?): Boolean {
        val normalized = normalizeRoute(route) ?: return false
        return normalized in knownRoutes
    }

    fun isMessagesRouteName(route: String?): Boolean =
        normalizeRoute(route) == "messages.html"

    private fun normalizeRoute(route: String?): String? {
        val candidate = route?.trim()?.substringBefore('?')?.substringBefore('#') ?: return null
        if (candidate.isBlank() || candidate.contains("://") || candidate.contains('\\')) return null
        if (candidate.contains('/') && !candidate.startsWith(SITE_PATH)) return null
        return candidate.substringAfterLast('/').takeIf { it.isNotBlank() }
    }

    private fun parse(value: String?): URI? {
        if (value.isNullOrBlank()) return null
        return try {
            URI(value)
        } catch (_: Exception) {
            null
        }
    }
}
