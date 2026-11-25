package com.floustream.webshelltest

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SessionMirrorPolicyTest {
    private val session = """
        {"access_token":"a.b.c","refresh_token":"r1","expires_at":1893456000,"token_type":"bearer"}
    """.trimIndent()

    @Test
    fun storedSupabaseSessionIsAcceptedVerbatim() {
        assertEquals(session, SessionMirrorPolicy.normalize(session))
    }

    @Test
    fun surroundingWhitespaceIsTrimmed() {
        assertEquals(session, SessionMirrorPolicy.normalize("  $session\n"))
    }

    @Test
    fun emptyOrMissingValuesAreRejected() {
        assertNull(SessionMirrorPolicy.normalize(null))
        assertNull(SessionMirrorPolicy.normalize(""))
        assertNull(SessionMirrorPolicy.normalize("   "))
    }

    @Test
    fun nonSessionPayloadsAreRejected() {
        assertNull(SessionMirrorPolicy.normalize("null"))
        assertNull(SessionMirrorPolicy.normalize("[]"))
        assertNull(SessionMirrorPolicy.normalize("{\"user\":{\"id\":\"1\"}}"))
        assertNull(
            SessionMirrorPolicy.normalize(
                "{\"access_token\":\"a.b.c\"}"
            )
        )
    }
}
