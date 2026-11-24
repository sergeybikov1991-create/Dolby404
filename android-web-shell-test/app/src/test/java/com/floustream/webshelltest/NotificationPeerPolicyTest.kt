package com.floustream.webshelltest

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class NotificationPeerPolicyTest {
    @Test
    fun acceptsCanonicalUuidAndTrimsWhitespace() {
        assertEquals(
            "a2b3c4d5-e6f7-4890-a123-b4567890cdef",
            NotificationPeerPolicy.normalize("  a2b3c4d5-e6f7-4890-a123-b4567890cdef  ")
        )
    }

    @Test
    fun rejectsMalformedOrMissingPeerIds() {
        assertNull(NotificationPeerPolicy.normalize(null))
        assertNull(NotificationPeerPolicy.normalize(""))
        assertNull(NotificationPeerPolicy.normalize("not-a-user-id"))
        assertNull(NotificationPeerPolicy.normalize("a2b3c4d5-e6f7-4890-a123-b4567890cde"))
        assertNull(NotificationPeerPolicy.normalize("https://example.com"))
    }
}
