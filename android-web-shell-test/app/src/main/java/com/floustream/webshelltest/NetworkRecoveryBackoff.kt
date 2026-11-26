package com.floustream.webshelltest

internal object NetworkRecoveryBackoff {
    const val MAX_ATTEMPTS = 8
    const val INITIAL_DELAY_MS = 1_000L
    const val MAX_DELAY_MS = 60_000L

    fun delayForAttempt(attempt: Int): Long {
        val exponent = attempt.coerceAtLeast(0).coerceAtMost(6)
        return minOf(MAX_DELAY_MS, INITIAL_DELAY_MS * (1L shl exponent))
    }
}
