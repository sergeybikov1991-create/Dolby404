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
                                authMessage: document.querySelector('#auth-message')?.textContent || '',
                                registerDisabled: !!document.querySelector('#register-button')?.disabled,
                                supabaseGlobal: !!(window.supabase && window.supabase.createClient),
                                supabaseClientType: typeof supabaseClient,
                                authCheckState: window.__floustreamAuthCheckState || '',
                                authCheckRunning: !!window.__floustreamAuthCheckRunning,
                                logo: document.querySelector('.logo')?.textContent || ''
                            })""".trimIndent()
                        ) { raw ->
                            val value = runCatching {
                                JSONTokener(raw ?: "null").nextValue() as? String
                            }.getOrNull().orEmpty()
                            snapshot.set(value)
                            val ready = value.contains("portal.html") &&
                                value.contains("\"emailField\":true") &&
                                value.contains("\"passwordField\":true") &&
                                webView.visibility == View.VISIBLE
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
            assertTrue(
                "Expected the visible real portal.html route with working Supabase initialization, got: $page; WebView visibility=${webViewRef.get()?.visibility}",
                page.contains("portal.html") &&
                    page.contains("\"emailField\":true") &&
                    page.contains("\"passwordField\":true") &&
                    page.contains("\"supabaseGlobal\":true") &&
                    page.contains("\"supabaseClientType\":\"object\"")
            )
            assertTrue("Expected the website email field, got: $page", page.contains("\"emailField\":true"))
            assertTrue("Expected the website password field, got: $page", page.contains("\"passwordField\":true"))
            scenario.onActivity {
                assertEquals(View.VISIBLE, webViewRef.get()?.visibility)
            }
        } finally {
            scenario.close()
        }
    }
}
