package com.floustream.webshelltest

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.ValueCallback
import org.json.JSONObject

class MainActivity : Activity() {
    private lateinit var inAppUpdater: InAppUpdater
    private var updateCheckStarted = false
    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var fullscreenCustomView: View? = null
    private var fullscreenCustomViewCallback: WebChromeClient.CustomViewCallback? = null
    private var fullscreenDecorView: ViewGroup? = null
    private var previousSystemUiVisibility: Int = 0
    private var previousFullscreenWindowFlag: Boolean = false
    private val mainHandler = Handler(Looper.getMainLooper())
    private var entryResolved = false
    private var authFlowActive = false
    private var startupAuthCheckPending = false
    private var authCheckAttempts = 0
    private var authCheckRunnable: Runnable? = null

    private companion object {
        const val SITE_BASE_URL = "https://sergeybikov1991-create.github.io/Dolby404/"
        const val WELCOME_ASSET_URL = "file:///android_asset/index.html"
        const val AUTH_URL = SITE_BASE_URL + "portal.html"
        const val PROFILE_URL = SITE_BASE_URL + "profile.html"
        const val HOME_URL = PROFILE_URL
        const val FILE_CHOOSER_REQUEST_CODE = 4102
        const val MAX_AUTH_CHECK_ATTEMPTS = 50
        const val AUTH_CHECK_INTERVAL_MS = 400L
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

                    // Let the site's own Supabase client initialize. Do not route
                    // to Home until Auth has confirmed the saved session remotely.
                    if (target.startsWith(PROFILE_URL) && !entryResolved) {
                        entryResolved = false
                        startupAuthCheckPending = true
                        view?.visibility = View.INVISIBLE
                        return
                    }

                    // On a cold start, portal.html is the no-session fallback from
                    // the site's entry page. Check it before showing the welcome UI.
                    if (!entryResolved && target.startsWith(AUTH_URL)) {
                        startupAuthCheckPending = true
                        view?.visibility = View.INVISIBLE
                        return
                    }

                    if (target.startsWith(AUTH_URL)) {
                        authFlowActive = true
                    }

                    if (target == WELCOME_ASSET_URL || target.startsWith(HOME_URL)) {
                        entryResolved = true
                        startupAuthCheckPending = false
                        view?.visibility = View.VISIBLE
                    }
                }

                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val target = request?.url?.toString().orEmpty()

                    if (target.startsWith(PROFILE_URL) && !entryResolved) {
                        entryResolved = false
                        startupAuthCheckPending = true
                        view?.visibility = View.INVISIBLE
                        return false
                    }

                    if (!entryResolved && target.startsWith(AUTH_URL)) {
                        startupAuthCheckPending = true
                        view?.visibility = View.INVISIBLE
                        return false
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
                        showOfflineScreen(view)
                    }
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    this@MainActivity.title = "FLOUSTREAM"

                    val currentUrl = url.orEmpty()
                    if (startupAuthCheckPending &&
                        (currentUrl.startsWith(AUTH_URL) ||
                         currentUrl.startsWith(PROFILE_URL))
                    ) {
                        val clientExpression =
                            if (currentUrl.startsWith(PROFILE_URL)) "client" else "supabaseClient"
                        checkSupabaseSession(view, clientExpression)
                        return
                    }

                    if (url == WELCOME_ASSET_URL || url?.startsWith(HOME_URL) == true) {
                        view?.visibility = View.VISIBLE
                        checkForUpdatesOnce()
                    }
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onShowCustomView(
                    view: View?,
                    callback: WebChromeClient.CustomViewCallback?
                ) {
                    if (view == null || callback == null) return
                    if (fullscreenCustomView != null) {
                        exitFullscreenCustomView(notifyWebView = true)
                    }

                    val decor = window.decorView as? ViewGroup
                    if (decor == null) {
                        callback.onCustomViewHidden()
                        return
                    }

                    fullscreenCustomView = view
                    fullscreenCustomViewCallback = callback
                    fullscreenDecorView = decor
                    previousSystemUiVisibility = decor.systemUiVisibility
                    previousFullscreenWindowFlag =
                        (window.attributes.flags and WindowManager.LayoutParams.FLAG_FULLSCREEN) != 0

                    (view.parent as? ViewGroup)?.removeView(view)
                    decor.addView(
                        view,
                        FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            Gravity.CENTER
                        )
                    )
                    view.isFocusable = true
                    view.isFocusableInTouchMode = true
                    view.requestFocus()

                    WindowInsetsControllerCompat(window, decor).apply {
                        systemBarsBehavior =
                            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                        hide(WindowInsetsCompat.Type.systemBars())
                    }
                }

                override fun onHideCustomView() {
                    exitFullscreenCustomView(notifyWebView = false)
                }

                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    // A WebView may issue a second chooser request before the first
                    // one returns. Complete the previous callback to avoid hanging it.
                    this@MainActivity.fileChooserCallback?.onReceiveValue(null)
                    this@MainActivity.fileChooserCallback = filePathCallback

                    val chooserIntent = try {
                        fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = "image/*"
                        }
                    } catch (_: Exception) {
                        Intent(Intent.ACTION_GET_CONTENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = "image/*"
                        }
                    }

                    return try {
                        startActivityForResult(
                            Intent.createChooser(chooserIntent, "Выберите фото профиля"),
                            FILE_CHOOSER_REQUEST_CODE
                        )
                        true
                    } catch (_: Exception) {
                        this@MainActivity.fileChooserCallback?.onReceiveValue(null)
                        this@MainActivity.fileChooserCallback = null
                        false
                    }
                }
            }
        }

        inAppUpdater = InAppUpdater(this)
        setContentView(webView)
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        // Keep the same HTTPS origin and Supabase localStorage used by the website.
        webView.loadUrl(SITE_BASE_URL)
    }

    private fun checkForUpdatesOnce() {
        if (!updateCheckStarted && ::inAppUpdater.isInitialized) {
            updateCheckStarted = true
            inAppUpdater.checkForUpdate()
        }
    }

    private fun checkSupabaseSession(view: WebView?, clientExpression: String) {
        if (view == null || isFinishing || isDestroyed) return

        val script = """
            (function() {
                try {
                    if (typeof $clientExpression === 'undefined' || !$clientExpression) {
                        return { state: 'pending' };
                    }

                    if (!window.__floustreamAuthCheckRunning &&
                        !window.__floustreamAuthCheckState) {
                        window.__floustreamAuthCheckRunning = true;
                        window.__floustreamAuthCheckState = 'pending';

                        (async function() {
                            try {
                                const authClient = $clientExpression;
                                const stored = await authClient.auth.getSession();
                                if (stored.error) {
                                    const storedStatus = Number(stored.error.status || 0);
                                    if (storedStatus === 400 || storedStatus === 401 || storedStatus === 403) {
                                        return 'unauthenticated';
                                    }
                                    return 'offline';
                                }
                                if (!stored.data || !stored.data.session) {
                                    return 'unauthenticated';
                                }

                                // getUser() contacts Supabase Auth; getSession() alone
                                // only reads the local token cache.
                                const confirmed = await authClient.auth.getUser();
                                if (!confirmed.error && confirmed.data && confirmed.data.user) {
                                    window.__floustreamPushSession = {
                                        userId: confirmed.data.user.id,
                                        accessToken: stored.data.session.access_token
                                    };
                                    return 'verified';
                                }

                                const error = confirmed.error || {};
                                const status = Number(error.status || 0);
                                const code = String(error.code || '').toLowerCase();
                                if (status === 400 || status === 401 || status === 403 ||
                                    code.includes('invalid') || code.includes('expired') ||
                                    code.includes('not_found')) {
                                    return 'unauthenticated';
                                }
                                return 'offline';
                            } catch (error) {
                                return 'offline';
                            }
                        })().then(function(state) {
                            window.__floustreamAuthCheckState = state;
                            window.__floustreamAuthCheckRunning = false;
                        }).catch(function() {
                            window.__floustreamAuthCheckState = 'offline';
                            window.__floustreamAuthCheckRunning = false;
                        });
                    }

                    return { state: window.__floustreamAuthCheckState || 'pending' };
                } catch (error) {
                    return { state: 'offline' };
                }
            })();
        """.trimIndent()

        view.evaluateJavascript(script) { result ->
            if (isFinishing || isDestroyed || !startupAuthCheckPending) return@evaluateJavascript

            val state = try {
                JSONObject(result ?: "{}").optString("state", "pending")
            } catch (_: Exception) {
                "pending"
            }

            when (state) {
                "verified" -> {
                    cancelAuthCheck()
                    startupAuthCheckPending = false
                    entryResolved = true
                    authFlowActive = false
                    view?.evaluateJavascript(
                        "(function(){ return window.__floustreamPushSession || {}; })()"
                    ) { pushResult ->
                        try {
                            val pushSession = JSONObject(pushResult ?: "{}")
                            PushTokenRegistrar.register(
                                this@MainActivity,
                                pushSession.optString("userId"),
                                pushSession.optString("accessToken")
                            )
                        } catch (_: Exception) {
                            // Push registration is retried at the next authenticated startup.
                        }
                    }
                    showAuthenticatedScreen(view)
                }
                "unauthenticated" -> {
                    cancelAuthCheck()
                    startupAuthCheckPending = false
                    val currentUrl = view?.url.orEmpty()

                    if (currentUrl.startsWith(AUTH_URL)) {
                        // An unauthenticated visitor must stay on the login page.
                        // Replacing portal.html with the bundled welcome page here
                        // prevented users from ever completing their first login.
                        entryResolved = true
                        authFlowActive = true
                        view?.visibility = View.VISIBLE
                    } else {
                        // A stale/expired session on a protected profile page
                        // should return to the sign-in screen, not the welcome loop.
                        entryResolved = false
                        authFlowActive = false
                        view?.stopLoading()
                        view?.loadUrl(AUTH_URL)
                    }
                }
                "offline" -> {
                    cancelAuthCheck()
                    showOfflineScreen(view)
                }
                else -> {
                    authCheckAttempts++
                    if (authCheckAttempts >= MAX_AUTH_CHECK_ATTEMPTS) {
                        cancelAuthCheck()
                        showOfflineScreen(view)
                    } else {
                        authCheckRunnable = Runnable {
                            checkSupabaseSession(view, clientExpression)
                        }
                        mainHandler.postDelayed(authCheckRunnable!!, AUTH_CHECK_INTERVAL_MS)
                    }
                }
            }
        }
    }

    private fun cancelAuthCheck() {
        authCheckRunnable?.let(mainHandler::removeCallbacks)
        authCheckRunnable = null
        authCheckAttempts = 0
    }

    // Used only for the bundled onboarding fallback; a signed-out user stays on portal.html.
    private fun showBundledWelcome(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        cancelAuthCheck()
        entryResolved = true
        startupAuthCheckPending = false
        authFlowActive = false
        view.stopLoading()
        view.loadUrl(WELCOME_ASSET_URL)
    }

    private fun showAuthenticatedScreen(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        cancelAuthCheck()
        entryResolved = true
        startupAuthCheckPending = false
        authFlowActive = false
        view.stopLoading()
        view.visibility = View.VISIBLE

        val html = """
            <!doctype html>
            <html lang="ru">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
              <meta name="color-scheme" content="dark">
              <title>FLOUSTREAM</title>
              <style>
                *{box-sizing:border-box}
                html,body{margin:0;min-height:100%;width:100%;overflow:hidden}
                body{min-height:100vh;min-height:100dvh;display:grid;place-items:center;
                  padding:28px;color:#f8f6ff;font:16px Arial,sans-serif;text-align:center;
                  background:radial-gradient(ellipse at 18% 18%,#263f91,transparent 48%),
                  radial-gradient(ellipse at 85% 82%,#54257e,transparent 46%),#090910;
                  touch-action:pan-y}
                main{width:min(100%,440px);padding:28px 18px}
                .logo{font-size:clamp(30px,9vw,46px);font-weight:800;letter-spacing:5px;
                  text-shadow:0 0 12px #6e8bff,0 0 28px #875cff}
                .message{margin:30px 0 12px;font-size:clamp(23px,6vw,30px);font-weight:600}
                .hint{color:#c9c4e1;line-height:1.6;margin:0 auto;max-width:310px}
                button{margin-top:32px;min-width:190px;padding:16px 28px;border:1px solid #9a7be6;
                  border-radius:16px;background:linear-gradient(105deg,#405fd3,#7544b9);
                  box-shadow:0 0 24px #6546bd55;color:white;font-size:17px;font-weight:700}
                .swipe{margin-top:28px;color:#aaa5c9;font-size:13px;letter-spacing:.5px}
                .arrow{display:inline-block;margin-left:8px;font-size:20px;vertical-align:-2px}
              </style>
            </head>
            <body>
              <main id="welcome">
                <div class="logo">FLOUSTREAM</div>
                <div class="message">Вы уже зашли</div>
                <p class="hint">Твоя авторизация подтверждена. Добро пожаловать!</p>
                <button type="button" onclick="continueToHome()">Продолжить</button>
                <div class="swipe">Или проведи справа налево <span class="arrow">←</span></div>
              </main>
              <script>
                function continueToHome(){ window.location.href = '$HOME_URL'; }
                let touchStartX = null;
                document.addEventListener('touchstart', function(event){
                  if(event.changedTouches.length) touchStartX = event.changedTouches[0].clientX;
                }, {passive:true});
                document.addEventListener('touchend', function(event){
                  if(touchStartX === null || !event.changedTouches.length) return;
                  const delta = event.changedTouches[0].clientX - touchStartX;
                  if(delta < -65) continueToHome();
                  touchStartX = null;
                }, {passive:true});
              </script>
            </body>
            </html>
        """.trimIndent()
        view.loadDataWithBaseURL(SITE_BASE_URL, html, "text/html", "UTF-8", null)
        checkForUpdatesOnce()
    }

    private fun showOfflineScreen(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        cancelAuthCheck()
        startupAuthCheckPending = false
        authFlowActive = false
        view.stopLoading()
        view.visibility = View.VISIBLE

        val html = """
            <!doctype html>
            <html lang="ru">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta name="color-scheme" content="dark">
              <title>FLOUSTREAM — Нет подключения</title>
              <style>
                *{box-sizing:border-box}
                body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;
                  color:#f7f4ff;font:16px Arial,sans-serif;text-align:center;
                  background:radial-gradient(ellipse at 20% 15%,#243b83,transparent 48%),
                  radial-gradient(ellipse at 85% 85%,#54247d,transparent 45%),#090910}
                main{width:min(100%,420px)}
                h1{font-size:28px;letter-spacing:3px;text-shadow:0 0 20px #875cff}
                p{color:#c7c2df;line-height:1.6}
                button{margin-top:18px;padding:15px 25px;border:1px solid #9271d9;
                  border-radius:16px;background:linear-gradient(100deg,#405bd0,#7543b7);
                  color:white;font-size:16px;font-weight:700}
              </style>
            </head>
            <body>
              <main>
                <h1>FLOUSTREAM</h1>
                <p>Не удалось проверить подключение к серверу.<br>
                Твоя сохранённая авторизация не сброшена.</p>
                <p>Проверь интернет и повтори проверку.</p>
                <button onclick="location.href='$SITE_BASE_URL'">Повторить</button>
              </main>
            </body>
            </html>
        """.trimIndent()
        view.loadDataWithBaseURL(SITE_BASE_URL, html, "text/html", "UTF-8", null)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            val callback = fileChooserCallback
            fileChooserCallback = null
            if (callback != null) {
                val selectedFiles = if (resultCode == RESULT_OK) {
                    WebChromeClient.FileChooserParams.parseResult(resultCode, data)
                        ?: data?.data?.let { arrayOf(it) }
                } else {
                    null
                }
                callback.onReceiveValue(selectedFiles)
            }
            return
        }
        super.onActivityResult(requestCode, resultCode, data)
    }

    private fun exitFullscreenCustomView(notifyWebView: Boolean) {
        val customView = fullscreenCustomView ?: return
        val callback = fullscreenCustomViewCallback
        val decor = fullscreenDecorView

        // Clear state before notifying WebView: the callback can synchronously
        // result in onHideCustomView(), which must then be a harmless no-op.
        fullscreenCustomView = null
        fullscreenCustomViewCallback = null
        fullscreenDecorView = null

        (customView.parent as? ViewGroup)?.removeView(customView)

        if (decor != null) {
            decor.systemUiVisibility = previousSystemUiVisibility
        }
        if (previousFullscreenWindowFlag) {
            window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        }

        if (notifyWebView) {
            callback?.onCustomViewHidden()
        }
    }

    @Deprecated("Deprecated in Android API; retained for compatibility with the test harness")
    override fun onBackPressed() {
        if (fullscreenCustomView != null) {
            exitFullscreenCustomView(notifyWebView = true)
            return
        }
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        if (::inAppUpdater.isInitialized) inAppUpdater.onResume()
    }

    override fun onDestroy() {
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        cancelAuthCheck()
        if (::inAppUpdater.isInitialized) inAppUpdater.close()
        if (fullscreenCustomView != null) {
            exitFullscreenCustomView(notifyWebView = false)
        }
        if (::webView.isInitialized) {
            webView.stopLoading()
            webView.destroy()
        }
        super.onDestroy()
    }
}
