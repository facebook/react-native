/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.Context
import android.util.DisplayMetrics
import android.view.WindowManager
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap

/**
 * Holds an instance of the current DisplayMetrics so we don't have to thread it through all the
 * classes that need it.
 */
public object DisplayMetricsHolder {

  /** The metrics of the window associated to the Context used to initialize ReactNative */
  @get:JvmStatic public var windowDisplayMetrics: DisplayMetrics? = null
  /** Screen metrics returns the metrics of the default screen on the device. */
  @get:JvmStatic public var screenDisplayMetrics: DisplayMetrics? = null

  @JvmStatic
  public fun initDisplayMetricsIfNotInitialized(context: Context) {
    if (screenDisplayMetrics != null) {
      return
    }
    initDisplayMetrics(context)
  }

  @JvmStatic
  public fun initDisplayMetrics(context: Context) {
    val displayMetrics = context.resources.displayMetrics
    windowDisplayMetrics = displayMetrics
    val screenDisplayMetrics = DisplayMetrics()
    screenDisplayMetrics.setTo(displayMetrics)
    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    checkNotNull(wm) { "WindowManager is null!" }
    // Get the real display metrics if we are using API level 17 or higher.
    // The real metrics include system decor elements (e.g. soft menu bar).
    //
    // See:
    // http://developer.android.com/reference/android/view/Display.html#getRealMetrics(android.util.DisplayMetrics)
    @Suppress("DEPRECATION") wm.defaultDisplay.getRealMetrics(screenDisplayMetrics)
    DisplayMetricsHolder.screenDisplayMetrics = screenDisplayMetrics
  }

  @JvmStatic
  public fun getDisplayMetricsWritableMap(fontScale: Double): WritableMap {
    val initMessage =
        "DisplayMetricsHolder must be initialized with initDisplayMetricsIfNotInitialized or initDisplayMetrics"
    checkNotNull(windowDisplayMetrics) { initMessage }
    checkNotNull(screenDisplayMetrics) { initMessage }

    return WritableNativeMap().apply {
      putMap(
          "windowPhysicalPixels",
          getPhysicalPixelsWritableMap(windowDisplayMetrics as DisplayMetrics, fontScale))
      putMap(
          "screenPhysicalPixels",
          getPhysicalPixelsWritableMap(screenDisplayMetrics as DisplayMetrics, fontScale))
    }
  }

  private fun getPhysicalPixelsWritableMap(
      displayMetrics: DisplayMetrics,
      fontScale: Double
  ): WritableMap =
      WritableNativeMap().apply {
        putInt("width", displayMetrics.widthPixels)
        putInt("height", displayMetrics.heightPixels)
        putDouble("scale", displayMetrics.density.toDouble())
        putDouble("fontScale", fontScale)
        putDouble("densityDpi", displayMetrics.densityDpi.toDouble())
      }
}
