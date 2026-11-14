package com.dolby404.messenger

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AppUpdateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_MY_PACKAGE_REPLACED) return
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        try {
            context.startActivity(launchIntent)
        } catch (_: Exception) {
            // Android may block background activity launches on some devices.
            // The system installer still offers the user an Open button.
        }
    }
}
