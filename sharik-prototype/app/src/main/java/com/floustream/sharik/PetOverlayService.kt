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
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import kotlin.math.sin

class PetOverlayService : Service() {
    companion object {
        const val ACTION_START = "com.floustream.sharik.START"
        const val ACTION_STOP = "com.floustream.sharik.STOP"
        private const val CHANNEL_ID = "sharik_companion"
        private const val NOTIFICATION_ID = 741
        private const val TICK_MS = 42L
        private const val HOME_CHECK_MS = 650L
    }

    private lateinit var windowManager: WindowManager
    private lateinit var petView: PetView
    private lateinit var params: WindowManager.LayoutParams
    private lateinit var homePackage: String
    private val handler = Handler(Looper.getMainLooper())
    private var direction = 1
    private var pose = 0
    private var frame = 0
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
            frame++
            petView.invalidate()
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
            dp(184), dp(184),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            android.graphics.PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = prefs.getInt("x", dp(18)).coerceIn(bounds.first, bounds.second)
            y = prefs.getInt("y", bounds.third + (bounds.fourth - bounds.third) / 2)
                .coerceIn(bounds.third, bounds.fourth)
        }
        petView = PetView()
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
        val maxY = (height - bottomInset - dp(12) - dp(184)).coerceAtLeast(minY)
        val maxX = (width - dp(184)).coerceAtLeast(0)
        return DesktopBounds(0, maxX, minY, maxY)
    }

    private data class DesktopBounds(val minX: Int, val maxX: Int, val minY: Int, val maxY: Int) {
        operator fun component1() = minX
        operator fun component2() = maxX
        operator fun component3() = minY
        operator fun component4() = maxY
    }

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

    private inner class PetView : View(this@PetOverlayService) {
        private val p = Paint(Paint.ANTI_ALIAS_FLAG)
        private val body = RectF()
        private val tail = Path()

        init { setLayerType(LAYER_TYPE_SOFTWARE, null) }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val density = resources.displayMetrics.density
            canvas.save()
            canvas.scale(density, density)
            val logicalWidth = width / density
            val logicalHeight = height / density
            val cx = logicalWidth / 2f
            val bob = if (pose == 0) sin(frame * 0.42).toFloat() * 5f else 0f
            val cy = logicalHeight * 0.53f + bob
            val headX = if (pose == 2) cx + 20f else cx
            val headY = if (pose == 2) cy - 12f else cy
            val wag = sin(frame * 0.55).toFloat() * 0.42f

            p.color = 0x553D4C78
            canvas.drawOval(cx - 48, logicalHeight - 28f, cx + 48, logicalHeight - 12f, p)
            canvas.save()
            canvas.rotate(wag * 48f, cx + 37f, cy + 17f)
            tail.reset()
            tail.moveTo(cx + 34f, cy + 20f)
            tail.cubicTo(cx + 75f, cy + 5f, cx + 73f, cy - 34f, cx + 48f, cy - 29f)
            p.style = Paint.Style.STROKE
            p.strokeWidth = 12f
            p.strokeCap = Paint.Cap.ROUND
            p.color = 0xFFFFB86B.toInt()
            canvas.drawPath(tail, p)
            p.style = Paint.Style.FILL
            canvas.restore()

            p.color = 0xFF8D83E8.toInt()
            canvas.drawOval(headX - 42, headY - 56, headX - 13, headY - 17, p)
            canvas.drawOval(headX + 13, headY - 56, headX + 42, headY - 17, p)
            if (pose == 2) body.set(cx - 55, cy - 25, cx + 55, cy + 32)
            else body.set(cx - 48, cy - 40, cx + 48, cy + 47)
            p.color = 0xFFB9B1FF.toInt()
            canvas.drawOval(body, p)
            p.color = 0xFFE9E5FF.toInt()
            if (pose == 2) canvas.drawOval(cx - 34, cy - 15, cx + 43, cy + 24, p)
            else canvas.drawOval(cx - 31, cy - 26, cx + 31, cy + 37, p)
            p.color = 0xFF8278D9.toInt()
            val footShift = if (pose == 0) sin(frame * 0.6).toFloat() * 5f else 0f
            if (pose == 2) {
                canvas.drawOval(cx - 48, cy + 12, cx - 22, cy + 31, p)
                canvas.drawOval(cx + 30, cy + 12, cx + 53, cy + 29, p)
            } else {
                canvas.drawOval(cx - 40 - footShift, cy + 29, cx - 12 - footShift, cy + 48, p)
                canvas.drawOval(cx + 12 + footShift, cy + 29, cx + 40 + footShift, cy + 48, p)
            }
            p.color = 0xFF292746.toInt()
            canvas.drawCircle(headX - 17, headY - 1, 4.5f, p)
            canvas.drawCircle(headX + 17, headY - 1, 4.5f, p)
            p.style = Paint.Style.STROKE
            p.strokeWidth = 2.8f
            p.strokeCap = Paint.Cap.ROUND
            canvas.drawArc(headX - 10, headY + 5, headX + 10, headY + 19, 15f, 150f, false, p)
            p.style = Paint.Style.FILL
            p.color = 0x66FF8FA8
            canvas.drawCircle(headX - 29, headY + 10, 7f, p)
            canvas.drawCircle(headX + 29, headY + 10, 7f, p)
            if (pose == 1) {
                p.color = Color.WHITE
                p.textSize = 17f
                p.typeface = Typeface.DEFAULT_BOLD
                canvas.drawText("z", cx + 50, cy - 48, p)
            }
            canvas.restore()
        }

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
                    if (event.action == MotionEvent.ACTION_UP && moved < 12f) pose = (pose + 1) % 3
                    getSharedPreferences("pet", MODE_PRIVATE).edit()
                        .putInt("x", params.x).putInt("y", params.y).apply()
                    return true
                }
            }
            return true
        }
    }
}
