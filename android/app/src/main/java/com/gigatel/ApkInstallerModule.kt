package com.gigatrack

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.os.Looper
import android.os.Handler
import androidx.core.content.FileProvider
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.*
import java.net.HttpURLConnection
import java.net.URL

class ApkInstallerModule(private val reactCtx: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactCtx) {

  companion object {
    private const val EVENT_PROGRESS = "ApkInstallerProgress"
    private const val EVENT_DONE = "ApkInstallerDone"
    private const val EVENT_ERROR = "ApkInstallerError"
  }

  override fun getName() = "ApkInstaller"

  // ------------------------
  // Permissions / Settings
  // ------------------------

  @ReactMethod
  fun canRequestPackageInstalls(promise: Promise) {
    try {
      val can = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        reactCtx.packageManager.canRequestPackageInstalls()
      } else true
      promise.resolve(can)
    } catch (e: Exception) {
      promise.reject("PERMISSION_CHECK_FAILED", e)
    }
  }

  @ReactMethod
  fun openUnknownSourcesSettings() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val intent = Intent(
        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
        Uri.parse("package:${reactCtx.packageName}")
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactCtx.startActivity(intent)
    }
  }

  // ------------------------
  // Download with Progress
  // ------------------------

  /**
   * Downloads the APK to the app's cache dir and emits progress events.
   * On success, emits ApkInstallerDone with { path } and automatically calls installInternal(path).
   *
   * JS events:
   *  - ApkInstallerProgress: { percent, downloaded, total }
   *  - ApkInstallerDone: { path }
   *  - ApkInstallerError: { code, message }
   */
  @ReactMethod
  fun downloadAndInstall(url: String, fileName: String?, promise: Promise) {
    Thread {
      var conn: HttpURLConnection? = null
      var input: InputStream? = null
      var output: OutputStream? = null
      try {
        val safeName = (fileName?.takeIf { it.endsWith(".apk") } ?: "update.apk")
          .replace(Regex("[^A-Za-z0-9._-]"), "_")
        val outFile = File(reactCtx.cacheDir, safeName)

        val u = URL(url)
        conn = (u.openConnection() as HttpURLConnection).apply {
          connectTimeout = 20000
          readTimeout = 30000
          instanceFollowRedirects = true
          requestMethod = "GET"
        }

        val responseCode = conn.responseCode
        if (responseCode !in 200..299) {
          emitError("HTTP_$responseCode", "HTTP error $responseCode while downloading")
          promise.reject("HTTP_$responseCode", "HTTP error $responseCode while downloading")
          return@Thread
        }

        val totalLen = conn.contentLengthLong.takeIf { it > 0 } ?: -1L
        input = BufferedInputStream(conn.inputStream)
        output = BufferedOutputStream(FileOutputStream(outFile))

        val buffer = ByteArray(8 * 1024)
        var downloaded = 0L
        var lastEmitTime = 0L

        while (true) {
          val read = input.read(buffer)
          if (read == -1) break
          output.write(buffer, 0, read)
          downloaded += read

          val now = System.currentTimeMillis()
          if ((now - lastEmitTime) > 150) { // throttle ~6–7/s
            lastEmitTime = now
            emitProgress(downloaded, totalLen)
          }
        }
        output.flush()

        // Final emit
        emitProgress(downloaded, totalLen)

        // Notify JS
        emitDone(outFile.absolutePath)

        // Auto install (no Promise overload hassles)
        runOnUi { installInternal(outFile.absolutePath) }

        // Resolve with file path for JS if needed
        promise.resolve(outFile.absolutePath)
      } catch (e: Exception) {
        emitError("DOWNLOAD_ERROR", e.message ?: "Unknown error")
        promise.reject("DOWNLOAD_ERROR", e)
      } finally {
        try { output?.close() } catch (_: Exception) {}
        try { input?.close() } catch (_: Exception) {}
        conn?.disconnect()
      }
    }.start()
  }

  // ------------------------
  // Install
  // ------------------------

  // Public RN method (for manual install triggers)
  @ReactMethod
  fun install(apkAbsolutePath: String, promise: Promise) {
    try {
      if (installInternal(apkAbsolutePath)) {
        promise.resolve(true)
      } else {
        promise.reject("INSTALL_FAILED", "Failed to start installer Intent")
      }
    } catch (e: Exception) {
      promise.reject("INSTALL_ERROR", e)
    }
  }

  // Private helper used by both downloadAndInstall and install()
  private fun installInternal(apkAbsolutePath: String): Boolean {
    val file = File(apkAbsolutePath)
    if (!file.exists()) {
      emitError("ENOENT", "APK not found at $apkAbsolutePath")
      return false
    }

    val uri = try {
      // IMPORTANT: authority must match your AndroidManifest provider authority
      FileProvider.getUriForFile(reactCtx, "${reactCtx.packageName}.fileprovider", file)
    } catch (e: Exception) {
      emitError("FILEPROVIDER_ERROR", e.message ?: "Failed to build content Uri")
      return false
    }

    return try {
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/vnd.android.package-archive")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactCtx.startActivity(intent)
      true
    } catch (e: Exception) {
      emitError("INSTALL_INTENT_ERROR", e.message ?: "Failed to start installer activity")
      false
    }
  }

  // ------------------------
  // Helpers (events & UI)
  // ------------------------

  private fun emitProgress(downloaded: Long, total: Long) {
    val params = Arguments.createMap().apply {
      putDouble("downloaded", downloaded.toDouble())
      if (total > 0) {
        putDouble("total", total.toDouble())
        val percent = (downloaded.toDouble() / total.toDouble()) * 100.0
        putDouble("percent", percent.coerceIn(0.0, 100.0))
      } else {
        putDouble("total", -1.0)
        putDouble("percent", -1.0) // unknown total
      }
    }
    sendEvent(EVENT_PROGRESS, params)
  }

  private fun emitDone(path: String) {
    val params = Arguments.createMap().apply { putString("path", path) }
    sendEvent(EVENT_DONE, params)
  }

  private fun emitError(code: String, message: String) {
    val params = Arguments.createMap().apply {
      putString("code", code)
      putString("message", message)
    }
    sendEvent(EVENT_ERROR, params)
  }

  private fun sendEvent(eventName: String, params: WritableMap?) {
    // Guard to avoid NPEs when catalyst is not ready
    if (reactCtx.hasActiveCatalystInstance()) {
      reactCtx
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, params)
    }
  }

  private fun runOnUi(block: () -> Unit) {
    val looper = Looper.getMainLooper()
    if (Looper.myLooper() == looper) {
      block()
    } else {
      Handler(looper).post { block() }
    }
  }
}
