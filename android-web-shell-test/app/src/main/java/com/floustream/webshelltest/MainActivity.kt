package com.floustream.webshelltest

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.view.View
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private var entryResolved = false
    private var sessionCheckInProgress = false

    private companion object {
        const val SITE_BASE_URL = "https://sergeybikov1991-create.github.io/Dolby404/"
        const val WELCOME_ASSET_URL = "file:///android_asset/index.html"
        const val AUTH_URL = SITE_BASE_URL + "portal.html"
        const val PROFILE_URL = SITE_BASE_URL + "profile.html"
        const val HOME_URL = SITE_BASE_URL + "home.html"

        // Public publishable key used by the existing FLOUSTREAM website.
        // This is intentionally read-only: no website files or Supabase settings are changed.
        const val SUPABASE_URL = "https://qhpobdktlbhdqsnajypr.supabase.co"
        const val SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tzG1qVsbja8WYE_LBVN87Q_v0CahKN5"
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

                    // A fresh launch must verify the persisted Supabase session before
                    // deciding whether to show the bundled welcome screen.
                    if (!entryResolved && target.startsWith(AUTH_URL)) {
                        checkSavedSupabaseSession(view)
                        return
                    }

                    // The existing site sends signed-in users through profile.html.
                    // The app routes them directly to Home without changing the site.
                    if (target.startsWith(PROFILE_URL)) {
                        entryResolved = true
                        sessionCheckInProgress = false
                        view?.stopLoading()
                        view?.visibility = View.VISIBLE
                        view?.loadUrl(HOME_URL)
                        return
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

                    if (!entryResolved && target.startsWith(AUTH_URL)) {
                        // Stop the portal navigation and check the same-origin persisted
                        // session first. This also covers redirects initiated by page JS.
                        checkSavedSupabaseSession(view)
                        return true
                    }

                    if (target.startsWith(PROFILE_URL)) {
                        entryResolved = true
                        sessionCheckInProgress = false
                        view?.visibility = View.VISIBLE
                        view?.loadUrl(HOME_URL)
                        return true
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

        // Persistent WebView DOM storage keeps the site's Supabase auth token
        // between app launches. The entry redirect is verified by getSession().
        webView.loadUrl(SITE_BASE_URL)
    }

    /**
     * Check the persisted Supabase session from the existing website origin.
     *
     * The SDK uses its normal localStorage key (sb-<project-ref>-auth-token),
     * the same storage used by the website. No website source is edited and
     * no credentials or session tokens are copied into native preferences.
     */
    private fun checkSavedSupabaseSession(view: WebView?) {
        if (entryResolved || sessionCheckInProgress) return
        if (view == null) {
            showBundledWelcome(null)
            return
        }

        sessionCheckInProgress = true
        view.stopLoading()

        val checkScript = """
            (function () {
              const finish = (value) => value ? "FLOUSTREAM_AUTHENTICATED" : "FLOUSTREAM_SIGNED_OUT";
              const check = async () => {
                try {
                  if (!window.supabase || !window.supabase.createClient) {
                    await new Promise((resolve, reject) => {
                      const script = document.createElement("script");
                      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
                      script.onload = resolve;
                      script.onerror = reject;
                      document.head.appendChild(script);
                    });
                  }
                  const client = window.supabase.createClient(
                    "$SUPABASE_URL",
                    "$SUPABASE_PUBLISHABLE_KEY"
                  );
                  const result = await client.auth.getSession();
                  if (result.error) return finish(false);
                  return finish(!!(result.data && result.data.session));
                } catch (error) {
                  return finish(false);
                }
              };
              return check();
            })();
        """.trimIndent()

        view.evaluateJavascript(checkScript, ValueCallback { result ->
            if (entryResolved) return@ValueCallback
            sessionCheckInProgress = false

            val authenticated = result?.contains("FLOUSTREAM_AUTHENTICATED") == true
            if (authenticated) {
                entryResolved = true
                view.visibility = View.VISIBLE
                view.loadUrl(HOME_URL)
            } else {
                showBundledWelcome(view)
            }
        })
    }

    private fun showBundledWelcome(view: WebView?) {
        if (entryResolved) return
        entryResolved = true
        sessionCheckInProgress = false
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
