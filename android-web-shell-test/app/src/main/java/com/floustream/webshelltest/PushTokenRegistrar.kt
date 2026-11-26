package com.floustream.webshelltest

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.util.concurrent.atomic.AtomicBoolean

object PushTokenRegistrar {
    private const val TAG = "FLOUSTREAM-PUSH"
    private val registrationInFlight = AtomicBoolean(false)

    fun register(activity: Activity, userId: String, accessToken: String) {
        if (userId.isBlank() || accessToken.isBlank()) {
            Log.w(TAG, "registration_skipped reason=missing_session")
            return
        }
        if (FirebaseApp.getApps(activity).isEmpty()) {
            Log.w(TAG, "registration_skipped reason=firebase_unavailable")
            return
        }
        if (!registrationInFlight.compareAndSet(false, true)) {
            Log.d(TAG, "registration_skipped reason=in_flight")
            return
        }

        try {
            FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    registrationInFlight.set(false)
                    Log.w(
                        TAG,
                        "token_fetch_failed type=${task.exception?.javaClass?.simpleName ?: "unknown"}"
                    )
                    return@addOnCompleteListener
                }

                val fcmToken = task.result?.takeIf { it.isNotBlank() }
                if (fcmToken == null) {
                    registrationInFlight.set(false)
                    Log.w(TAG, "token_fetch_failed reason=empty_token")
                    return@addOnCompleteListener
                }

                Thread {
                    var connection: HttpURLConnection? = null
                    try {
                        connection = URL(
                            "${BuildConfig.SUPABASE_URL}/rest/v1/device_push_tokens?on_conflict=token"
                        ).openConnection() as HttpURLConnection
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
                            activity.getSharedPreferences("floustream_push", Context.MODE_PRIVATE)
                                .edit().remove("pending_fcm_token").apply()
                            Log.i(TAG, "registration_success status=$responseCode")
                        } else {
                            Log.w(TAG, "registration_http_error status=$responseCode")
                        }
                    } catch (error: Exception) {
                        Log.w(TAG, "registration_failed type=${error.javaClass.simpleName}")
                    } finally {
                        connection?.disconnect()
                        registrationInFlight.set(false)
                    }
                }.start()
            }
        } catch (error: Exception) {
            registrationInFlight.set(false)
            Log.w(TAG, "registration_dispatch_failed type=${error.javaClass.simpleName}")
        }
    }

    fun requestNotificationPermission(activity: Activity) {
        if (Build.VERSION.SDK_INT < 33) return
        if (activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            Log.i(TAG, "notification_permission already_granted")
            return
        }
        Log.i(TAG, "notification_permission request_from_activity")
        activity.requestPermissions(
            arrayOf(Manifest.permission.POST_NOTIFICATIONS),
            REQUEST_NOTIFICATIONS
        )
    }

    private const val REQUEST_NOTIFICATIONS = 7302
}
