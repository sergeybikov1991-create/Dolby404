package com.floustream.webshelltest.audio

import android.webkit.JavascriptInterface

/**
 * Narrow WebView bridge: JavaScript can only acquire/release the voice-message
 * microphone lease. It cannot read app data or invoke arbitrary native actions.
 */
class VoiceMessageAudioBridge(
    private val coordinator: VoiceAudioSessionCoordinator
) {
    private var lease: VoiceAudioSessionCoordinator.Lease? = null

    @JavascriptInterface
    @Synchronized
    fun tryAcquireVoiceMessage(): Boolean {
        if (lease != null) return false
        lease = coordinator.tryAcquire(VoiceAudioOwner.VOICE_MESSAGE)
        return lease != null
    }

    @JavascriptInterface
    @Synchronized
    fun releaseVoiceMessage() {
        lease?.close()
        lease = null
    }
}
