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
        } finally {
            scenario.close()
        }
    }
}
