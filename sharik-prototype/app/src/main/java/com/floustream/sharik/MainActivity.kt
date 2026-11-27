package com.floustream.sharik

import android.Manifest
import android.app.Activity
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
            text = "Разрешить поверх окон"
            setOnClickListener {
                if (!Settings.canDrawOverlays(this@MainActivity)) {
                    startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")))
                } else startPet()
            }
        }, matchWrap())
        root.addView(Button(this).apply {
            text = "Выпустить Шарика на экран"
            setOnClickListener {
                if (Settings.canDrawOverlays(this@MainActivity)) startPet()
                else status.text = "Сначала разреши отображение поверх других приложений."
            }
        }, matchWrap())
        root.addView(Button(this).apply {
            text = "Убрать Шарика"
            setOnClickListener {
                stopService(Intent(this@MainActivity, PetOverlayService::class.java))
                refreshStatus()
            }
        }, matchWrap())
        root.addView(TextView(this).apply {
            text = "Перетаскивай Шарика пальцем. Короткое касание меняет позу: ходьба, сидение, лежание. Он машет хвостом и запоминает последнее положение. Остановить его можно здесь или через системное уведомление."
            textSize = 13f; setTextColor(0xFF9DAACB.toInt()); setPadding(0, 28, 0, 0)
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
            status.text = "Нужно разрешение «Поверх других приложений»."
            return
        }
        val intent = Intent(this, PetOverlayService::class.java).apply {
            action = PetOverlayService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent)
        else startService(intent)
        status.text = "Шарик запускается. Возвращайся на рабочий стол."
    }

    private fun refreshStatus() {
        status.text = if (Settings.canDrawOverlays(this))
            "Разрешение на плавающее окно включено."
        else "Для прогулки по экрану нужно одно разрешение Android."
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
