package com.dolby404.messenger.voice

/**
 * One-shot confirmation bound to the exact typed action and context revision.
 * A confirmation becomes invalid after navigation, timeout, cancellation or use.
 */
class VoiceConfirmationGate(
    private val ttlMillis: Long = 30_000L,
    private val tokenFactory: () -> String
) {
    data class Pending(
        val token: String,
        val action: VoiceAction,
        val prompt: String,
        val contextRevision: Long,
        val createdAtMillis: Long
    )

    private var pending: Pending? = null

    @Synchronized
    fun request(
        action: VoiceAction,
        prompt: String,
        contextRevision: Long,
        nowMillis: Long
    ): Pending {
        require(prompt.isNotBlank())
        return Pending(tokenFactory(), action, prompt, contextRevision, nowMillis)
            .also { pending = it }
    }

    @Synchronized
    fun confirm(
        token: String,
        contextRevision: Long,
        nowMillis: Long
    ): VoiceAction? {
        val candidate = pending ?: return null
        pending = null // one-shot even when stale or invalid
        if (candidate.token != token) return null
        if (candidate.contextRevision != contextRevision) return null
        if (nowMillis < candidate.createdAtMillis) return null
        if (nowMillis - candidate.createdAtMillis > ttlMillis) return null
        return candidate.action
    }

    @Synchronized
    fun cancel() {
        pending = null
    }

    @Synchronized
    fun current(): Pending? = pending
}
