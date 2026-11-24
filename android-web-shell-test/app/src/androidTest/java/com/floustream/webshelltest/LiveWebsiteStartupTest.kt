package com.floustream.webshelltest

import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONTokener
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

@RunWith(AndroidJUnit4::class)
class LiveWebsiteStartupTest {
    @Test
    fun signedOutStartupShowsTheRealWebsiteLoginPage() {
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        val finished = CountDownLatch(1)
        val snapshot = AtomicReference("")
        val webViewRef = AtomicReference<WebView?>()

        try {
            scenario.onActivity { activity ->
                val content = activity.findViewById<ViewGroup>(android.R.id.content)
                val webView = content.getChildAt(0) as? WebView
                assertTrue("MainActivity must display the website in a WebView", webView != null)
                assertEquals(
                    "Android video previews must not require a second user gesture",
                    false,
                    webView!!.settings.mediaPlaybackRequiresUserGesture
                )
                webViewRef.set(webView)

                val handler = Handler(Looper.getMainLooper())
                val deadline = SystemClock.elapsedRealtime() + 60_000L
                val poll = object : Runnable {
                    override fun run() {
                        webView!!.evaluateJavascript(
                            """JSON.stringify({
                                url: location.href,
                                title: document.title,
                                emailField: !!document.querySelector('#email'),
                                passwordField: !!document.querySelector('#password'),
                                logo: document.querySelector('.logo')?.textContent || '',
                                videoStreamBypass: !!window.__floustreamAndroidVideoStreamBypassInstalled,
                                photoViewportSync: typeof window.__floustreamAndroidSyncPhotoViewers === 'function'
                            })""".trimIndent()
                        ) { raw ->
                            val value = runCatching {
                                JSONTokener(raw ?: "null").nextValue() as? String
                            }.getOrNull().orEmpty()
                            snapshot.set(value)
                            val ready = value.contains("portal.html") &&
                                value.contains("\"emailField\":true") &&
                                value.contains("\"passwordField\":true") &&
                                value.contains("\"videoStreamBypass\":true") &&
                                value.contains("\"photoViewportSync\":true")
                            if (ready) {
                                finished.countDown()
                            } else if (SystemClock.elapsedRealtime() < deadline) {
                                handler.postDelayed(this, 500L)
                            } else {
                                finished.countDown()
                            }
                        }
                    }
                }
                handler.post(poll)
                handler.postDelayed({ finished.countDown() }, 75_000L)
            }

            assertTrue(
                "The live FLOUSTREAM portal did not load. Last WebView state: ${snapshot.get()}",
                finished.await(65, TimeUnit.SECONDS)
            )
            val page = snapshot.get()
            assertTrue("Expected the real portal.html route, got: $page", page.contains("portal.html"))
            assertTrue("Expected the website email field, got: $page", page.contains("\"emailField\":true"))
            assertTrue("Expected the website password field, got: $page", page.contains("\"passwordField\":true"))
            assertTrue("Expected Android progressive video streaming, got: $page", page.contains("\"videoStreamBypass\":true"))
            assertTrue("Expected Android photo viewport synchronization, got: $page", page.contains("\"photoViewportSync\":true"))
            scenario.onActivity {
                assertEquals(View.VISIBLE, webViewRef.get()?.visibility)
            }

            // Exercise the Android send-arrow override against a deterministic composer fixture.
            val voiceComposerReady = CountDownLatch(1)
            val voiceComposerSnapshot = AtomicReference("")
            val voiceDeadline = SystemClock.elapsedRealtime() + 5_000L
            scenario.onActivity { activity ->
                val webView = webViewRef.get() ?: error("WebView disappeared")
                val handler = Handler(Looper.getMainLooper())
                webView.evaluateJavascript(
                    """(function() {
                        const host = document.querySelector('#floustream-app-shell #floustream-route-view');
                        const root = host && host.shadowRoot ? host.shadowRoot : document;
                        const mount = root instanceof Document ? document.body : root;
                        const fixture = document.createElement('div');
                        fixture.innerHTML =
                            '<form id="composer"><input id="attachment-input" type="file">' +
                            '<textarea id="message-input"></textarea>' +
                            '<div id="attachment-preview"></div>' +
                            '<button id="mic" type="button" style="display:grid">Mic</button>' +
                            '<button id="send" type="submit">Send</button></form>';
                        mount.appendChild(fixture);
                        const form = root.querySelector('#composer');
                        form.addEventListener('submit', event => {
                            event.preventDefault();
                            window.__androidSendCount = (window.__androidSendCount || 0) + 1;
                        });
                        root.querySelector('#attachment-preview').hidden = false;
                        window.dispatchEvent(new CustomEvent('floustream:route-metric', {
                            detail: { route: 'messages.html' }
                        }));
                        return true;
                    })()""".trimIndent(),
                    null
                )
                val poll = object : Runnable {
                    override fun run() {
                        webView.evaluateJavascript(
                            """(function() {
                                const host = document.querySelector('#floustream-app-shell #floustream-route-view');
                                const root = host && host.shadowRoot ? host.shadowRoot : document;
                                const form = root.querySelector('#composer');
                                const send = root.querySelector('#send');
                                const mic = root.querySelector('#mic');
                                const preview = root.querySelector('#attachment-preview');
                                const input = root.querySelector('#message-input');
                                if (!form || !send || !mic || !preview || !input ||
                                    form.dataset.floustreamAndroidVoiceRecorderInstalled !== '1') {
                                    return JSON.stringify({ ready: false });
                                }
                                send.click();
                                const attachmentSubmit = window.__androidSendCount || 0;
                                preview.hidden = true;
                                input.value = 'Проверка отправки';
                                send.click();
                                return JSON.stringify({
                                    ready: true,
                                    sendType: send.type,
                                    micHidden: mic.hidden,
                                    micDisplay: getComputedStyle(mic).display,
                                    attachmentSubmit: attachmentSubmit,
                                    textSubmit: window.__androidSendCount || 0
                                });
                            })()""".trimIndent()
                        ) { raw ->
                            val value = runCatching {
                                JSONTokener(raw ?: "null").nextValue() as? String
                            }.getOrNull().orEmpty()
                            if (value.contains("\"ready\":true")) {
                                voiceComposerSnapshot.set(value)
                                voiceComposerReady.countDown()
                            } else if (SystemClock.elapsedRealtime() < voiceDeadline) {
                                handler.postDelayed(this, 200L)
                            } else {
                                voiceComposerSnapshot.set(value)
                                voiceComposerReady.countDown()
                            }
                        }
                    }
                }
                handler.postDelayed(poll, 500L)
                handler.postDelayed({ voiceComposerReady.countDown() }, 5_000L)
            }
            assertTrue(
                "Android send-arrow integration did not initialize: ${voiceComposerSnapshot.get()}",
                voiceComposerReady.await(7, TimeUnit.SECONDS)
            )
            val composerState = voiceComposerSnapshot.get()
            assertTrue("Android send button must remain a button: $composerState", composerState.contains("\"sendType\":\"button\""))
            assertTrue("Browser microphone must be hidden in Android: $composerState", composerState.contains("\"micHidden\":true"))
            assertTrue("Hidden microphone must not occupy the composer: $composerState", composerState.contains("\"micDisplay\":\"none\""))
            assertTrue("Media-only send must submit from the arrow: $composerState", composerState.contains("\"attachmentSubmit\":1"))
            assertTrue("Text send must submit from the arrow: $composerState", composerState.contains("\"textSubmit\":2"))
        } finally {
            scenario.close()
        }
    }
}
