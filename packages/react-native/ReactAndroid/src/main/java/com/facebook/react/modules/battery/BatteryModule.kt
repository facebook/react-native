/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.battery

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import com.facebook.fbreact.specs.NativeBatterySpec
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeBatterySpec.NAME)
internal class BatteryModule(reactContext: ReactApplicationContext) :
    NativeBatterySpec(reactContext) {

  private var batteryReceiver: BroadcastReceiver? = null
  private var lastEmittedLevel: Int = -1
  private var lastEmittedCharging: Boolean = false
  private var lastEmittedLowPowerMode: Boolean = false

  override fun getBatteryState(promise: Promise) {
    try {
      val batteryState = getBatteryStateInternal()
      promise.resolve(batteryState)
    } catch (e: Exception) {
      promise.reject("BATTERY_ERROR", "Unable to get battery status", e)
    }
  }

  private fun getBatteryStateInternal(): WritableMap {
    val ifilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    val batteryStatus: Intent? = reactApplicationContext.registerReceiver(null, ifilter)

    if (batteryStatus == null) {
      throw Exception("Unable to get battery status")
    }

    val level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
    val scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
    val batteryPct = if (level >= 0 && scale > 0) {
      ((level / scale.toFloat()) * 100).toInt()
    } else {
      -1
    }

    val status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
    val isCharging =
        status == BatteryManager.BATTERY_STATUS_CHARGING ||
        status == BatteryManager.BATTERY_STATUS_FULL

    val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
    val isLowPowerMode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      pm.isPowerSaveMode
    } else {
      false
    }

    val map = Arguments.createMap()
    map.putInt("level", batteryPct)
    map.putBoolean("isCharging", isCharging)
    map.putBoolean("isLowPowerMode", isLowPowerMode)

    return map
  }

  override fun addListener(eventName: String) {
    if (batteryReceiver == null) {
      batteryReceiver =
          object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
              if (Intent.ACTION_BATTERY_CHANGED == intent.action) {
                val batteryState = getBatteryStateInternal()
                val level = batteryState.getInt("level")
                val isCharging = batteryState.getBoolean("isCharging")
                val isLowPowerMode = batteryState.getBoolean("isLowPowerMode")

                // Throttle events: only emit if values actually changed
                if (lastEmittedLevel != level ||
                    lastEmittedCharging != isCharging ||
                    lastEmittedLowPowerMode != isLowPowerMode) {
                  lastEmittedLevel = level
                  lastEmittedCharging = isCharging
                  lastEmittedLowPowerMode = isLowPowerMode

                  val context = reactApplicationContext
                  if (context.hasActiveReactInstance()) {
                    context.emitDeviceEvent("batteryStateDidChange", batteryState)
                  }
                }
              }
            }
          }

      val filter = IntentFilter()
      filter.addAction(Intent.ACTION_BATTERY_CHANGED)
      // Also listen for power save mode changes on Android 5.0+
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        filter.addAction(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED)
      }
      reactApplicationContext.registerReceiver(batteryReceiver, filter)

      // Emit initial state
      val initialState = getBatteryStateInternal()
      val context = reactApplicationContext
      if (context.hasActiveReactInstance()) {
        context.emitDeviceEvent("batteryStateDidChange", initialState)
      }
    }
  }

  override fun removeListeners(count: Double) {
    if (batteryReceiver != null) {
      try {
        reactApplicationContext.unregisterReceiver(batteryReceiver)
      } catch (e: IllegalArgumentException) {
        // Receiver was not registered, ignore
      }
      batteryReceiver = null
      lastEmittedLevel = -1
      lastEmittedCharging = false
      lastEmittedLowPowerMode = false
    }
  }

  override fun invalidate() {
    super.invalidate()
    removeListeners(0.0)
  }

}

