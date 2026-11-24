package com.floustream.webshelltest

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SiteRoutePolicyTest {
    @Test
    fun acceptsOnlyTheTrustedHttpsSitePath() {
        assertTrue(SiteRoutePolicy.isTrustedSiteUrl(
            "https://sergeybikov1991-create.github.io/Dolby404/home.html"
        ))
        assertTrue(SiteRoutePolicy.isTrustedSiteUrl(
            "https://sergeybikov1991-create.github.io/Dolby404"
        ))
        assertFalse(SiteRoutePolicy.isTrustedSiteUrl(
            "http://sergeybikov1991-create.github.io/Dolby404/home.html"
        ))
        assertFalse(SiteRoutePolicy.isTrustedOrigin("relative/path"))
        assertFalse(SiteRoutePolicy.isTrustedOrigin("mailto:someone@example.com"))
        assertFalse(SiteRoutePolicy.isTrustedSiteUrl(
            "https://example.com/Dolby404/home.html"
        ))
        assertFalse(SiteRoutePolicy.isTrustedSiteUrl(
            "https://sergeybikov1991-create.github.io/another-app/home.html"
        ))
        assertFalse(SiteRoutePolicy.isTrustedSiteUrl(
            "https://sergeybikov1991-create.github.io:8443/Dolby404/home.html"
        ))
        assertFalse(SiteRoutePolicy.isTrustedSiteUrl(
            "https://user@sergeybikov1991-create.github.io/Dolby404/home.html"
        ))
        assertFalse(SiteRoutePolicy.isTrustedSiteUrl(
            "https://sergeybikov1991-create.github.io/Dolby404/../another-app/home.html"
        ))
        assertFalse(SiteRoutePolicy.isTrustedSiteUrl(
            "https://sergeybikov1991-create.github.io/Dolby404/%2e%2e/another-app/home.html"
        ))
    }

    @Test
    fun resolvesSiteRouteWithoutQueryOrFragment() {
        assertEquals(
            "messages.html",
            SiteRoutePolicy.routeName(
                "https://sergeybikov1991-create.github.io/Dolby404/messages.html?peer=abc#chat"
            )
        )
        assertEquals(
            "index.html",
            SiteRoutePolicy.routeName("https://sergeybikov1991-create.github.io/Dolby404/")
        )
        assertEquals(null, SiteRoutePolicy.routeName("https://example.com/messages.html"))
    }

    @Test
    fun recognizesOnlyKnownRoutesForNativeBridgeCallbacks() {
        assertTrue(SiteRoutePolicy.isKnownRouteName("messages.html"))
        assertTrue(SiteRoutePolicy.isMessagesRouteName("messages.html?peer=abc"))
        assertFalse(SiteRoutePolicy.isMessagesRouteName("home.html"))
        assertFalse(SiteRoutePolicy.isKnownRouteName("https://evil.example/messages.html"))
        assertFalse(SiteRoutePolicy.isKnownRouteName("../messages.html"))
    }
}
