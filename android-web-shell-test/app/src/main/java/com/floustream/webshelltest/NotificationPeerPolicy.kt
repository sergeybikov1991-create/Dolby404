package com.floustream.webshelltest

/**
 * Accepts only canonical UUID peer identifiers from notification intents.
 */
internal object NotificationPeerPolicy {
    private val uuidPattern = Regex(
        "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    )

    fun normalize(value: String?): String? =
        value?.trim()?.takeIf { uuidPattern.matches(it) }
}
