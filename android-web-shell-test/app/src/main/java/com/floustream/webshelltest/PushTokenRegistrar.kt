package com.floustream.webshelltest

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant

object PushTokenRegistrar {
    fun register(activity: Activity, userId: String, accessToken: String) {
        if (userId.isBlank() || accessToken.isBlank()) return
        if (FirebaseApp.getApps(activity).isEmpty()) return

        requestNotificationPermission(activity)

        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) return@addOnCompleteListener
            val fcmToken = task.result?.takeIf { it.isNotBlank() } ?: return@addOnCompleteListener

            Thread {
                val connection = URL(
                    "${BuildConfig.SUPABASE_URL}/rest/v1/device_push_tokens?on_conflict=token"
                ).openConnection() as HttpURLConnection
                try {
                    connection.requestMethod = "POST"
                    connection.connectTimeout = 10000
                    connection.readTimeout = 10000
                    connection.doOutput = true
                    connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                    connection.setRequestProperty("Authorization", "Bearer $accessToken")
                    connection.setRequestProperty("Content-Type", "application/json")
                    connection.setRequestProperty(
                        "Prefer",
                        "resolution=merge-duplicates,return=minimal"
                    )
                    val payload = JSONObject()
                        .put("token", fcmToken)
                        .put("user_id", userId)
                        .put("platform", "android")
                        .put("updated_at", Instant.now().toString())
                        .toString()
                    connection.outputStream.use {
                        it.write(payload.toByteArray(Charsets.UTF_8))
                    }
                    val responseCode = connection.responseCode
                    if (responseCode in 200..299) {
                        val prefs = activity.getSharedPreferences(
                            "floustream_push",
                            Context.MODE_PRIVATE
                        )
                        if (prefs.getString("pending_fcm_token", null) == fcmToken) {
                            prefs.edit().remove("pending_fcm_token").apply()
                        }
                    }
                } catch (_: Exception) {
                    // A later page load/resume retries registration without interrupting the UI.
                } finally {
                    connection.disconnect()
                }
            }.start()
        }
    }

    private fun requestNotificationPermission(activity: Activity) {
        if (Build.VERSION.SDK_INT < 33) return
        if (activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        ) return

        val prefs = activity.getSharedPreferences("floustream_push", Context.MODE_PRIVATE)
        if (prefs.getBoolean("notification_permission_requested", false)) return

        prefs.edit().putBoolean("notification_permission_requested", true).apply()
        activity.requestPermissions(
            arrayOf(Manifest.permission.POST_NOTIFICATIONS),
            REQUEST_NOTIFICATIONS
        )
    }

    private const val REQUEST_NOTIFICATIONS = 7302
}
