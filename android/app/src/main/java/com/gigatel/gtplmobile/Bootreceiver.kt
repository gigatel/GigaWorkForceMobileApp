package com.gigatrack

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * BootReceiver
 *
 * Fires on device boot and app update.
 * Declared in AndroidManifest.xml — restarts location tracking
 * after the phone reboots (Android 16 compatible).
 *
 * Place this file at:
 * android/app/src/main/java/com/yourapp/BootReceiver.kt
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action
        Log.d(TAG, "onReceive: $action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            // Launch MainActivity so React Native initialises
            // and startForegroundPoster() / startLocationWatch() fires.
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                putExtra("from_boot", true)
            }

            try {
                context.startActivity(launchIntent)
                Log.d(TAG, "App launched after boot ✅")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to launch app after boot", e)
            }
        }
    }

    companion object {
        private const val TAG = "BootReceiver"
    }
}