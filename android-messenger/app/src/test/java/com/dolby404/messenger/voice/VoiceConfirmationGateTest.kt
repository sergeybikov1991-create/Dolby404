package com.dolby404.messenger.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class VoiceConfirmationGateTest {
    private fun gate() = VoiceConfirmationGate(ttlMillis = 1_000L) { "token-1" }

    @Test fun confirmsExactActionOnlyOnce() {
        val gate = gate()
        val action = VoiceAction.SendMessage("c-1", "Привет")
        val pending = gate.request(action, "Отправить?", 7L, 100L)
        assertEquals(action, gate.confirm(pending.token, 7L, 200L))
        assertNull(gate.confirm(pending.token, 7L, 201L))
    }

    @Test fun navigationInvalidatesConfirmation() {
        val gate = gate()
        val pending = gate.request(VoiceAction.DeleteMessage("m-1"), "Удалить?", 4L, 100L)
        assertNull(gate.confirm(pending.token, 5L, 200L))
    }

    @Test fun timeoutAndWrongTokenAreRejected() {
        val gate = gate()
        val pending = gate.request(VoiceAction.StartCall("u-1", CallType.VIDEO), "Звонить?", 2L, 100L)
        assertNull(gate.confirm("wrong", 2L, 200L))
        val next = gate.request(VoiceAction.DeleteMessage("m-2"), "Удалить?", 2L, 100L)
        assertNull(gate.confirm(next.token, 2L, 1_101L))
        assertNull(gate.current())
    }

    @Test fun cancellationClearsPendingAction() {
        val gate = gate()
        gate.request(VoiceAction.SendMessage("c-1", "x"), "Отправить?", 1L, 0L)
        gate.cancel()
        assertNull(gate.current())
    }
}
