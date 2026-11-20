package com.floustream.webshelltest

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private var entryResolved = false
    private var authFlowActive = false
    private var startupAuthCheckPending = false

    private companion object {
        const val SITE_BASE_URL = "https://sergeybikov1991-create.github.io/Dolby404/"
        const val WELCOME_ASSET_URL = "file:///android_asset/index.html"
        const val AUTH_URL = SITE_BASE_URL + "portal.html"
        const val PROFILE_URL = SITE_BASE_URL + "profile.html"
        const val HOME_URL = SITE_BASE_URL + "home.html"
        const val SUPABASE_STORAGE_KEY = "sb-qhpobdktlbhdqsnajypr-auth-token"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            visibility = View.INVISIBLE
            setBackgroundColor(android.graphics.Color.rgb(12, 14, 30))
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.loadsImagesAutomatically = true
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.setSupportMultipleWindows(false)
            webViewClient = object : WebViewClient() {
                override fun onPageStarted(
                    view: WebView?,
                    url: String?,
                    favicon: android.graphics.Bitmap?
                ) {
                    super.onPageStarted(view, url, favicon)
                    val target = url.orEmpty()

                    // Do not replace the auth page before checking its origin storage.
                    // The entry page can fall back to portal.html even when a saved
                    // Supabase session is still present in WebView localStorage.
                    if (!entryResolved && target.startsWith(AUTH_URL)) {
                        startupAuthCheckPending = true
                        view?.visibility = View.INVISIBLE
                        return
                    }

                    // Existing sessions and successful authentication both land on Home.
                    if (target.startsWith(PROFILE_URL)) {
                        entryResolved = true
                        startupAuthCheckPending = false
                        authFlowActive = false
                        view?.stopLoading()
                        view?.loadUrl(HOME_URL)
                        return
                    }

                    if (target.startsWith(AUTH_URL) && entryResolved) {
                        authFlowActive = true
                    }
                    if (target == WELCOME_ASSET_URL || target.startsWith(HOME_URL)) {
                        entryResolved = true
                        view?.visibility = View.VISIBLE
                    }
                }

                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val target = request?.url?.toString().orEmpty()

                    if (target.startsWith(AUTH_URL) && !entryResolved) {
                        startupAuthCheckPending = true
                        view?.visibility = View.INVISIBLE
                        return false
                    }

                    if (target.startsWith(PROFILE_URL)) {
                        entryResolved = true
                        startupAuthCheckPending = false
                        authFlowActive = false
                        view?.loadUrl(HOME_URL)
                        return true
                    }

                    if (target.startsWith(AUTH_URL)) {
                        authFlowActive = true
                    }
                    if (target.startsWith(HOME_URL)) {
                        entryResolved = true
                        view?.visibility = View.VISIBLE
                    }
                    return false
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: android.webkit.WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame == true && !entryResolved) {
                        showBundledWelcome(view)
                    }
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    this@MainActivity.title = "FLOUSTREAM"

                    if (!entryResolved &&
                        startupAuthCheckPending &&
                        url?.startsWith(AUTH_URL) == true
                    ) {
                        checkSavedSupabaseSession(view)
                        return
                    }

                    if (url == WELCOME_ASSET_URL || url?.startsWith(HOME_URL) == true) {
                        view?.visibility = View.VISIBLE
                    }
                }
            }
            webChromeClient = WebChromeClient()
        }

        setContentView(webView)
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        // WebView DOM storage is enabled above. The website and APK share the
        // same HTTPS origin, so its Supabase localStorage session survives restarts.
        webView.loadUrl(SITE_BASE_URL)
    }

    private fun checkSavedSupabaseSession(view: WebView?) {
        if (entryResolved || view == null) return

        val script = """
            (function() {
                try {
                    var raw = window.localStorage.getItem('$SUPABASE_STORAGE_KEY');
                    if (!raw) return false;
                    var session = JSON.parse(raw);
                    return !!(
                        session &&
                        typeof session.access_token === 'string' &&
                        session.access_token.length > 0 &&
                        typeof session.refresh_token === 'string' &&
                        session.refresh_token.length > 0
                    );
                } catch (error) {
                    return false;
                }
            })();
        """.trimIndent()

        view.evaluateJavascript(script) { result ->
            if (entryResolved || isFinishing || isDestroyed) return@evaluateJavascript

            startupAuthCheckPending = false
            if (result == "true") {
                // A saved session exists. Let home.html validate/refresh it with Supabase.
                entryResolved = true
                authFlowActive = false
                view.stopLoading()
                view.loadUrl(HOME_URL)
            } else {
                // No saved session: show the APK's own welcome screen.
                showBundledWelcome(view)
            }
        }
    }

    private fun showBundledWelcome(view: WebView?) {
        if (entryResolved) return
        entryResolved = true
        startupAuthCheckPending = false
        authFlowActive = false
        view?.stopLoading()
        view?.loadUrl(WELCOME_ASSET_URL)
    }

    @Deprecated("Deprecated in Android API; retained for compatibility with the test harness")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.stopLoading()
            webView.destroy()
        }
        super.onDestroy()
    }
}
