package com.floustream.webshelltest

import android.Manifest
import android.app.AlertDialog
import android.annotation.SuppressLint
import android.content.Intent
import android.content.ClipData
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.core.content.FileProvider
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
import com.floustream.webshelltest.audio.VoiceAudioSessionCoordinator
import com.floustream.webshelltest.audio.VoiceMessageAudioBridge
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FilterInputStream
import java.nio.charset.StandardCharsets

class MainActivity : ComponentActivity() {
    private lateinit var inAppUpdater: InAppUpdater
    private var updateCheckStarted = false
    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingCaptureUri: Uri? = null
    private var pendingCaptureFile: File? = null
    private var pendingFileChooserDialog: AlertDialog? = null
    private var pendingWebMediaPermissionRequest: PermissionRequest? = null
    private val voiceAudioCoordinator = VoiceAudioSessionCoordinator()
    private val voiceMessageAudioBridge = VoiceMessageAudioBridge(this, voiceAudioCoordinator)
    private lateinit var singleVisualPickerLauncher: ActivityResultLauncher<PickVisualMediaRequest>
    private lateinit var multipleVisualPickerLauncher: ActivityResultLauncher<PickVisualMediaRequest>
    private var fullscreenCustomView: View? = null
    @Volatile private var authenticatedUserId: String? = null
    @Volatile private var pendingNotificationPeerId: String? = null
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
        const val WEB_MEDIA_PERMISSION_REQUEST_CODE = 4103
        const val MAX_AUTH_CHECK_ATTEMPTS = 50
        const val AUTH_CHECK_INTERVAL_MS = 400L
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingNotificationPeerId = NotificationPeerPolicy.normalize(
            intent?.getStringExtra(FLOUSTREAMMessagingService.EXTRA_NOTIFICATION_PEER_ID)
        )

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

        // Keep the 2.3 SPA route hook only for chat media/voice UI.
        // Authentication itself follows the verified APK 1.3 page-load flow.
        voiceMessageAudioBridge.routeChangeListener = { route ->
            if (!isFinishing && !isDestroyed && ::webView.isInitialized &&
                SiteRoutePolicy.isMessagesRouteName(route)
            ) {
                applyAndroidPhotoViewerFix(webView)
                applyAndroidVoiceMessageRecorder(webView)
                mainHandler.postDelayed({
                    if (!isFinishing && !isDestroyed && ::webView.isInitialized) {
                        applyAndroidPhotoViewerFix(webView)
                        applyAndroidVoiceMessageRecorder(webView)
                    }
                }, 350L)
                mainHandler.postDelayed({
                    if (!isFinishing && !isDestroyed && ::webView.isInitialized) {
                        applyAndroidVoiceMessageRecorder(webView)
                    }
                }, 900L)
            }
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
                    interceptNativeVoiceRecording(request)?.let { return it }
                    if (request != null && isGuestPhotoAlbumRequest(
                            request.url.encodedPath.orEmpty(),
                            request.requestHeaders
                        )
                    ) {
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
                    android.util.Log.d(
                        "FLOUSTREAM-WebView-DIAG",
                        "Main-frame navigation: host=${runCatching { android.net.Uri.parse(url).host }.getOrNull()}, path=${runCatching { android.net.Uri.parse(url).encodedPath }.getOrNull()}"
                    )
                    pendingWebMediaPermissionRequest?.deny()
                    pendingWebMediaPermissionRequest = null
                    val target = url.orEmpty()
                    val trustedSiteOrigin = SiteRoutePolicy.isTrustedSiteUrl(target)
                    if (trustedSiteOrigin) {
                        view?.addJavascriptInterface(voiceMessageAudioBridge, "FloustreamVoiceAudio")
                    } else {
                        view?.removeJavascriptInterface("FloustreamVoiceAudio")
                    }

                    if (target.startsWith(AUTH_URL)) {
                        authenticatedUserId = null
                        voiceMessageAudioBridge.activeUserId = null
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
                        android.util.Log.w(
                            "FLOUSTREAM-WebView-DIAG",
                            "Main-frame load failed: host=${request.url.host}, path=${request.url.encodedPath}, code=${error?.errorCode}, description=${error?.description}"
                        )
                        showOfflineScreen(view)
                    }
                }

                override fun onReceivedHttpError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    errorResponse: android.webkit.WebResourceResponse?
                ) {
                    super.onReceivedHttpError(view, request, errorResponse)
                    if (request?.isForMainFrame == true) {
                        android.util.Log.w(
                            "FLOUSTREAM-WebView-DIAG",
                            "Main-frame HTTP response: host=${request.url.host}, path=${request.url.encodedPath}, status=${errorResponse?.statusCode}"
                        )
                    }
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    android.util.Log.d(
                        "FLOUSTREAM-WebView-DIAG",
                        "Main-frame finished: host=${runCatching { android.net.Uri.parse(url).host }.getOrNull()}, path=${runCatching { android.net.Uri.parse(url).encodedPath }.getOrNull()}, title=${view?.title}"
                    )
                    this@MainActivity.title = "FLOUSTREAM"
                    applyAndroidMessageMediaStyle(view)
                    syncAndroidAlbumAccess(view)
                    applyAndroidPersistentMediaCache(view)
                    applyAndroidOfflineDataCache(view)
                    installAndroidRouteLifecycleHooks(view)

                    val currentUrl = url.orEmpty()
                    val currentRoute = SiteRoutePolicy.routeName(currentUrl)
                    if (SiteRoutePolicy.isMessagesRouteName(currentRoute)) {
                        applyAndroidPhotoViewerFix(view)
                        applyAndroidVoiceMessageRecorder(view)
                        mainHandler.postDelayed({
                            if (!isFinishing && !isDestroyed) {
                                applyAndroidPhotoViewerFix(view)
                                applyAndroidVoiceMessageRecorder(view)
                            }
                        }, 350L)
                    }
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
                    val requestedResources = request.resources.toList()
                    if (!WebMediaPermissionPolicy.isTrustedOrigin(origin.scheme, origin.host, origin.port) ||
                        !SiteRoutePolicy.isTrustedSiteUrl(webView.url) ||
                        !WebMediaPermissionPolicy.isSupportedRequest(requestedResources)
                    ) {
                        request.deny()
                        return
                    }

                    val requiredPermissions =
                        WebMediaPermissionPolicy.requiredRuntimePermissions(requestedResources)
                    val grantedPermissions = currentGrantedWebMediaPermissions()
                    val missingPermissions = requiredPermissions.filterNot { it in grantedPermissions }
                    if (missingPermissions.isEmpty()) {
                        val grantable = WebMediaPermissionPolicy.grantableResources(
                            requestedResources,
                            grantedPermissions
                        )
                        if (grantable.isEmpty()) request.deny()
                        else request.grant(grantable.toTypedArray())
                        return
                    }

                    pendingWebMediaPermissionRequest?.deny()
                    pendingWebMediaPermissionRequest = request
                    requestPermissions(missingPermissions.toTypedArray(), WEB_MEDIA_PERMISSION_REQUEST_CODE)
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
                    // one returns. Close the old dialog and complete its callback.
                    pendingFileChooserDialog?.dismiss()
                    pendingFileChooserDialog = null
                    this@MainActivity.fileChooserCallback?.onReceiveValue(null)
                    this@MainActivity.fileChooserCallback = filePathCallback

                    val acceptedTypes = fileChooserParams?.acceptTypes.orEmpty()
                        .flatMap { it.split(',') }
                        .map { it.trim().lowercase() }
                        .filter { it.isNotBlank() }
                    val hasVisualTypes = acceptedTypes.any {
                        it.startsWith("image/") || it.startsWith("video/")
                    }

                    if (hasVisualTypes) {
                        val visualType = when {
                            acceptedTypes.all { it.startsWith("image/") } ->
                                ActivityResultContracts.PickVisualMedia.ImageOnly
                            acceptedTypes.all { it.startsWith("video/") } ->
                                ActivityResultContracts.PickVisualMedia.VideoOnly
                            else -> ActivityResultContracts.PickVisualMedia.ImageAndVideo
                        }
                        val request = PickVisualMediaRequest(visualType)
                        val multiple = fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE
                        val hasImages = acceptedTypes.any { it.startsWith("image/") }
                        val hasVideos = acceptedTypes.any { it.startsWith("video/") }
                        val choices = mutableListOf("Фото и видео из галереи")
                        val actions = mutableListOf<() -> Unit>({ launchVisualPicker(request, multiple) })

                        if (hasImages && Intent(MediaStore.ACTION_IMAGE_CAPTURE).resolveActivity(packageManager) != null) {
                            choices += "Снять фото"
                            actions += { launchCaptureIntent(MediaStore.ACTION_IMAGE_CAPTURE, ".jpg") }
                        }
                        if (hasVideos && Intent(MediaStore.ACTION_VIDEO_CAPTURE).resolveActivity(packageManager) != null) {
                            choices += "Снять видео"
                            actions += { launchCaptureIntent(MediaStore.ACTION_VIDEO_CAPTURE, ".mp4") }
                        }
                        choices += "Файлы и документы"
                        actions += { launchGenericFileChooser(fileChooserParams) }

                        pendingFileChooserDialog = AlertDialog.Builder(this@MainActivity)
                            .setTitle("Выбрать вложение")
                            .setItems(choices.toTypedArray()) { _, choice ->
                                pendingFileChooserDialog = null
                                actions.getOrNull(choice)?.invoke()
                            }
                            .setOnCancelListener {
                                pendingFileChooserDialog = null
                                completeFileChooser(null)
                            }
                            .create()
                        pendingFileChooserDialog?.show()
                        return true
                    }

                    return launchGenericFileChooser(fileChooserParams)
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
    private fun isGuestPhotoAlbumRequest(
        encodedPath: String,
        requestHeaders: Map<String, String>
    ): Boolean = GuestPhotoRequestPolicy.shouldBlock(
        voiceMessageAudioBridge.activeUserId,
        encodedPath,
        requestHeaders
    )

    /**
     * Keep the guest restriction native-side and mirror it in the Android UI.
     * The JavaScript listener follows sign-in/sign-out changes without editing
     * the hosted website.
     */
    private fun syncAndroidAlbumAccess(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        val bridgeToken = voiceMessageAudioBridge.javascriptToken
        val script = """
            (function() {
                try {
                    if (window.__floustreamAndroidAlbumGuardInstalled) return;
                    window.__floustreamAndroidAlbumGuardInstalled = true;
                    const styleId = 'floustream-android-guest-albums';
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = [
                        'html.floustream-android-guest img,',
                        'html.floustream-android-guest .post-photo-viewer,',
                        'html.floustream-android-guest .photo-viewer,',
                        'html.floustream-android-guest [data-action="photos"],',
                        'html.floustream-android-guest #photo-modal,',
                        'html.floustream-android-guest #photo-viewer,',
                        'html.floustream-android-guest #post-photo-viewer,',
                        'html.floustream-android-guest #photo-lightbox,',
                        'html.floustream-android-guest #author-photos-banner,',
                        'html.floustream-android-guest #public-albums,',
                        'html.floustream-android-guest #public-photos-section,',
                        'html.floustream-android-guest #public-photo-grid,',
                        'html.floustream-android-guest #album-private-open,',
                        'html.floustream-android-guest #album-add-open,',
                        'html.floustream-android-guest #album-backdrop,',
                        'html.floustream-android-guest #private-album-backdrop,',
                        'html.floustream-android-guest #album-grid,',
                        'html.floustream-android-guest #private-album-grid,',
                        'html.floustream-android-guest #album-viewer,',
                        'html.floustream-android-guest #private-album-viewer,',
                        'html.floustream-android-guest #album-share-backdrop {',
                        '  display: none !important;',
                        '}'
                    ].join('\\n');
                    (document.head || document.documentElement).appendChild(style);

                    const applyGuestState = (session) => {
                        const isGuest = !session || !session.user || !session.user.id ||
                            session.user.is_anonymous === true;
                        const userId = isGuest ? 'guest' : String(session.user.id);
                        window.__floustreamAndroidUserId = userId;
                        try {
                            if (window.FloustreamVoiceAudio) {
                                window.FloustreamVoiceAudio.updateSessionUserId(
                                    '$bridgeToken',
                                    isGuest ? '' : userId
                                );
                            }
                        } catch (_) {}
                        document.documentElement.classList.toggle('floustream-android-guest', isGuest);
                        if (window.__floustreamAndroidMediaUserChanged) {
                            window.__floustreamAndroidMediaUserChanged();
                        }
                        if (window.__floustreamAndroidDataUserChanged) {
                            window.__floustreamAndroidDataUserChanged();
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
                    const cachePrefix = 'floustream-android-media-v1-';
                    const cacheNameFor = userId => cachePrefix + encodeURIComponent(userId);
                    const active = new WeakMap();
                    let lastCacheUser = currentUserKey();
                    const MAX_MEDIA_ENTRIES = 1500;
                    const MAX_MEDIA_BYTES = 200 * 1024 * 1024;
                    const MAX_MEDIA_ITEM_BYTES = 25 * 1024 * 1024;
                    const MEDIA_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

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

                    async function pruneMediaCache(cache) {
                        const keys = await cache.keys();
                        const entries = [];
                        let totalBytes = 0;
                        const now = Date.now();
                        for (const key of keys) {
                            const response = await cache.match(key);
                            if (!response) continue;
                            const size = Number(response.headers.get('content-length') || 0) ||
                                (await response.clone().blob()).size;
                            const savedAt = Number(response.headers.get('x-floustream-cached-at') || 0);
                            if (savedAt && now - savedAt > MEDIA_MAX_AGE_MS) {
                                await cache.delete(key);
                                continue;
                            }
                            entries.push({ key, size, savedAt });
                            totalBytes += size;
                        }
                        entries.sort((a, b) => a.savedAt - b.savedAt);
                        while (entries.length > MAX_MEDIA_ENTRIES || totalBytes > MAX_MEDIA_BYTES) {
                            const oldest = entries.shift();
                            if (!oldest) break;
                            await cache.delete(oldest.key);
                            totalBytes -= oldest.size;
                        }
                    }

                    async function putMediaCache(cache, key, response) {
                        const blob = await response.clone().blob();
                        if (!blob.size || blob.size > MAX_MEDIA_ITEM_BYTES) return false;
                        const headers = new Headers(response.headers);
                        headers.set('Content-Length', String(blob.size));
                        headers.set('X-FLOUSTREAM-Cached-At', String(Date.now()));
                        await cache.put(key, new Response(blob, { status: 200, headers: headers }));
                        await pruneMediaCache(cache);
                        return true;
                    }

                    async function touchMediaCache(cache, key, response) {
                        try {
                            const blob = await response.clone().blob();
                            const headers = new Headers(response.headers);
                            headers.set('Content-Length', String(blob.size));
                            headers.set('X-FLOUSTREAM-Cached-At', String(Date.now()));
                            await cache.put(key, new Response(blob, { status: 200, headers: headers }));
                        } catch (_) {}
                    }

                    async function refreshCachedImage(source, key, element, attribute, userId) {
                        try {
                            const response = await fetch(source, { cache: 'no-store', credentials: 'omit' });
                            if (!response.ok) return;
                            const contentType = (response.headers.get('content-type') || '').toLowerCase();
                            if (!contentType.startsWith('image/')) return;
                            const cache = await caches.open(cacheNameFor(userId));
                            if (!await putMediaCache(cache, key, response)) return;

                            // Show the cached image immediately, then replace it in-place
                            // when the server returns a newer version at the same URL.
                            if (element && element.isConnected &&
                                currentUserKey() === userId &&
                                element.dataset.floustreamOriginalMedia === source) {
                                const blob = await response.blob();
                                if (!blob || !blob.size) return;
                                const objectUrl = URL.createObjectURL(blob);
                                if (element.isConnected && currentUserKey() === userId &&
                                    element.dataset.floustreamOriginalMedia === source) {
                                    const previousUrl = element.getAttribute(attribute);
                                    element.setAttribute(attribute, objectUrl);
                                    if (previousUrl && previousUrl.startsWith('blob:')) {
                                        URL.revokeObjectURL(previousUrl);
                                    }
                                } else {
                                    URL.revokeObjectURL(objectUrl);
                                }
                            }
                        } catch (_) {}
                    }

                    async function loadCachedImage(element, attribute, source, key, userId) {
                        const cache = await caches.open(cacheNameFor(userId));
                        const cached = await cache.match(key);
                        if (cached) {
                            const blob = await cached.blob();
                            if (!blob || !blob.size) return;
                            touchMediaCache(cache, key, cached);
                            const objectUrl = URL.createObjectURL(blob);
                            if (element.isConnected && element.getAttribute(attribute) === source &&
                                currentUserKey() === userId) {
                                element.dataset.floustreamOriginalMedia = source;
                                element.dataset.floustreamCachedUser = userId;
                                element.setAttribute(attribute, objectUrl);
                            } else {
                                URL.revokeObjectURL(objectUrl);
                            }
                            refreshCachedImage(source, key, element, attribute, userId);
                            return;
                        }

                        element.dataset.floustreamOriginalMedia = source;
                        element.dataset.floustreamCachedUser = userId;
                        const saveAfterLoad = function() {
                            if (element.isConnected && element.getAttribute(attribute) === source) {
                                refreshCachedImage(source, key, element, attribute, userId);
                            }
                        };
                        if (attribute === 'src' && element.complete && element.naturalWidth > 0) {
                            saveAfterLoad();
                        } else if (attribute === 'poster') {
                            refreshCachedImage(source, key, element, attribute, userId);
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
                        const rawSource = element.getAttribute(attribute) || '';
                        if (!rawSource || rawSource.startsWith('data:')) return;
                        const source = rawSource.startsWith('blob:')
                            ? (element.dataset.floustreamOriginalMedia || rawSource)
                            : rawSource;
                        if (!source || source.startsWith('blob:') || source.startsWith('data:')) return;
                        if (rawSource === source && element.dataset.floustreamOriginalMedia !== source) {
                            // A page replaced the image URL; stop treating it as
                            // the previous cached resource.
                            element.dataset.floustreamOriginalMedia = source;
                            delete element.dataset.floustreamCachedUser;
                        }
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
                        const nextUser = currentUserKey();
                        if (nextUser !== lastCacheUser) {
                            lastCacheUser = nextUser;
                            // A different account must not inherit the previous
                            // account's local media cache on this device.
                            caches.keys().then(function(names) {
                                names.filter(function(name) {
                                    return name.startsWith(cachePrefix) &&
                                        name !== cacheNameFor(nextUser);
                                }).forEach(function(name) {
                                    caches.delete(name).catch(function() {});
                                });
                            }).catch(function() {});
                        }
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
     * Account-scoped offline fallback for Supabase REST reads.
     * Online requests always reach the server first; successful JSON responses
     * refresh IndexedDB. If the network fails or the server returns 5xx, the
     * last saved response for the same account/query is returned.
     */
    private fun applyAndroidOfflineDataCache(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        val script = """
            (function() {
                try {
                    if (window.__floustreamAndroidDataCacheInstalled) return;
                    window.__floustreamAndroidDataCacheInstalled = true;
                    const databaseName = 'floustream-android-data-v1';
                    const supabaseHost = 'qhpobdktlbhdqsnajypr.supabase.co';
                    let databasePromise = null;

                    function activeUser() {
                        return window.__floustreamAndroidUserId || 'guest';
                    }

                    function openDatabase() {
                        if (databasePromise) return databasePromise;
                        databasePromise = new Promise((resolve, reject) => {
                            const request = indexedDB.open(databaseName, 1);
                            request.onupgradeneeded = () => {
                                const db = request.result;
                                if (!db.objectStoreNames.contains('responses')) {
                                    db.createObjectStore('responses', { keyPath: 'key' });
                                }
                            };
                            request.onsuccess = () => resolve(request.result);
                            request.onerror = () => reject(request.error || new Error('IndexedDB unavailable'));
                        });
                        return databasePromise;
                    }

                    function makeKey(url, userId, accept) {
                        return userId + '|' + (accept || 'application/json') + '|' + url;
                    }

                    async function readCached(key) {
                        const db = await openDatabase();
                        return new Promise((resolve, reject) => {
                            const tx = db.transaction('responses', 'readonly');
                            const request = tx.objectStore('responses').get(key);
                            request.onsuccess = () => resolve(request.result || null);
                            request.onerror = () => reject(request.error);
                        });
                    }

                    async function writeCached(record) {
                        const db = await openDatabase();
                        return new Promise((resolve, reject) => {
                            const tx = db.transaction('responses', 'readwrite');
                            const store = tx.objectStore('responses');
                            const request = store.getAll();
                            request.onsuccess = () => {
                                try {
                                    const now = Date.now();
                                    const entries = request.result.filter(item =>
                                        item.key !== record.key &&
                                        Number(item.savedAt || 0) > now - 7 * 24 * 60 * 60 * 1000
                                    );
                                    record.byteSize = String(record.body || '').length * 2;
                                    entries.push(record);
                                    entries.sort((a, b) => Number(a.savedAt || 0) - Number(b.savedAt || 0));
                                    let totalBytes = entries.reduce((sum, item) =>
                                        sum + Number(item.byteSize || (String(item.body || '').length * 2)), 0);
                                    while (entries.length > 500 || totalBytes > 25 * 1024 * 1024) {
                                        const oldest = entries.shift();
                                        if (!oldest) break;
                                        totalBytes -= Number(oldest.byteSize || (String(oldest.body || '').length * 2));
                                        if (oldest.key !== record.key) store.delete(oldest.key);
                                    }
                                    entries.forEach(item => store.put(item));
                                    request.result.forEach(item => {
                                        if (!entries.some(kept => kept.key === item.key)) store.delete(item.key);
                                    });
                                } catch (_) {
                                    tx.abort();
                                }
                            };
                            tx.oncomplete = () => resolve(true);
                            tx.onerror = () => reject(tx.error);
                            tx.onabort = () => reject(tx.error || new Error('IndexedDB write aborted'));
                        });
                    }

                    async function purgeOtherAccounts() {
                        const db = await openDatabase();
                        const userPrefix = activeUser() + '|';
                        return new Promise((resolve, reject) => {
                            const tx = db.transaction('responses', 'readwrite');
                            const store = tx.objectStore('responses');
                            const request = store.getAllKeys();
                            request.onsuccess = () => {
                                request.result.forEach(key => {
                                    if (typeof key === 'string' && !key.startsWith(userPrefix)) {
                                        store.delete(key);
                                    }
                                });
                            };
                            tx.oncomplete = () => resolve(true);
                            tx.onerror = () => reject(tx.error);
                        });
                    }

                    window.__floustreamAndroidDataUserChanged = function() {
                        purgeOtherAccounts().catch(function() {});
                    };
                    window.__floustreamAndroidDataUserChanged();

                    const originalFetch = window.fetch.bind(window);
                    window.fetch = async function(input, init) {
                        let request;
                        try { request = new Request(input, init); }
                        catch (_) { return originalFetch(input, init); }

                        const url = new URL(request.url);
                        if (request.method !== 'GET' ||
                            url.hostname !== supabaseHost ||
                            !url.pathname.startsWith('/rest/v1/') ||
                            request.headers.has('Range') ||
                            !('indexedDB' in window)) {
                            return originalFetch(input, init);
                        }

                        const userId = activeUser();
                        const accept = request.headers.get('Accept') || 'application/json';
                        const key = makeKey(url.href, userId, accept);
                        try {
                            const response = await originalFetch(request.clone());
                            if (response.ok &&
                                (response.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
                                try {
                                    const body = await response.clone().text();
                                    if (body.length <= 5 * 1024 * 1024 && activeUser() === userId) {
                                        const headers = {};
                                        response.headers.forEach((value, name) => {
                                            if (!['set-cookie', 'set-cookie2'].includes(name.toLowerCase())) {
                                                headers[name] = value;
                                            }
                                        });
                                        await writeCached({
                                            key: key,
                                            body: body,
                                            headers: headers,
                                            savedAt: Date.now()
                                        });
                                    }
                                } catch (_) {
                                    // Cache failures must never break a successful server response.
                                }
                            }
                            if (response.status >= 500) {
                                const cached = await readCached(key).catch(() => null);
                                if (cached) {
                                    const headers = new Headers(cached.headers || {});
                                    headers.set('X-FLOUSTREAM-Offline-Cache', '1');
                                    return new Response(cached.body, { status: 200, headers: headers });
                                }
                            }
                            return response;
                        } catch (networkError) {
                            const cached = await readCached(key).catch(() => null);
                            if (cached && activeUser() === userId) {
                                const headers = new Headers(cached.headers || {});
                                headers.set('X-FLOUSTREAM-Offline-Cache', '1');
                                headers.set('X-FLOUSTREAM-Cache-Saved-At', String(cached.savedAt || 0));
                                return new Response(cached.body, { status: 200, headers: headers });
                            }
                            throw networkError;
                        }
                    };
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
                    const styleId = 'floustream-android-message-media-no-frames-v2';
                    if (!document.getElementById(styleId)) {
                        const style = document.createElement('style');
                        style.id = styleId;
                        style.textContent = [
                            '.bubble.floustream-media-bubble {',
                            '  border: 0 !important;',
                            '  outline: 0 !important;',
                            '  box-shadow: none !important;',
                            '  background: transparent !important;',
                            '  padding: 0 !important;',
                            '}',
                            '.bubble.floustream-media-bubble .message-media-image,',
                            '.bubble.floustream-media-bubble .message-media-video,',
                            '.bubble.floustream-media-bubble .message-media-audio,',
                            '.bubble.floustream-media-bubble .message-file,',
                            '.message-media-image, .message-media-video {',
                            '  border: 0 !important;',
                            '  outline: 0 !important;',
                            '  box-shadow: none !important;',
                            '}',
                            '.bubble.floustream-media-bubble .message-file {',
                            '  background: transparent !important;',
                            '  padding: 0 !important;',
                            '}',
                            '.floustream-audio-player { display:flex; align-items:center; gap:8px; width:min(270px,100%); min-height:34px; padding:2px 0; background:transparent; border:0; box-shadow:none; }',
                            '.floustream-audio-toggle { width:30px; height:30px; flex:0 0 30px; display:grid; place-items:center; padding:0; border:0; border-radius:50%; background:linear-gradient(135deg,#8d55e8,#56308c); color:#fff; font-size:13px; line-height:1; cursor:pointer; }',
                            '.floustream-audio-progress { min-width:0; flex:1; width:100%; height:3px; accent-color:#b78aff; cursor:pointer; }',
                            '.floustream-audio-time { min-width:34px; color:#c8bdd8; font:10px Arial,sans-serif; text-align:right; white-space:nowrap; }',
                            '.message-media-video {',
                            '  display: block !important;',
                            '  background: #090811 !important;',
                            '  object-fit: contain;',
                            '}'
                        ].join('\\n');
                        (document.head || document.documentElement).appendChild(style);
                    }

                    function decorateMedia(root) {
                        const selector = '.message-media-image, .message-media-video, .message-media-audio, .message-file';
                        const nodes = [];
                        if (root && root.matches && root.matches(selector)) nodes.push(root);
                        if (root && root.querySelectorAll) nodes.push(...root.querySelectorAll(selector));
                        nodes.forEach(function(media) {
                            const bubble = media.closest('.bubble');
                            if (bubble) bubble.classList.add('floustream-media-bubble');
                            media.style.setProperty('border', '0', 'important');
                            media.style.setProperty('outline', '0', 'important');
                            media.style.setProperty('box-shadow', 'none', 'important');
                            if (media.tagName === 'AUDIO') {
                                if (media.dataset.floustreamCompactPlayer === '1') return;
                                media.dataset.floustreamCompactPlayer = '1';
                                media.controls = false;
                                media.removeAttribute('controls');
                                media.preload = 'metadata';
                                media.style.setProperty('display', 'none', 'important');

                                const player = document.createElement('div');
                                player.className = 'floustream-audio-player';
                                const toggle = document.createElement('button');
                                toggle.type = 'button';
                                toggle.className = 'floustream-audio-toggle';
                                toggle.textContent = '▶';
                                toggle.setAttribute('aria-label', 'Воспроизвести голосовое сообщение');
                                const progress = document.createElement('input');
                                progress.type = 'range';
                                progress.className = 'floustream-audio-progress';
                                progress.min = '0';
                                progress.max = '1000';
                                progress.value = '0';
                                progress.setAttribute('aria-label', 'Позиция воспроизведения');
                                const time = document.createElement('span');
                                time.className = 'floustream-audio-time';
                                time.textContent = '0:00';
                                player.append(toggle, progress, time);
                                media.insertAdjacentElement('afterend', player);

                                function clock(value) {
                                    const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
                                    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
                                }
                                function refresh() {
                                    const duration = Number.isFinite(media.duration) ? media.duration : 0;
                                    const current = Number.isFinite(media.currentTime) ? media.currentTime : 0;
                                    progress.value = duration > 0 ? String(Math.round(current / duration * 1000)) : '0';
                                    time.textContent = clock(current);
                                }
                                function stopAndReset() {
                                    media.pause();
                                    try { media.currentTime = 0; } catch (_) {}
                                    toggle.textContent = '▶';
                                    toggle.setAttribute('aria-label', 'Воспроизвести голосовое сообщение');
                                    refresh();
                                }
                                toggle.addEventListener('click', function(event) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    if (!media.paused && !media.ended) {
                                        stopAndReset();
                                        if (window.__floustreamActiveMessageAudio === media) window.__floustreamActiveMessageAudio = null;
                                        return;
                                    }
                                    const active = window.__floustreamActiveMessageAudio;
                                    if (active && active !== media) {
                                        active.pause();
                                        try { active.currentTime = 0; } catch (_) {}
                                        active.dispatchEvent(new Event('floustream-stop'));
                                    }
                                    window.__floustreamActiveMessageAudio = media;
                                    media.play().then(function() {
                                        toggle.textContent = '■';
                                        toggle.setAttribute('aria-label', 'Остановить голосовое сообщение');
                                    }).catch(function() {
                                        stopAndReset();
                                        window.__floustreamActiveMessageAudio = null;
                                    });
                                });
                                progress.addEventListener('input', function() {
                                    if (Number.isFinite(media.duration) && media.duration > 0) {
                                        media.currentTime = Number(progress.value) / 1000 * media.duration;
                                        refresh();
                                    }
                                });
                                media.addEventListener('timeupdate', refresh);
                                media.addEventListener('loadedmetadata', refresh);
                                media.addEventListener('play', function() {
                                    toggle.textContent = '■';
                                    toggle.setAttribute('aria-label', 'Остановить голосовое сообщение');
                                });
                                media.addEventListener('pause', function() {
                                    toggle.textContent = '▶';
                                    toggle.setAttribute('aria-label', 'Воспроизвести голосовое сообщение');
                                });
                                media.addEventListener('ended', function() {
                                    stopAndReset();
                                    if (window.__floustreamActiveMessageAudio === media) window.__floustreamActiveMessageAudio = null;
                                });
                                media.addEventListener('floustream-stop', stopAndReset);
                                media.addEventListener('error', stopAndReset);
                                refresh();
                                return;
                            }
                            if (media.tagName !== 'VIDEO') return;

                            media.preload = 'auto';
                            media.playsInline = true;
                            media.setAttribute('playsinline', '');
                            media.setAttribute('webkit-playsinline', '');
                            if (!media.dataset.floustreamCorsSource && media.getAttribute('src')) {
                                const source = media.getAttribute('src');
                                media.crossOrigin = 'anonymous';
                                media.dataset.floustreamCorsSource = '1';
                                media.src = source;
                            }
                            if (!media.poster) {
                                const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#25143b"/><stop offset="1" stop-color="#090811"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="320" cy="180" r="48" fill="#ffffff18" stroke="#c49aff" stroke-opacity=".7" stroke-width="2"/><path d="M305 151 L350 180 L305 209 Z" fill="#ead7ff"/></svg>';
                                media.poster = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
                            }
                            if (media.poster && media.dataset.floustreamPosterReady === '1') return;
                            if (media.dataset.floustreamPosterPending === '1') return;
                            media.dataset.floustreamPosterPending = '1';

                            function captureFrame() {
                                try {
                                    if (!media.isConnected || media.videoWidth < 2 || media.videoHeight < 2) return;
                                    const canvas = document.createElement('canvas');
                                    const scale = Math.min(1, 640 / media.videoWidth);
                                    canvas.width = Math.max(2, Math.round(media.videoWidth * scale));
                                    canvas.height = Math.max(2, Math.round(media.videoHeight * scale));
                                    const context = canvas.getContext('2d');
                                    if (!context) return;
                                    context.drawImage(media, 0, 0, canvas.width, canvas.height);
                                    const poster = canvas.toDataURL('image/jpeg', 0.78);
                                    if (poster && poster.startsWith('data:image/')) {
                                        media.poster = poster;
                                        media.dataset.floustreamPosterReady = '1';
                                    }
                                    media.pause();
                                    if (media.currentTime > 0.05) media.currentTime = 0;
                                } catch (_) {
                                    // A server without CORS-enabled video cannot be canvas-captured.
                                } finally {
                                    media.dataset.floustreamPosterPending = '0';
                                }
                            }

                            media.addEventListener('loadeddata', captureFrame, { once: true });
                            media.addEventListener('error', function() {
                                media.dataset.floustreamPosterPending = '0';
                            }, { once: true });
                            if (media.readyState >= 2) {
                                captureFrame();
                            } else {
                                try { media.load(); } catch (_) {}
                            }
                        });
                    }

                    decorateMedia(document);
                    if (!window.__floustreamMediaDecoratorObserver) {
                        window.__floustreamMediaDecoratorObserver = new MutationObserver(function(records) {
                            records.forEach(function(record) {
                                record.addedNodes.forEach(decorateMedia);
                                if (record.type === 'attributes' && record.target) decorateMedia(record.target);
                            });
                        });
                        window.__floustreamMediaDecoratorObserver.observe(document.documentElement, {
                            childList: true, subtree: true, attributes: true,
                            attributeFilter: ['src', 'poster']
                        });
                    }
                } catch (_) {}
            })();
        """.trimIndent()
        view.evaluateJavascript(script, null)
    }    private fun installAndroidRouteLifecycleHooks(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        val bridgeToken = voiceMessageAudioBridge.javascriptToken
        val script = """
            (function() {
                try {
                    if (window.__floustreamAndroidRouteLifecycleInstalled) return;
                    window.__floustreamAndroidRouteLifecycleInstalled = true;
                    const notifyNative = function(route) {
                        const normalized = String(route || '').trim().split('?')[0];
                        if (!normalized || !window.FloustreamVoiceAudio) return;
                        try {
                            window.FloustreamVoiceAudio.onSiteRouteChanged('$bridgeToken', normalized);
                        } catch (_) {}
                    };
                    window.addEventListener('floustream:route-metric', function(event) {
                        notifyNative(event && event.detail ? event.detail.route : '');
                    });
                    const activeRoute = window.FloustreamRouter && window.FloustreamRouter.activeRoute;
                    if (activeRoute) notifyNative(activeRoute);
                    else {
                        const path = location.pathname.split('/').pop();
                        if (path) notifyNative(path);
                    }
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

    /**
     * APK 1.3 session flow: Supabase JS owns persistence and token refresh in
     * the WebView's localStorage. Android only asks that same client to confirm
     * the saved session with Auth before showing the authenticated screen.
     */
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

                                // Match APK 1.3: let Supabase JS restore/refresh its own
                                // localStorage session, then confirm the user on the server.
                                const confirmed = await authClient.auth.getUser();
                                if (!confirmed.error && confirmed.data && confirmed.data.user) {
                                    window.__floustreamPushSession = {
                                        userId: confirmed.data.user.id,
                                        accessToken: stored.data.session.access_token,
                                        isAnonymous: confirmed.data.user.is_anonymous === true
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
                    view.evaluateJavascript(
                        "(function(){ return window.__floustreamPushSession || {}; })()"
                    ) { pushResult ->
                        try {
                            val pushSession = JSONObject(pushResult ?: "{}")
                            authenticatedUserId = if (pushSession.optBoolean("isAnonymous", false)) {
                                null
                            } else {
                                pushSession.optString("userId").takeIf { it.isNotBlank() }
                            }
                            voiceMessageAudioBridge.activeUserId = authenticatedUserId
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
                    voiceMessageAudioBridge.activeUserId = null
                    cancelAuthCheck()
                    startupAuthCheckPending = false
                    val currentUrl = view.url.orEmpty()

                    if (currentUrl.startsWith(AUTH_URL)) {
                        // An unauthenticated visitor stays on the original sign-in page.
                        entryResolved = true
                        authFlowActive = true
                        view.visibility = View.VISIBLE
                    } else {
                        entryResolved = false
                        authFlowActive = false
                        view.stopLoading()
                        view.loadUrl(AUTH_URL)
                    }
                }
                "offline" -> {
                    authenticatedUserId = null
                    voiceMessageAudioBridge.activeUserId = null
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

        val peerId = pendingNotificationPeerId
        pendingNotificationPeerId = null
        val destination = peerId?.let {
            SITE_BASE_URL + "messages.html?with=" + Uri.encode(it)
        } ?: PROFILE_URL
        val destinationLiteral = JSONObject.quote(destination)

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
                function continueToHome(){ window.location.href = $destinationLiteral; }
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
    private fun applyAndroidPhotoViewerFix(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        val script = """
            (function() {
                try {
                    const host = document.querySelector('#floustream-app-shell #floustream-route-view');
                    const root = host && host.shadowRoot ? host.shadowRoot : document;
                    const styleId = 'floustream-android-photo-viewer-fit-v1';
                    if (!root.getElementById(styleId)) {
                        const style = document.createElement('style');
                        style.id = styleId;
                        style.textContent = [
                            '#photo-viewer {',
                            '  position: fixed !important;',
                            '  inset: 0 !important;',
                            '  width: 100vw !important;',
                            '  height: 100vh !important;',
                            '  height: 100dvh !important;',
                            '  box-sizing: border-box !important;',
                            '  padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)) !important;',
                            '  display: grid !important;',
                            '  place-items: center !important;',
                            '  overflow: hidden !important;',
                            '}',
                            '#photo-viewer[hidden] { display: none !important; }',
                            '#photo-viewer-image {',
                            '  display: block !important;',
                            '  width: auto !important;',
                            '  height: auto !important;',
                            '  max-width: 100% !important;',
                            '  max-height: 100% !important;',
                            '  min-width: 0 !important;',
                            '  min-height: 0 !important;',
                            '  object-fit: contain !important;',
                            '  object-position: center center !important;',
                            '  image-orientation: from-image !important;',
                            '  transform: none !important;',
                            '}'
                        ].join('\\n');
                        (root.head || root).appendChild(style);
                    }
                    const image = root.querySelector('#photo-viewer-image');
                    if (image && image.dataset.floustreamAndroidFit !== '1') {
                        image.dataset.floustreamAndroidFit = '1';
                        image.addEventListener('load', function() {
                            image.style.setProperty('max-width', '100%', 'important');
                            image.style.setProperty('max-height', '100%', 'important');
                            image.style.setProperty('object-fit', 'contain', 'important');
                            image.style.setProperty('object-position', 'center center', 'important');
                        });
                    }
                } catch (_) {}
            })();
        """.trimIndent()
        view.evaluateJavascript(script, null)
    }

    /**
     * Android-only voice control for messages.html. The existing attachment
     * input uploads the recorded audio through the normal message-media flow.
     */

    private fun applyAndroidVoiceMessageRecorder(view: WebView?) {
        if (view == null || isFinishing || isDestroyed) return
        val bridgeToken = voiceMessageAudioBridge.javascriptToken
        val script = """
            (function() {
                try {
                    const routeHost = document.querySelector('#floustream-app-shell #floustream-route-view');
                    const routeRoot = routeHost && routeHost.shadowRoot ? routeHost.shadowRoot : document;
                    const form = routeRoot.querySelector('#composer');
                    const input = routeRoot.querySelector('#attachment-input');
                    const text = routeRoot.querySelector('#message-input');
                    const button = routeRoot.querySelector('#send');
                    if (!form || !input || !text || !button ||
                        form.dataset.floustreamAndroidVoiceRecorderInstalled === '1') return;
                    form.dataset.floustreamAndroidVoiceRecorderInstalled = '1';

                    // Voice recording is a press-and-hold action on the existing send control.
                    // No second microphone button is added to the composer.
                    button.type = 'button';
                    button.title = 'Нажми — отправить текст; удерживай — записать голосовое';
                    button.setAttribute('aria-label', 'Отправить сообщение; удерживай для записи голосового');
                    button.style.touchAction = 'none';

                    const bridgeToken = '$bridgeToken';
                    const recorderHref = location.href;
                    let recording = false;
                    let startPending = false;
                    let startedAt = 0;
                    let leaseHeld = false;
                    let disposed = false;
                    let pointerHeld = false;
                    let keyboardHeld = false;
                    let holdTimer = null;
                    let ignoreClickUntil = 0;
                    let startAttempt = null;

                    function notice(message, error) {
                        if (typeof showNotice === 'function') showNotice(message, !!error);
                        else if (routeRoot.querySelector('#notice')) routeRoot.querySelector('#notice').textContent = message;
                    }
                    function releaseLease() {
                        if (!leaseHeld) return;
                        leaseHeld = false;
                        try { window.FloustreamVoiceAudio.releaseVoiceMessage(bridgeToken); } catch (_) {}
                    }
                    function resetButton() {
                        recording = false;
                        button.disabled = false;
                        button.textContent = '➤';
                        button.classList.remove('recording');
                        button.setAttribute('aria-label', 'Отправить сообщение; удерживай для записи голосового');
                        button.title = 'Нажми — отправить текст; удерживай — записать голосовое';
                    }
                    function delay(ms) {
                        return new Promise(resolve => setTimeout(resolve, ms));
                    }
                    async function waitForPermission() {
                        let state = window.FloustreamVoiceAudio.requestVoicePermission(bridgeToken);
                        if (state === 'granted') return true;
                        if (state !== 'pending') {
                            throw new Error('Android не смог запросить разрешение на микрофон.');
                        }
                        for (let i = 0; i < 120; i++) {
                            await delay(150);
                            state = window.FloustreamVoiceAudio.voicePermissionState(bridgeToken);
                            if (state === 'granted') return true;
                            if (state === 'denied' || state === 'unavailable') {
                                throw new Error('Разрешение на микрофон не выдано. Проверь разрешения приложения.');
                            }
                        }
                        throw new Error('Ожидание разрешения на микрофон завершилось по тайм-ауту.');
                    }

                    async function startRecording() {
                        if (disposed || recording || startPending || !pointerHeld && !keyboardHeld) return;
                        if (routeRoot.querySelector('#attach')?.disabled) return;
                        startPending = true;
                        if (!window.FloustreamVoiceAudio) {
                            startPending = false;
                            startAttempt = null;
                            resetButton();
                            notice('Нативная запись голоса недоступна в этой версии приложения.', true);
                            return;
                        }
                        button.textContent = '…';
                        try {
                            await waitForPermission();
                            if (disposed || !pointerHeld && !keyboardHeld) return;
                            if (!window.FloustreamVoiceAudio.tryAcquireVoiceMessage(bridgeToken)) {
                                throw new Error('Микрофон уже используется другой функцией.');
                            }
                            leaseHeld = true;
                            if (!window.FloustreamVoiceAudio.startNativeRecording(bridgeToken)) {
                                const detail = window.FloustreamVoiceAudio.getLastStartError(bridgeToken);
                                throw new Error(detail || 'Android не смог запустить запись.');
                            }
                            startedAt = Date.now();
                            recording = true;
                            button.disabled = false;
                            button.textContent = '■';
                            button.classList.add('recording');
                            button.setAttribute('aria-label', 'Остановить и отправить голосовое сообщение');
                            button.title = 'Отпусти, чтобы отправить голосовое сообщение';
                            notice('Идёт запись… Отпусти кнопку, чтобы отправить.');
                        } catch (error) {
                            try { window.FloustreamVoiceAudio.cancelNativeRecording(bridgeToken); } catch (_) {}
                            releaseLease();
                            resetButton();
                            notice('Не удалось начать запись: ' +
                                (error && error.message ? error.message : 'попробуй ещё раз.'), true);
                        } finally {
                            startPending = false;
                            startAttempt = null;
                            if (!recording && !disposed) resetButton();
                        }
                    }

                    async function stopRecording() {
                        if (!recording || disposed) return;
                        button.disabled = true;
                        button.textContent = '…';
                        recording = false;
                        const elapsed = Date.now() - startedAt;
                        let token = '';
                        try {
                            token = window.FloustreamVoiceAudio.stopNativeRecording(bridgeToken) || '';
                        } catch (_) {
                            token = '';
                        }
                        releaseLease();

                        if (elapsed < 1000 || !token) {
                            resetButton();
                            notice('Голосовая запись не сохранилась. Удерживай кнопку не менее одной секунды.', true);
                            return;
                        }

                        try {
                            const url = location.origin + '/__floustream_voice__/' + encodeURIComponent(token) + '.m4a';
                            const response = await fetch(url, { cache: 'no-store' });
                            if (!response.ok) throw new Error('Не удалось прочитать запись с телефона.');
                            const blob = await response.blob();
                            if (blob.size < 1500 || blob.size > 50 * 1024 * 1024) {
                                throw new Error('Размер голосовой записи недопустим.');
                            }
                            const file = new File([blob], 'voice_' + Date.now() + '.m4a', { type: 'audio/mp4' });
                            const transfer = new DataTransfer();
                            transfer.items.add(file);
                            input.files = transfer.files;
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        } catch (error) {
                            try { window.FloustreamVoiceAudio.discardCompletedFile(bridgeToken, token); } catch (_) {}
                            notice('Не удалось передать голосовую запись в отправку: ' +
                                (error && error.message ? error.message : 'попробуй ещё раз.'), true);
                        } finally {
                            resetButton();
                        }
                    }

                    function cancelRecording() {
                        pointerHeld = false;
                        keyboardHeld = false;
                        if (holdTimer) clearTimeout(holdTimer);
                        holdTimer = null;
                        if (recording) {
                            try { window.FloustreamVoiceAudio.cancelNativeRecording(bridgeToken); } catch (_) {}
                            releaseLease();
                            resetButton();
                        }
                    }

                    window.addEventListener('floustream:route-metric', function(event) {
                        const nextRoute = String(event && event.detail ? event.detail.route : '').trim();
                        if (nextRoute && (nextRoute !== 'messages.html' || location.href !== recorderHref)) {
                            disposed = true;
                            cancelRecording();
                            try { window.FloustreamVoiceAudio.cancelNativeRecording(bridgeToken); } catch (_) {}
                            releaseLease();
                        }
                    });

                    button.addEventListener('pointerdown', event => {
                        if (event.button !== 0 || disposed) return;
                        if (text.value.trim()) {
                            // A normal text send must never inherit the voice-hold click guard.
                            ignoreClickUntil = 0;
                            return;
                        }
                        event.preventDefault();
                        ignoreClickUntil = Date.now() + 900;
                        pointerHeld = true;
                        try { button.setPointerCapture(event.pointerId); } catch (_) {}
                        holdTimer = setTimeout(() => {
                            holdTimer = null;
                            if (pointerHeld && !recording) startAttempt = startRecording();
                        }, 420);
                    });
                    button.addEventListener('pointerup', async event => {
                        if (!pointerHeld) return;
                        event.preventDefault();
                        pointerHeld = false;
                        const wasShortTap = !!holdTimer && !recording && !startPending;
                        if (holdTimer) {
                            clearTimeout(holdTimer);
                            holdTimer = null;
                        }
                        // A short tap is the existing send action; a long hold records voice.
                        if (wasShortTap) ignoreClickUntil = 0;
                        if (recording) await stopRecording();
                    });
                    button.addEventListener('pointercancel', cancelRecording);
                    button.addEventListener('lostpointercapture', () => {
                        if (pointerHeld) cancelRecording();
                    });
                    button.addEventListener('click', event => {
                        if (Date.now() < ignoreClickUntil) {
                            event.preventDefault();
                            return;
                        }
                        const preview = routeRoot.querySelector('#attachment-preview');
                        const hasPendingAttachments = !!preview && !preview.hidden;
                        if (text.value.trim() || hasPendingAttachments) {
                            event.preventDefault();
                            form.requestSubmit();
                        }
                    });
                    button.addEventListener('keydown', event => {
                        if ((event.key === ' ' || event.key === 'Enter') && !event.repeat && !text.value.trim()) {
                            event.preventDefault();
                            keyboardHeld = true;
                            startAttempt = startRecording();
                        }
                    });
                    button.addEventListener('keyup', async event => {
                        if ((event.key === ' ' || event.key === 'Enter') && keyboardHeld) {
                            event.preventDefault();
                            keyboardHeld = false;
                            if (recording) await stopRecording();
                        }
                    });

                    window.addEventListener('pagehide', () => {
                        disposed = true;
                        cancelRecording();
                        try { window.FloustreamVoiceAudio.cancelNativeRecording(bridgeToken); } catch (_) {}
                        releaseLease();
                    }, { once: true });
                } catch (_) {}
            })();
        """.trimIndent()
        view.evaluateJavascript(script, null)
    }

    private fun interceptNativeVoiceRecording(request: WebResourceRequest?): WebResourceResponse? {
        val uri = request?.url ?: return null
        if (uri.scheme != "https" || uri.host != "sergeybikov1991-create.github.io") return null
        val prefix = "/__floustream_voice__/"
        val path = uri.encodedPath.orEmpty()
        if (!path.startsWith(prefix) || !path.endsWith(".m4a")) return null
        val token = path.removePrefix(prefix).removeSuffix(".m4a")
        val file = voiceMessageAudioBridge.takeCompletedFile(token)
            ?: return WebResourceResponse(
                "application/json",
                "UTF-8",
                404,
                "Not Found",
                mapOf("Cache-Control" to "no-store"),
                ByteArrayInputStream("""{"error":"Voice recording not found"}""".toByteArray(StandardCharsets.UTF_8))
            )
        val input = object : FilterInputStream(FileInputStream(file)) {
            override fun close() {
                try { super.close() } finally { file.delete() }
            }
        }
        return WebResourceResponse(
            "audio/mp4",
            null,
            200,
            "OK",
            mapOf(
                "Cache-Control" to "no-store",
                "Content-Length" to file.length().toString(),
                "X-Content-Type-Options" to "nosniff"
            ),
            input
        )
    }

    private fun launchVisualPicker(request: PickVisualMediaRequest, multiple: Boolean) {
        try {
            if (multiple) multipleVisualPickerLauncher.launch(request)
            else singleVisualPickerLauncher.launch(request)
        } catch (_: Exception) {
            completeFileChooser(null)
        }
    }

    private fun launchGenericFileChooser(params: WebChromeClient.FileChooserParams?): Boolean {
        val chooserIntent = try {
            params?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
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

    private fun launchCaptureIntent(action: String, extension: String): Boolean {
        return try {
            val captureIntent = Intent(action)
            if (captureIntent.resolveActivity(packageManager) == null) {
                completeFileChooser(null)
                return false
            }

            val captureFile = File.createTempFile("floustream_capture_", extension, cacheDir)
            val captureUri = FileProvider.getUriForFile(
                this,
                "${BuildConfig.APPLICATION_ID}.fileprovider",
                captureFile
            )
            captureIntent.putExtra(MediaStore.EXTRA_OUTPUT, captureUri)
            captureIntent.addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            )
            captureIntent.clipData = ClipData.newUri(
                contentResolver,
                "FLOUSTREAM media capture",
                captureUri
            )
            pendingCaptureUri = captureUri
            pendingCaptureFile = captureFile
            startActivityForResult(captureIntent, FILE_CHOOSER_REQUEST_CODE)
            true
        } catch (_: Exception) {
            pendingCaptureFile?.delete()
            pendingCaptureFile = null
            pendingCaptureUri = null
            completeFileChooser(null)
            false
        }
    }

    private fun completeFileChooser(selectedFiles: Array<Uri>?) {
        pendingFileChooserDialog?.dismiss()
        pendingFileChooserDialog = null
        val callback = fileChooserCallback ?: return
        fileChooserCallback = null
        callback.onReceiveValue(selectedFiles)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            val captureUri = pendingCaptureUri
            val captureFile = pendingCaptureFile
            pendingCaptureUri = null
            pendingCaptureFile = null
            val selectedFiles = if (resultCode == RESULT_OK) {
                if (captureUri != null && captureFile?.exists() == true && captureFile.length() > 0L) {
                    arrayOf(captureUri)
                } else {
                    WebChromeClient.FileChooserParams.parseResult(resultCode, data)
                        ?: data?.data?.let { arrayOf(it) }
                }
            } else {
                captureFile?.delete()
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

    private fun currentGrantedWebMediaPermissions(): Set<String> = buildSet {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            add(Manifest.permission.RECORD_AUDIO)
        }
        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            add(Manifest.permission.CAMERA)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == VoiceMessageAudioBridge.VOICE_PERMISSION_REQUEST_CODE) {
            voiceMessageAudioBridge.onVoicePermissionResult(
                grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED
            )
            return
        }
        if (requestCode == WEB_MEDIA_PERMISSION_REQUEST_CODE) {
            val pending = pendingWebMediaPermissionRequest
            pendingWebMediaPermissionRequest = null
            if (pending == null) return

            val origin = pending.origin
            val requestedResources = pending.resources.toList()
            if (!WebMediaPermissionPolicy.isTrustedOrigin(origin.scheme, origin.host, origin.port) ||
                !SiteRoutePolicy.isTrustedSiteUrl(webView.url) ||
                !WebMediaPermissionPolicy.isSupportedRequest(requestedResources)
            ) {
                pending.deny()
                return
            }

            val grantable = WebMediaPermissionPolicy.grantableResources(
                requestedResources,
                currentGrantedWebMediaPermissions()
            )
            if (grantable.isEmpty()) pending.deny()
            else pending.grant(grantable.toTypedArray())
        }
    }

    override fun onDestroy() {
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        pendingFileChooserDialog?.dismiss()
        pendingFileChooserDialog = null
        pendingWebMediaPermissionRequest?.deny()
        pendingWebMediaPermissionRequest = null
        voiceMessageAudioBridge.close()
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
