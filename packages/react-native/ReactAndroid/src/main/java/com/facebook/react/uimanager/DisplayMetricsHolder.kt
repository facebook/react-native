/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.app.Activity
import android.content.Context
import android.util.DisplayMetrics
import android.view.WindowManager
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.window.layout.WindowMetricsCalculator
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn

/**
 * Holds an instance of the current DisplayMetrics so we don't have to thread it through all the
 * classes that need it.
 */
public object DisplayMetricsHolder {
  private const val SCREEN_INITIALIZATION_MISSING_MESSAGE =
      "DisplayMetricsHolder must be initialized with initScreenDisplayMetricsIfNotInitialized or initScreenDisplayMetrics"
  private const val WINDOW_INITIALIZATION_MISSING_MESSAGE =
      "DisplayMetricsHolder must be initialized with initWindowDisplayMetricsIfNotInitialized or initWindowDisplayMetrics"

  @JvmStatic private var windowDisplayMetrics: DisplayMetrics? = null
  @JvmStatic private var screenDisplayMetrics: DisplayMetrics? = null

  /** The metrics of the window associated to the Context used to initialize ReactNative */
  @JvmStatic
  public fun getWindowDisplayMetrics(): DisplayMetrics {
    checkNotNull(windowDisplayMetrics) { WINDOW_INITIALIZATION_MISSING_MESSAGE }
    return windowDisplayMetrics as DisplayMetrics
  }

  @JvmStatic
  public fun setWindowDisplayMetrics(displayMetrics: DisplayMetrics?) {
    windowDisplayMetrics = displayMetrics
  }

  /** Screen metrics returns the metrics of the default screen on the device. */
  @JvmStatic
  public fun getScreenDisplayMetrics(): DisplayMetrics {
    checkNotNull(screenDisplayMetrics) { SCREEN_INITIALIZATION_MISSING_MESSAGE }
    return screenDisplayMetrics as DisplayMetrics
  }

  @JvmStatic
  public fun setScreenDisplayMetrics(displayMetrics: DisplayMetrics?) {
    screenDisplayMetrics = displayMetrics
  }

  @JvmStatic
  public fun initScreenDisplayMetricsIfNotInitialized(context: Context) {
    if (screenDisplayMetrics == null) {
      initScreenDisplayMetrics(context)
    }
  }

  @JvmStatic
  public fun initWindowDisplayMetricsIfNotInitialized(context: Context) {
    if (windowDisplayMetrics == null) {
      initWindowDisplayMetrics(context)
    }
  }

  @JvmStatic
  public fun initScreenDisplayMetrics(context: Context) {
    val displayMetrics = DisplayMetrics()
    displayMetrics.setTo(context.resources.displayMetrics)

    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    // Get the real display metrics if we are using API level 17 or higher.
    // The real metrics include system decor elements (e.g. soft menu bar).
    //
    // See:
    // http://developer.android.com/reference/android/view/Display.html#getRealMetrics(android.util.DisplayMetrics)
    @Suppress("DEPRECATION") wm.defaultDisplay.getRealMetrics(displayMetrics)
    screenDisplayMetrics = displayMetrics
  }

  /*
   * NOTE: Unlike [initScreenDisplayMetrics], this method needs a UiContext (Activity of
   * InputMethodService) else WindowMetircsCalculator will throw an exception.
   */
  @JvmStatic
  public fun initWindowDisplayMetrics(context: Context) {
    val displayMetrics = DisplayMetrics()
    displayMetrics.setTo(context.resources.displayMetrics)

    if (isEdgeToEdgeFeatureFlagOn) {
      WindowMetricsCalculator.getOrCreate().computeCurrentWindowMetrics(context).let { windowMetrics
        ->
        displayMetrics.widthPixels = windowMetrics.bounds.width()
        displayMetrics.heightPixels = windowMetrics.bounds.height()
      }
    }

    windowDisplayMetrics = displayMetrics
  }

  @JvmStatic
  public fun getDisplayMetricsWritableMap(fontScale: Double): WritableMap {
    checkNotNull(windowDisplayMetrics) { WINDOW_INITIALIZATION_MISSING_MESSAGE }
    checkNotNull(screenDisplayMetrics) { SCREEN_INITIALIZATION_MISSING_MESSAGE }

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

  internal fun getStatusBarHeightPx(activity: Activity?): Int {
    val windowInsets = activity?.window?.decorView?.let(ViewCompat::getRootWindowInsets) ?: return 0
    return windowInsets
        .getInsets(
            WindowInsetsCompat.Type.statusBars() or
                WindowInsetsCompat.Type.navigationBars() or
                WindowInsetsCompat.Type.displayCutout())
        .top
  }
}
