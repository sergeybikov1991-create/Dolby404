package com.floustream.webshelltest

import android.annotation.SuppressLint
import android.content.Context

/**
 * Validation rules for the native mirror of the website's Supabase session.
 *
 * The mirror only ever stores the exact JSON document that supabase-js keeps in
 * the WebView's `localStorage`; it never derives, refreshes or rewrites tokens.
 * Kept free of Android dependencies so it stays unit-testable.
 */
internal object SessionMirrorPolicy {
    /** The site's Supabase storage key, see shared/supabase-client.mjs. */
    const val STORAGE_KEY = "sb-qhpobdktlbhdqsnajypr-auth-token"

    private const val MAX_LENGTH = 64 * 1024

    fun normalize(raw: String?): String? {
        val value = raw?.trim().orEmpty()
        if (value.length < 2 || value.length > MAX_LENGTH) return null
        if (!value.startsWith("{") || !value.endsWith("}")) return null
        if (!value.contains("\"access_token\"")) return null
        if (!value.contains("\"refresh_token\"")) return null
        return value
    }
}

/**
 * Persists the last session supabase-js wrote into WebView storage.
 *
 * Chromium commits `localStorage` to disk asynchronously (a few seconds after
 * the last write). When Android kills the process sooner, the freshly saved
 * Supabase session is lost and the next launch starts signed out. Writing the
 * same document through `commit()` keeps it available for the next start.
 */
class SessionMirrorStore(context: Context) {
    private val prefs = context.applicationContext
        .getSharedPreferences("floustream-session-mirror", Context.MODE_PRIVATE)

    // commit() is deliberate: apply() can be lost when Android kills the process
    // immediately after the website saves a session.
    @SuppressLint("ApplySharedPref")
    fun save(raw: String?) {
        val value = SessionMirrorPolicy.normalize(raw) ?: return
        prefs.edit().putString(KEY_SESSION, value).commit()
    }

    fun read(): String? =
        SessionMirrorPolicy.normalize(prefs.getString(KEY_SESSION, null))

    @SuppressLint("ApplySharedPref")
    fun clear() {
        prefs.edit().remove(KEY_SESSION).commit()
    }

    private companion object {
        const val KEY_SESSION = "supabase-session"
    }
}
