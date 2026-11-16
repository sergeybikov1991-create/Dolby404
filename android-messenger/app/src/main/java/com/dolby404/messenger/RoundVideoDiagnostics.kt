package com.dolby404.messenger

import android.content.Context
import android.os.Build
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Small local-only diagnostic journal for round-video failures.
 * It never records message text, account data, media contents or network credentials.
 */
internal object RoundVideoDiagnostics {
    private const val FILE_NAME = "round-video-diagnostics.txt"
    private const val MAX_BYTES = 128 * 1024L
    private val lock = Any()
    private val crashHandlerInstalled = AtomicBoolean(false)

    private fun journal(context: Context) = File(context.filesDir, FILE_NAME)

    fun record(context: Context, message: String, error: Throwable? = null) {
        try {
            synchronized(lock) {
                val file = journal(context)
                if (file.exists() && file.length() > MAX_BYTES) {
                    val old = File(context.filesDir, "$FILE_NAME.old")
                    file.copyTo(old, overwrite = true)
                    file.writeText("")
                }
                val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US).format(Date())
                file.appendText(buildString {
                    append(timestamp)
                    append(" | ")
                    append(message.replace('\n', ' ').take(500))
                    append('\n')
                    if (error != null) {
                        val writer = StringWriter()
                        error.printStackTrace(PrintWriter(writer))
                        append(writer.toString().take(12000))
                        append('\n')
                    }
                })
            }
        } catch (_: Exception) {
            // Diagnostics must never interfere with camera recording or app startup.
        }
    }

    fun read(context: Context): String = try {
        synchronized(lock) {
            val file = journal(context)
            if (!file.exists()) "Журнал пока пуст." else file.readText().takeLast(48_000)
        }
    } catch (error: Exception) {
        "Не удалось прочитать журнал: ${error.javaClass.simpleName}"
    }

    fun installCrashHandler(context: Context) {
        if (!crashHandlerInstalled.compareAndSet(false, true)) return
        val appContext = context.applicationContext
        val previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, error ->
            record(
                appContext,
                "FATAL uncaught exception on thread=${thread.name}; device=${Build.MANUFACTURER} ${Build.MODEL}; Android=${Build.VERSION.SDK_INT}",
                error
            )
            previous?.uncaughtException(thread, error)
        }
        record(
            appContext,
            "App started; device=${Build.MANUFACTURER} ${Build.MODEL}; Android=${Build.VERSION.SDK_INT}; release=${Build.VERSION.RELEASE}"
        )
    }
}
