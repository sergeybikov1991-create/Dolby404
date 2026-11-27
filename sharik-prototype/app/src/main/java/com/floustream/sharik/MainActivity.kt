package com.floustream.sharik

import android.Manifest
import android.app.Activity
import android.app.AppOpsManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private lateinit var status: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestNotificationPermissionIfNeeded()
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(28, 36, 28, 28)
            setBackgroundColor(0xFF101426.toInt())
        }
        root.addView(TextView(this).apply {
            text = "Шарик"; textSize = 34f
            setTextColor(0xFFFFFFFF.toInt()); gravity = Gravity.CENTER
        }, matchWrap())
        root.addView(TextView(this).apply {
            text = "Живой спутник рабочего стола"; textSize = 16f
            setTextColor(0xFFB8C5E8.toInt()); gravity = Gravity.CENTER
            setPadding(0, 8, 0, 28)
        }, matchWrap())
        status = TextView(this).apply {
            textSize = 14f; setTextColor(0xFFE4E9FA.toInt())
            gravity = Gravity.CENTER; setPadding(0, 8, 0, 24)
        }
        root.addView(status, matchWrap())
        root.addView(Button(this).apply {
            text = "Разрешить отображение поверх окон"
            setOnClickListener {
                if (!Settings.canDrawOverlays(this@MainActivity)) {
                    startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")))
                } else refreshStatus()
            }
        }, matchWrap())
        root.addView(Button(this).apply {
            text = "Разрешить определять рабочий стол"
            setOnClickListener {
                if (!hasUsageAccess()) startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
                else refreshStatus()
            }
        }, matchWrap())
        root.addView(Button(this).apply {
            text = "Выпустить Шарика на рабочий стол"
            setOnClickListener { startPet() }
        }, matchWrap())
        root.addView(Button(this).apply {
            text = "Убрать Шарика"
            setOnClickListener {
                stopService(Intent(this@MainActivity, PetOverlayService::class.java))
                refreshStatus()
            }
        }, matchWrap())
        root.addView(TextView(this).apply {
            text = "Шарик гуляет только на домашнем экране, не выходит за его границы и скрывается при открытии приложений. Перетаскивай его пальцем. Короткое касание переключает 3D-анимации: ходьба, отдых с дыханием и вилянием хвоста, сидение."
            textSize = 13f; setTextColor(0xFF9DAACB.toInt()); setPadding(0, 28, 0, 0)
        }, matchWrap())
        root.addView(TextView(this).apply {
            text = "3D-модель: German Shepherd by vinish.dev, лицензия CC BY 4.0."
            textSize = 10f
            setTextColor(0xFF7F8BAA.toInt())
            setPadding(0, 18, 0, 0)
        }, matchWrap())
        setContentView(root)
        refreshStatus()
    }

    override fun onResume() {
        super.onResume()
        if (::status.isInitialized) refreshStatus()
    }

    private fun startPet() {
        if (!Settings.canDrawOverlays(this)) {
            status.text = "Сначала разреши отображение поверх других приложений."
            startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
            return
        }
        if (!hasUsageAccess()) {
            status.text = "Нужно разрешить доступ к истории использования, чтобы определять домашний экран."
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
            return
        }
        val intent = Intent(this, PetOverlayService::class.java).apply { action = PetOverlayService.ACTION_START }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent) else startService(intent)
        status.text = "Шарик запущен. Вернись на главный экран."
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

    private fun refreshStatus() {
        val overlay = Settings.canDrawOverlays(this)
        val usage = hasUsageAccess()
        status.text = when {
            overlay && usage -> "Оба разрешения включены. Шарик будет виден только на рабочем столе."
            !overlay && !usage -> "Нужно включить два разрешения: отображение поверх окон и доступ к истории использования."
            !overlay -> "Осталось разрешить отображение поверх окон."
            else -> "Осталось разрешить определение активного рабочего стола."
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 41)
        }
    }

    private fun matchWrap() = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
    )
}
