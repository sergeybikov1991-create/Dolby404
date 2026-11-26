package com.floustream.webshelltest

import org.junit.Assert.assertEquals
import org.junit.Test

class NetworkRecoveryBackoffTest {
    @Test
    fun retryDelayUsesExponentialBackoffAndCapsAtOneMinute() {
        assertEquals(1_000L, NetworkRecoveryBackoff.delayForAttempt(0))
        assertEquals(2_000L, NetworkRecoveryBackoff.delayForAttempt(1))
        assertEquals(4_000L, NetworkRecoveryBackoff.delayForAttempt(2))
        assertEquals(8_000L, NetworkRecoveryBackoff.delayForAttempt(3))
        assertEquals(16_000L, NetworkRecoveryBackoff.delayForAttempt(4))
        assertEquals(32_000L, NetworkRecoveryBackoff.delayForAttempt(5))
        assertEquals(60_000L, NetworkRecoveryBackoff.delayForAttempt(6))
        assertEquals(60_000L, NetworkRecoveryBackoff.delayForAttempt(7))
        assertEquals(60_000L, NetworkRecoveryBackoff.delayForAttempt(100))
    }

    @Test
    fun negativeAttemptStartsAtInitialDelay() {
        assertEquals(1_000L, NetworkRecoveryBackoff.delayForAttempt(-1))
    }
}
