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
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil.pxToDp

/**
 * Holds an instance of the current DisplayMetrics so we don't have to thread it through all the
 * classes that need it.
 */
public object DisplayMetricsHolder {
  private const val INITIALIZATION_MISSING_MESSAGE =
      "DisplayMetricsHolder must be initialized with initDisplayMetricsIfNotInitialized or initDisplayMetrics"

  @JvmStatic private var windowDisplayMetrics: DisplayMetrics? = null
  @JvmStatic private var screenDisplayMetrics: DisplayMetrics? = null

  /** The metrics of the window associated to the Context used to initialize ReactNative */
  @JvmStatic
  public fun getWindowDisplayMetrics(): DisplayMetrics {
    checkNotNull(windowDisplayMetrics) { INITIALIZATION_MISSING_MESSAGE }
    return windowDisplayMetrics as DisplayMetrics
  }

  @JvmStatic
  public fun setWindowDisplayMetrics(displayMetrics: DisplayMetrics?) {
    windowDisplayMetrics = displayMetrics
  }

  /** Screen metrics returns the metrics of the default screen on the device. */
  @JvmStatic
  public fun getScreenDisplayMetrics(): DisplayMetrics {
    checkNotNull(screenDisplayMetrics) { INITIALIZATION_MISSING_MESSAGE }
    return screenDisplayMetrics as DisplayMetrics
  }

  @JvmStatic
  public fun setScreenDisplayMetrics(displayMetrics: DisplayMetrics?) {
    screenDisplayMetrics = displayMetrics
  }

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
    checkNotNull(windowDisplayMetrics) { INITIALIZATION_MISSING_MESSAGE }
    checkNotNull(screenDisplayMetrics) { INITIALIZATION_MISSING_MESSAGE }

    return WritableNativeMap().apply {
      putMap(
          "windowPhysicalPixels",
          getPhysicalPixelsWritableMap(windowDisplayMetrics as DisplayMetrics, fontScale),
      )
      putMap(
          "screenPhysicalPixels",
          getPhysicalPixelsWritableMap(screenDisplayMetrics as DisplayMetrics, fontScale),
      )
    }
  }

  private fun getPhysicalPixelsWritableMap(
      displayMetrics: DisplayMetrics,
      fontScale: Double,
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
                WindowInsetsCompat.Type.displayCutout()
        )
        .top
  }

  /**
   * Returns the encoded screen size without vertical insets.
   *
   * This is needed to render components that needs to be correctly positioned on the screen on
   * their first frame. Modal is one of such components.
   *
   * @param activity the [Activity] to get the insets from.
   * @return the encoded screen size as a [Long] value, where the first 32 bits represent the width
   *   and the last 32 bits represent the height in dp (density-independent pixels).
   */
  // This annotation can be removed once FabricUIManager is migrated to Kotlin
  @JvmName("getEncodedScreenSizeWithoutVerticalInsets")
  @JvmStatic
  internal fun getEncodedScreenSizeWithoutVerticalInsets(activity: Activity?): Long {
    val windowInsets = activity?.window?.decorView?.let(ViewCompat::getRootWindowInsets) ?: return 0
    val insets =
        windowInsets.getInsets(
            WindowInsetsCompat.Type.statusBars() or
                WindowInsetsCompat.Type.navigationBars() or
                WindowInsetsCompat.Type.displayCutout()
        )
    val verticalInsets = insets.top + insets.bottom
    return encodeFloatsToLong(
        (checkNotNull(screenDisplayMetrics).widthPixels).toFloat().pxToDp(),
        (checkNotNull(screenDisplayMetrics).heightPixels - verticalInsets).toFloat().pxToDp(),
    )
  }

  internal fun encodeFloatsToLong(width: Float, height: Float): Long =
      (width.toRawBits().toLong()) shl 32 or (height.toRawBits().toLong())
}
