package com.floustream.webshelltest

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.ValueCallback
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.nio.charset.StandardCharsets

class MainActivity : ComponentActivity() {
    private lateinit var inAppUpdater: InAppUpdater
    private var updateCheckStarted = false
    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingWebAudioPermissionRequest: PermissionRequest? = null
    private lateinit var singleVisualPickerLauncher: ActivityResultLauncher<PickVisualMediaRequest>
    private lateinit var multipleVisualPickerLauncher: ActivityResultLauncher<PickVisualMediaRequest>
    private var fullscreenCustomView: View? = null
    @Volatile private var authenticatedUserId: String? = null
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
        const val AUDIO_PERMISSION_REQUEST_CODE = 4103
        const val MAX_AUTH_CHECK_ATTEMPTS = 50
        const val AUTH_CHECK_INTERVAL_MS = 400L
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        singleVisualPickerLauncher = registerForActivityResult(
            ActivityResultContracts.PickVisualMedia()
        ) { uri ->
            completeFileChooser(uri?.let { arrayOf(it) })
        }
        multipleVisualPickerLauncher = registerForActivityResult(
            ActivityResultContracts.PickMultipleVisualMedia(20)
        ) { uris ->
            completeFileChooser(uris.takeIf { it.isNotEmpty() }?.toTypedArray())
        }

        webView = WebView(this).apply {
            visibility = View.INVISIBLE
            setBackgroundColor(android.graphics.Color.rgb(12, 14, 30))
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.loadsImagesAutomatically = true
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.setSupportMultipleWindows(false)
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView?,
                    request: WebResourceRequest?
                ): WebResourceResponse? {
                    if (request != null && isGuestPhotoAlbumRequest(request.url.encodedPath.orEmpty())) {
                        val body = """{"error":"Photo albums are unavailable in guest mode"}"""
                            .toByteArray(StandardCharsets.UTF_8)
                        return WebResourceResponse(
                            "application/json",
                            "UTF-8",
                            403,
                            "Forbidden",
                            mapOf("Cache-Control" to "no-store"),
                            ByteArrayInputStream(body)
                        )
                    }
                    return super.shouldInterceptRequest(view, request)
                }

                override fun onPageStarted(
                    view: WebView?,
                    url: String?,
                    favicon: android.graphics.Bitmap?
                ) {
                    super.onPageStarted(view, url, favicon)
                    val target = url.orEmpty()

                    if (target.startsWith(AUTH_URL)) {
                        authenticatedUserId = null
                        authFlowActive = true
                    }
                    if (target.startsWith(PROFILE_URL) && authFlowActive) {
                        entryResolved = false
                        startupAuthCheckPending = true
                        view?.visibility = View.INVISIBLE
                        return
                    }

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
                    applyAndroidMessageMediaStyle(view)
                    syncAndroidAlbumAccess(view)
                    applyAndroidPersistentMediaCache(view)

                    val currentUrl = url.orEmpty()
                    if (currentUrl.contains("/messages.html")) applyAndroidVoiceMessageRecorder(view)
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
                override fun onPermissionRequest(request: PermissionRequest?) {
                    if (request == null) return
                    val origin = request.origin
                    val audioOnly = request.resources.isNotEmpty() &&
                        request.resources.all { it == PermissionRequest.RESOURCE_AUDIO_CAPTURE }
                    val trustedOrigin = origin.scheme == "https" &&
                        origin.host == "sergeybikov1991-create.github.io"
                    if (!trustedOrigin || !audioOnly) {
                        request.deny()
                        return
                    }
                    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                    } else {
                        pendingWebAudioPermissionRequest?.deny()
                        pendingWebAudioPermissionRequest = request
                        requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), AUDIO_PERMISSION_REQUEST_CODE)
                    }
                }

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

                    val acceptedTypes = fileChooserParams?.acceptTypes.orEmpty()
                        .flatMap { it.split(',') }
                        .map { it.trim().lowercase() }
                        .filter { it.isNotBlank() }
                    val visualOnly = acceptedTypes.isNotEmpty() &&
                        acceptedTypes.all { it.startsWith("image/") || it.startsWith("video/") }

                    if (visualOnly && fileChooserParams?.isCaptureEnabled != true) {
                        val visualType = when {
                            acceptedTypes.all { it.startsWith("image/") } ->
                                ActivityResultContracts.PickVisualMedia.ImageOnly
                            acceptedTypes.all { it.startsWith("video/") } ->
                                ActivityResultContracts.PickVisualMedia.VideoOnly
                            else -> ActivityResultContracts.PickVisualMedia.ImageAndVideo
                        }
                        val request = PickVisualMediaRequest(visualType)
                        return try {
                            if (fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE) {
                                multipleVisualPickerLauncher.launch(request)
                            } else {
                                singleVisualPickerLauncher.launch(request)
                            }
                            true
                        } catch (_: Exception) {
                            completeFileChooser(null)
                            false
                        }
                    }

                    // Keep the existing generic file manager / capture chooser for
                    // documents and explicit capture requests.
                    val chooserIntent = try {
                        fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = "*/*"
                        }
                    } catch (_: Exception) {
                        Intent(Intent.ACTION_GET_CONTENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = "*/*"
                        }
                    }

                    return try {
                        startActivityForResult(
                            Intent.createChooser(chooserIntent, "Выберите файл"),
                            FILE_CHOOSER_REQUEST_CODE
                        )
                        true
                    } catch (_: Exception) {
                        completeFileChooser(null)
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

    /**
     * Deny photo-album data and object requests before WebView receives them
     * whenever the active page has no authenticated Supabase user session.
     */
    private fun isGuestPhotoAlbumRequest(encodedPath: String): Boolean {
        if (!authenticatedUserId.isNullOrBlank()) return false
        val path = encodedPath.lowercase()
        return path.contains("/rest/v1/photo_album_photos") ||
            path.contains("/rest/v1/private_album_photos") ||
            (path.contains("/storage/v1/object/") &&
                (path.contains("/photo-albums/") || path.contains("/private-albums/")))
    }

    /**
     * Keep the guest restriction native-side and mirror it in the Android UI.
     * The JavaScript listener follows sign-in/sign-out changes without editing
     * the hosted website.
     */
    private fun syncAndroidAlbumAccess(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        val script = """
            (function() {
                try {
                    if (window.__floustreamAndroidAlbumGuardInstalled) return;
                    window.__floustreamAndroidAlbumGuardInstalled = true;
                    const styleId = 'floustream-android-guest-albums';
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = [
                        'html.floustream-android-guest [data-action="photos"],',
                        'html.floustream-android-guest #album-private-open,',
                        'html.floustream-android-guest #album-add-open,',
                        'html.floustream-android-guest #album-backdrop,',
                        'html.floustream-android-guest #private-album-backdrop,',
                        'html.floustream-android-guest #album-viewer,',
                        'html.floustream-android-guest #private-album-viewer,',
                        'html.floustream-android-guest #album-share-backdrop {',
                        '  display: none !important;',
                        '}'
                    ].join('\\n');
                    (document.head || document.documentElement).appendChild(style);

                    const applyGuestState = (session) => {
                        const isGuest = !session || !session.user || !session.user.id;
                        const userId = isGuest ? 'guest' : String(session.user.id);
                        window.__floustreamAndroidUserId = userId;
                        document.documentElement.classList.toggle('floustream-android-guest', isGuest);
                        if (window.__floustreamAndroidMediaUserChanged) {
                            window.__floustreamAndroidMediaUserChanged();
                        }
                    };
                    const connect = (attempt) => {
                        const authClient =
                            (typeof client !== 'undefined' && client) ? client :
                            ((typeof supabaseClient !== 'undefined' && supabaseClient) ? supabaseClient : null);
                        if (!authClient || !authClient.auth) {
                            if (attempt < 24) setTimeout(() => connect(attempt + 1), 250);
                            else applyGuestState(null);
                            return;
                        }
                        authClient.auth.getSession().then((result) => {
                            applyGuestState(result && result.data ? result.data.session : null);
                        }).catch(() => applyGuestState(null));
                        authClient.auth.onAuthStateChange((_event, session) => applyGuestState(session));
                    };
                    connect(0);
                } catch (_) {
                    document.documentElement.classList.add('floustream-android-guest');
                }
            })();
        """.trimIndent()
        view.evaluateJavascript(script, null)
    }

    /**
     * Persistent WebView media cache shared by all FLOUSTREAM sections.
     * Only image resources and video poster images are stored; video streams are
     * deliberately left to the normal network path.
     */
    private fun applyAndroidPersistentMediaCache(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        val script = """
            (function() {
                try {
                    if (window.__floustreamAndroidMediaCacheInstalled) return;
                    window.__floustreamAndroidMediaCacheInstalled = true;
                    const cacheName = 'floustream-android-media-v1';
                    const active = new WeakMap();

                    if (navigator.storage && navigator.storage.persist) {
                        navigator.storage.persist().catch(function() {});
                    }

                    function currentUserKey() {
                        return window.__floustreamAndroidUserId || 'guest';
                    }

                    function makeCacheKey(source, userId) {
                        try {
                            const url = new URL(source, location.href);
                            if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
                            const params = new URLSearchParams(url.search);
                            params.delete('token');
                            params.delete('signature');
                            params.delete('expires');
                            const normalized = url.origin + url.pathname +
                                (params.toString() ? '?' + params.toString() : '');
                            const keyUrl = location.origin + '/__floustream_android_media_cache__/' +
                                encodeURIComponent(userId) + '/' + encodeURIComponent(normalized);
                            return new Request(keyUrl, { method: 'GET' });
                        } catch (_) {
                            return null;
                        }
                    }

                    async function refreshCachedImage(source, key) {
                        try {
                            const response = await fetch(source, { cache: 'no-store', credentials: 'omit' });
                            if (!response.ok) return;
                            const contentType = (response.headers.get('content-type') || '').toLowerCase();
                            if (contentType && !contentType.startsWith('image/')) return;
                            const cache = await caches.open(cacheName);
                            await cache.put(key, response.clone());
                        } catch (_) {}
                    }

                    async function loadCachedImage(element, attribute, source, key, userId) {
                        const cache = await caches.open(cacheName);
                        const cached = await cache.match(key);
                        if (cached) {
                            const blob = await cached.blob();
                            if (!blob || !blob.size) return;
                            const objectUrl = URL.createObjectURL(blob);
                            if (element.isConnected && element.getAttribute(attribute) === source &&
                                currentUserKey() === userId) {
                                element.dataset.floustreamOriginalMedia = source;
                                element.dataset.floustreamCachedUser = userId;
                                element.setAttribute(attribute, objectUrl);
                            } else {
                                URL.revokeObjectURL(objectUrl);
                            }
                            refreshCachedImage(source, key);
                            return;
                        }

                        const saveAfterLoad = function() {
                            if (element.isConnected && element.getAttribute(attribute) === source) {
                                refreshCachedImage(source, key);
                            }
                        };
                        if (attribute === 'src' && element.complete && element.naturalWidth > 0) {
                            saveAfterLoad();
                        } else if (attribute === 'poster') {
                            refreshCachedImage(source, key);
                        } else {
                            element.addEventListener('load', saveAfterLoad, { once: true });
                            element.addEventListener('error', async function() {
                                try {
                                    const fallback = await cache.match(key);
                                    if (!fallback || !element.isConnected ||
                                        element.getAttribute(attribute) !== source ||
                                        currentUserKey() !== userId) return;
                                    const blob = await fallback.blob();
                                    const objectUrl = URL.createObjectURL(blob);
                                    element.dataset.floustreamOriginalMedia = source;
                                    element.dataset.floustreamCachedUser = userId;
                                    element.setAttribute(attribute, objectUrl);
                                } catch (_) {}
                            }, { once: true });
                        }
                    }

                    function processMedia(element, attribute) {
                        if (!element || !element.getAttribute) return;
                        const source = element.dataset.floustreamOriginalMedia ||
                            element.getAttribute(attribute) || '';
                        if (!source || source.startsWith('blob:') || source.startsWith('data:')) return;
                        const userId = currentUserKey();
                        const previousUser = element.dataset.floustreamCachedUser;
                        if (previousUser && previousUser !== userId) {
                            const original = element.dataset.floustreamOriginalMedia;
                            delete element.dataset.floustreamCachedUser;
                            delete element.dataset.floustreamOriginalMedia;
                            if (original) {
                                element.setAttribute(attribute, original);
                                return;
                            }
                        }
                        const stamp = userId + '|' + source + '|' + attribute;
                        if (active.get(element) === stamp) return;
                        active.set(element, stamp);
                        const key = makeCacheKey(source, userId);
                        if (!key || !('caches' in window)) return;
                        loadCachedImage(element, attribute, source, key, userId).catch(function() {});
                    }

                    function scan(node) {
                        if (!node || node.nodeType !== 1) return;
                        if (node.tagName === 'IMG') processMedia(node, 'src');
                        if (node.tagName === 'VIDEO' && node.getAttribute('poster')) {
                            processMedia(node, 'poster');
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll('img[src]').forEach(function(img) {
                                processMedia(img, 'src');
                            });
                            node.querySelectorAll('video[poster]').forEach(function(video) {
                                processMedia(video, 'poster');
                            });
                        }
                    }

                    scan(document.documentElement);
                    const observer = new MutationObserver(function(records) {
                        records.forEach(function(record) {
                            if (record.type === 'attributes') {
                                const element = record.target;
                                if (element.tagName === 'IMG' && record.attributeName === 'src') {
                                    processMedia(element, 'src');
                                } else if (element.tagName === 'VIDEO' && record.attributeName === 'poster') {
                                    processMedia(element, 'poster');
                                }
                            } else {
                                record.addedNodes.forEach(scan);
                            }
                        });
                    });
                    observer.observe(document.documentElement, {
                        subtree: true,
                        childList: true,
                        attributes: true,
                        attributeFilter: ['src', 'poster']
                    });
                    window.__floustreamAndroidMediaUserChanged = function() {
                        document.querySelectorAll('img[src]').forEach(function(img) {
                            processMedia(img, 'src');
                        });
                        document.querySelectorAll('video[poster]').forEach(function(video) {
                            processMedia(video, 'poster');
                        });
                    };
                    window.__floustreamAndroidMediaUserChanged();
                } catch (_) {}
            })();
        """.trimIndent()
        view.evaluateJavascript(script, null)
    }

    /**
     * Android-only presentation override for message attachments.
     * The hosted website and its desktop/mobile browser styling remain untouched.
     */
    private fun applyAndroidMessageMediaStyle(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        val script = """
            (function() {
                try {
                    const styleId = 'floustream-android-message-media-no-frames';
                    if (document.getElementById(styleId)) return;
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = [
                        '.bubble:has(> .message-media-image),',
                        '.bubble:has(> .message-media-video),',
                        '.bubble:has(> .message-media-audio) {',
                        '  border: 0 !important;',
                        '  outline: 0 !important;',
                        '  box-shadow: none !important;',
                        '}',
                        '.message-media-image, .message-media-video, .message-media-audio {',
                        '  border: 0 !important;',
                        '  outline: 0 !important;',
                        '  box-shadow: none !important;',
                        '}'
                    ].join('\\n');
                    (document.head || document.documentElement).appendChild(style);
                } catch (_) {}
            })();
        """.trimIndent()
        view.evaluateJavascript(script, null)
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
                            authenticatedUserId = pushSession.optString("userId")
                                .takeIf { it.isNotBlank() }
                            PushTokenRegistrar.register(
                                this@MainActivity,
                                pushSession.optString("userId"),
                                pushSession.optString("accessToken")
                            )
                        } catch (_: Exception) {
                            // Push registration is retried at the next authenticated startup.
                        }
                        if (!isFinishing && !isDestroyed) showAuthenticatedScreen(view)
                    }
                }
                "unauthenticated" -> {
                    authenticatedUserId = null
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
                    authenticatedUserId = null
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

    /**
     * Android-only voice control for messages.html. The existing attachment
     * input uploads the recorded audio through the normal message-media flow.
     */
    private fun applyAndroidVoiceMessageRecorder(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        val script = """
            (function() {
                try {
                    const form = document.getElementById('composer');
                    const input = document.getElementById('attachment-input');
                    const text = document.getElementById('message-input');
                    if (!form || !input || !text || window.__floustreamAndroidVoiceRecorderInstalled) return;
                    window.__floustreamAndroidVoiceRecorderInstalled = true;
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.id = 'floustream-voice-record';
                    button.className = 'attach';
                    button.textContent = '🎙';
                    button.setAttribute('aria-label', 'Записать голосовое сообщение');
                    button.title = 'Записать голосовое сообщение';
                    button.style.flex = '0 0 44px';
                    button.style.touchAction = 'manipulation';
                    form.insertBefore(button, text);
                    let recorder = null, stream = null, chunks = [], startedAt = 0, recording = false;

                    function notice(message, error) {
                        if (typeof showNotice === 'function') showNotice(message, !!error);
                        else if (document.getElementById('notice')) document.getElementById('notice').textContent = message;
                    }
                    function resetButton() {
                        recording = false;
                        button.disabled = false;
                        button.textContent = '🎙';
                        button.classList.remove('recording');
                        button.setAttribute('aria-label', 'Записать голосовое сообщение');
                        button.title = 'Записать голосовое сообщение';
                    }
                    async function startRecording() {
                        if (document.getElementById('attach')?.disabled) return;
                        button.disabled = true;
                        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
                            button.disabled = false;
                            notice('Запись голоса недоступна в этой версии WebView.', true);
                            return;
                        }
                        try {
                            stream = await navigator.mediaDevices.getUserMedia({
                                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                            });
                            const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
                            const mime = types.find(type => MediaRecorder.isTypeSupported(type)) || '';
                            recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
                            chunks = [];
                            recorder.addEventListener('dataavailable', event => {
                                if (event.data && event.data.size) chunks.push(event.data);
                            });
                            recorder.addEventListener('stop', () => {
                                const elapsed = Date.now() - startedAt;
                                const rawType = recorder.mimeType || (chunks[0] && chunks[0].type) || 'audio/webm';
                                const type = rawType.split(';')[0].toLowerCase() || 'audio/webm';
                                const blob = new Blob(chunks, { type });
                                if (stream) stream.getTracks().forEach(track => track.stop());
                                stream = null;
                                resetButton();
                                if (elapsed < 1000 || blob.size < 1500) {
                                    notice('Запись слишком короткая. Запиши сообщение не менее одной секунды.', true);
                                    return;
                                }
                                if (blob.size > 50 * 1024 * 1024) {
                                    notice('Голосовая запись больше допустимых 50 МБ.', true);
                                    return;
                                }
                                const ext = type.indexOf('mp4') >= 0 ? 'm4a' : (type.indexOf('ogg') >= 0 ? 'ogg' : 'webm');
                                const file = new File([blob], 'voice_' + Date.now() + '.' + ext, { type: type });
                                try {
                                    const transfer = new DataTransfer();
                                    transfer.items.add(file);
                                    input.files = transfer.files;
                                    input.dispatchEvent(new Event('change', { bubbles: true }));
                                } catch (_) {
                                    notice('Не удалось передать запись в отправку. Попробуй ещё раз.', true);
                                }
                            });
                            recorder.start(250);
                            startedAt = Date.now();
                            recording = true;
                            button.disabled = false;
                            button.textContent = '■';
                            button.classList.add('recording');
                            button.setAttribute('aria-label', 'Остановить и отправить голосовое сообщение');
                            button.title = 'Остановить и отправить';
                            notice('Идёт запись… Нажми ■, чтобы отправить голосовое сообщение.');
                        } catch (error) {
                            if (stream) stream.getTracks().forEach(track => track.stop());
                            stream = null;
                            resetButton();
                            notice('Не удалось начать запись: ' + (error && error.message ? error.message : 'проверь разрешение микрофона.'), true);
                        }
                    }
                    button.addEventListener('click', () => {
                        if (!recording) startRecording();
                        else if (recorder && recorder.state === 'recording') {
                            button.disabled = true;
                            button.textContent = '…';
                            try { recorder.stop(); }
                            catch (_) {
                                if (stream) stream.getTracks().forEach(track => track.stop());
                                stream = null;
                                resetButton();
                                notice('Не удалось завершить запись. Попробуй ещё раз.', true);
                            }
                        }
                    });
                    window.addEventListener('pagehide', () => {
                        if (recorder && recorder.state === 'recording') { try { recorder.stop(); } catch (_) {} }
                        if (stream) stream.getTracks().forEach(track => track.stop());
                        stream = null;
                    }, { once: true });
                } catch (_) {}
            })();
        """.trimIndent()
        view.evaluateJavascript(script, null)
    }

    private fun completeFileChooser(selectedFiles: Array<Uri>?) {
        val callback = fileChooserCallback ?: return
        fileChooserCallback = null
        callback.onReceiveValue(selectedFiles)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            val selectedFiles = if (resultCode == RESULT_OK) {
                WebChromeClient.FileChooserParams.parseResult(resultCode, data)
                    ?: data?.data?.let { arrayOf(it) }
            } else {
                null
            }
            completeFileChooser(selectedFiles)
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

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == AUDIO_PERMISSION_REQUEST_CODE) {
            val pending = pendingWebAudioPermissionRequest
            pendingWebAudioPermissionRequest = null
            if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) {
                pending?.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
            } else pending?.deny()
        }
    }

    override fun onDestroy() {
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        pendingWebAudioPermissionRequest?.deny()
        pendingWebAudioPermissionRequest = null
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
