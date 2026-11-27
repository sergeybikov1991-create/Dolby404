package com.floustream.sharik

import android.app.AppOpsManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout

class PetOverlayService : Service() {
    companion object {
        const val ACTION_START = "com.floustream.sharik.START"
        const val ACTION_STOP = "com.floustream.sharik.STOP"
        private const val CHANNEL_ID = "sharik_companion"
        private const val NOTIFICATION_ID = 741
        private const val TICK_MS = 42L
        private const val HOME_CHECK_MS = 650L
        private const val OVERLAY_WIDTH_DP = 260
        private const val OVERLAY_HEIGHT_DP = 190
    }

    private lateinit var windowManager: WindowManager
    private lateinit var petView: PetView
    private lateinit var params: WindowManager.LayoutParams
    private lateinit var homePackage: String
    private val handler = Handler(Looper.getMainLooper())
    private var direction = 1
    private var pose = 0
    private var dragging = false
    private var homeVisible = false
    private var downX = 0f
    private var downY = 0f
    private var originX = 0
    private var originY = 0
    private var lastHomeCheck = 0L

    private val ticker = object : Runnable {
        override fun run() {
            if (!::petView.isInitialized || !::params.isInitialized) return
            val now = android.os.SystemClock.elapsedRealtime()
            if (now - lastHomeCheck >= HOME_CHECK_MS) {
                lastHomeCheck = now
                val shouldShow = isLauncherForeground()
                if (shouldShow != homeVisible) {
                    homeVisible = shouldShow
                    petView.visibility = if (homeVisible) View.VISIBLE else View.GONE
                }
            }

            if (homeVisible && !dragging && pose == 0) {
                val (minX, maxX, minY, maxY) = desktopBounds()
                params.x = (params.x + direction * 3).coerceIn(minX, maxX)
                if (params.x == minX) direction = 1
                if (params.x == maxX) direction = -1
                params.y = params.y.coerceIn(minY, maxY)
                runCatching { windowManager.updateViewLayout(petView, params) }
            }
            handler.postDelayed(this, TICK_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        homePackage = packageManager.resolveActivity(
            Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),
            android.content.pm.PackageManager.MATCH_DEFAULT_ONLY
        )?.activityInfo?.packageName.orEmpty()

        val prefs = getSharedPreferences("pet", MODE_PRIVATE)
        val bounds = desktopBounds()
        params = WindowManager.LayoutParams(
            dp(OVERLAY_WIDTH_DP), dp(OVERLAY_HEIGHT_DP),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            android.graphics.PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = prefs.getInt("x", dp(18)).coerceIn(bounds.minX, bounds.maxX)
            y = prefs.getInt("y", bounds.minY + (bounds.maxY - bounds.minY) / 2)
                .coerceIn(bounds.minY, bounds.maxY)
        }
        petView = PetView()
        petView.setPose(pose)
        petView.visibility = View.GONE
        windowManager.addView(petView, params)
        handler.post(ticker)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    override fun onDestroy() {
        handler.removeCallbacks(ticker)
        if (::petView.isInitialized) {
            getSharedPreferences("pet", MODE_PRIVATE).edit()
                .putInt("x", params.x).putInt("y", params.y).apply()
            runCatching { windowManager.removeView(petView) }
        }
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    private fun dimension(name: String): Int {
        val id = resources.getIdentifier(name, "dimen", "android")
        return if (id != 0) resources.getDimensionPixelSize(id) else 0
    }

    // Coordinates are limited to the usable launcher workspace, excluding system bars.
    private fun desktopBounds(): DesktopBounds {
        val width = resources.displayMetrics.widthPixels
        val height = resources.displayMetrics.heightPixels
        val top = dimension("status_bar_height") + dp(12)
        val bottomInset = dimension("navigation_bar_height")
        val minY = top
        val maxY = (height - bottomInset - dp(12) - dp(OVERLAY_HEIGHT_DP)).coerceAtLeast(minY)
        val maxX = (width - dp(OVERLAY_WIDTH_DP)).coerceAtLeast(0)
        return DesktopBounds(0, maxX, minY, maxY)
    }

    private data class DesktopBounds(val minX: Int, val maxX: Int, val minY: Int, val maxY: Int)

    private fun hasUsageAccess(): Boolean {
        val appOps = getSystemService(APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= 29) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), packageName)
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), packageName)
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun isLauncherForeground(): Boolean {
        if (!hasUsageAccess() || homePackage.isBlank()) return false
        val usage = getSystemService(USAGE_STATS_SERVICE) as UsageStatsManager
        val end = System.currentTimeMillis()
        val events = usage.queryEvents(end - 15_000L, end)
        val event = UsageEvents.Event()
        var foregroundPackage: String? = null
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
                event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                foregroundPackage = event.packageName
            }
        }
        return foregroundPackage == homePackage
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Шарик на рабочем столе", NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Управление спутником рабочего стола" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val open = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or
                (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0)
        )
        val stop = PendingIntent.getService(
            this, 1, Intent(this, PetOverlayService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_UPDATE_CURRENT or
                (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0)
        )
        val builder = if (Build.VERSION.SDK_INT >= 26)
            Notification.Builder(this, CHANNEL_ID) else Notification.Builder(this)
        return builder.setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Шарик на рабочем столе")
            .setContentText("Появляется только на главном экране.")
            .setContentIntent(open).setOngoing(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Остановить", stop)
            .build()
    }

    private inner class PetView : FrameLayout(this@PetOverlayService) {
        private val threeDView = Sharik3DOverlayView(this@PetOverlayService)

        init {
            setWillNotDraw(true)
            isClickable = true
            addView(
                threeDView,
                LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            )
        }

        fun setPose(value: Int) {
            threeDView.setPose(value)
        }

        // Keep drag/tap gestures in the overlay service; the 3D viewport stays non-interactive.
        override fun onInterceptTouchEvent(event: MotionEvent): Boolean = true

        override fun onTouchEvent(event: MotionEvent): Boolean {
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    dragging = true
                    downX = event.rawX
                    downY = event.rawY
                    originX = params.x
                    originY = params.y
                    return true
                }
                MotionEvent.ACTION_MOVE -> {
                    val bounds = desktopBounds()
                    params.x = (originX + event.rawX - downX).toInt().coerceIn(bounds.minX, bounds.maxX)
                    params.y = (originY + event.rawY - downY).toInt().coerceIn(bounds.minY, bounds.maxY)
                    runCatching { windowManager.updateViewLayout(this, params) }
                    return true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    val moved = kotlin.math.abs(event.rawX - downX) + kotlin.math.abs(event.rawY - downY)
                    dragging = false
                    if (event.action == MotionEvent.ACTION_UP && moved < 12f) {
                        pose = (pose + 1) % 3
                        setPose(pose)
                    }
                    getSharedPreferences("pet", MODE_PRIVATE).edit()
                        .putInt("x", params.x).putInt("y", params.y).apply()
                    return true
                }
            }
            return true
        }
    }
}
