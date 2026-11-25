package com.floustream.webshelltest

import android.webkit.JavascriptInterface

/**
 * JavaScript bridge that mirrors the website's Supabase session into app-private
 * storage. The interface is attached only while the WebView shows a trusted
 * FLOUSTREAM HTTPS page and is removed for every other origin, exactly like the
 * existing voice bridge.
 *
 * Values are validated by [SessionMirrorPolicy], so the page cannot use this
 * bridge to store arbitrary data.
 */
class SessionMirrorBridge(private val store: SessionMirrorStore) {
    @JavascriptInterface
    fun save(raw: String) {
        store.save(raw)
    }

    @JavascriptInterface
    fun clear() {
        store.clear()
    }
}
