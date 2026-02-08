/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.timezone

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule

/**
 * Internal module responsible for listening to system timezone changes and
 * resetting the Hermes timezone cache when applicable.
 *
 * This ensures Date behavior remains correct after a device timezone change
 * during runtime of app.
 */
@ReactModule(name = TimeZoneModule.NAME)
public open class TimeZoneModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  public companion object {
    public const val NAME: String = "TimeZoneModule"
  }

  private var timeZoneChangeReceiver: BroadcastReceiver? = null

  public override fun getName(): String = NAME

  private external fun resetNativeHermesTimeZoneCache(jsRuntimePtr: Long)

  public override fun initialize() {
    super.initialize()
    registerTimeZoneChangeReceiver()
  }

  private fun registerTimeZoneChangeReceiver() {
    if (timeZoneChangeReceiver != null) {
      return
    }
    timeZoneChangeReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
          handleTimeZoneChange()
        }
      }

    reactContext.registerReceiver(
      timeZoneChangeReceiver,
      IntentFilter(Intent.ACTION_TIMEZONE_CHANGED)
    )
  }

  public override fun onCatalystInstanceDestroy() {
    timeZoneChangeReceiver?.let { reactContext.unregisterReceiver(it) }
    timeZoneChangeReceiver = null
    super.onCatalystInstanceDestroy()
  }

  protected open fun resetHermesTimeZoneCache(jsRuntimePtr: Long) {
    resetNativeHermesTimeZoneCache(jsRuntimePtr)
  }

  private fun handleTimeZoneChange() {
    try {
      val catalystInstance = reactApplicationContext.catalystInstance ?: return
      reactApplicationContext.runOnJSQueueThread {
        val jsContext = catalystInstance.javaScriptContextHolder.get()
        resetHermesTimeZoneCache(jsContext)
      }
    } catch (e: Exception) {
      Log.e(NAME, "Failed to reset Hermes timezone cache on timezone change", e)
    }
  }
}
