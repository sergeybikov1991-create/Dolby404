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

    private companion object {
        const val SITE_BASE_URL = "https://sergeybikov1991-create.github.io/Dolby404/"
        const val WELCOME_ASSET_URL = "file:///android_asset/index.html"
        const val AUTH_URL = SITE_BASE_URL + "portal.html"
        const val PROFILE_URL = SITE_BASE_URL + "profile.html"
        const val HOME_URL = SITE_BASE_URL + "home.html"
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

                    // The website's existing entry point decides whether a session exists.
                    // Signed-out visitors are shown the APK-bundled welcome screen instead
                    // of changing the live website's entry page.
                    if (!entryResolved && target.startsWith(AUTH_URL)) {
                        showBundledWelcome(view)
                        return
                    }

                    // Existing sessions and successful authentication both land on Home.
                    if (target.startsWith(PROFILE_URL)) {
                        entryResolved = true
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
                        showBundledWelcome(view)
                        return true
                    }

                    if (target.startsWith(PROFILE_URL)) {
                        entryResolved = true
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

        // Use the site's existing Supabase session without changing the website.
        // A saved session is routed to Home; a signed-out visitor gets the local welcome.
        webView.loadUrl(SITE_BASE_URL)
    }

    private fun showBundledWelcome(view: WebView?) {
        if (entryResolved) return
        entryResolved = true
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
