package com.floustream.webshelltest

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FLOUSTREAMMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        getSharedPreferences("floustream_push", Context.MODE_PRIVATE)
            .edit()
            .putString("pending_fcm_token", token)
            .apply()
    }

    override fun onMessageReceived(message: RemoteMessage) {
        if (FirebaseApp.getApps(this).isEmpty()) return

        val title = message.data["title"]
            ?: message.notification?.title
            ?: "FLOUSTREAM"
        val body = message.data["body"]
            ?: message.notification?.body
            ?: "Новое сообщение"
        val channelId = "floustream_messages"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(
                    channelId,
                    "Сообщения FLOUSTREAM",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Новые сообщения и события FLOUSTREAM"
                }
            )
        }

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            ?: Intent(this, MainActivity::class.java)
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        message.data["sender_id"]?.takeIf { it.isNotBlank() }?.let {
            launchIntent.putExtra(EXTRA_NOTIFICATION_PEER_ID, it)
        }

        val notificationId = (System.currentTimeMillis() % Int.MAX_VALUE)
            .toInt().coerceAtLeast(1)
        val pendingIntent = PendingIntent.getActivity(
            this,
            notificationId,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        try {
            NotificationManagerCompat.from(this).notify(notificationId, notification)
        } catch (_: SecurityException) {
            // Android 13+: the user may have denied notification permission.
        }
    }

    companion object {
        const val EXTRA_NOTIFICATION_PEER_ID = "floustream_notification_peer_id"
    }
}
