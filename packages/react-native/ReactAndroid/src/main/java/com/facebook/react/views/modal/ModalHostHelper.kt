/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Point
import android.os.Build
import android.view.Window
import android.view.WindowInsets
import android.view.WindowManager
import androidx.window.layout.WindowMetricsCalculator

/** Helper class for Modals. */
internal object ModalHostHelper {
  private val MIN_POINT = Point()
  private val MAX_POINT = Point()
  private val SIZE_POINT = Point()

  private const val APPEARANCE_FORCE_LIGHT_NAVIGATION_BARS = 1 shl 9

  /**
   * Adding new function to handle Android 15 as behavior has changed (even building without
   * targetSdk 35) but keeping legacy code to handle lower versions.
   */
  @JvmStatic
  fun getModalHostSize(
      context: Context,
      window: Window?,
  ): Point {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      getModalHostSizeNew(context, window)
    } else {
      getModalHostSizeLegacy(context)
    }
  }

  @JvmStatic
  fun getModalHostSizeNew(context: Context, window: Window?): Point {
    val metrics = WindowMetricsCalculator.getOrCreate().computeCurrentWindowMetrics(context)
    var verticalPadding = 0
    var horizontalPadding = 0
    window?.decorView?.rootWindowInsets?.let {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val insets = it.getInsets(WindowInsets.Type.systemBars())
        val isForcedEdgeToEdge = isForcedEdgeToEdge(window)
        verticalPadding = insets.bottom + if (isForcedEdgeToEdge.not()) insets.top else 0
        horizontalPadding = if (isForcedEdgeToEdge.not()) insets.left + insets.right else 0
      }
    }
    return Point(
        metrics.bounds.width() - horizontalPadding, metrics.bounds.height() - verticalPadding)
  }

  // Undocumented feature: APPEARANCE_FORCE_LIGHT_NAVIGATION_BARS seems to be set on forced
  // edge-to-edge on targetSdk 35
  private fun isForcedEdgeToEdge(window: Window): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      ((window.decorView.windowInsetsController?.systemBarsAppearance ?: 0) and
          APPEARANCE_FORCE_LIGHT_NAVIGATION_BARS) > 0
    } else false
  }

  /**
   * To get the size of the screen, we use information from the WindowManager and default Display.
   * We don't use DisplayMetricsHolder, or Display#getSize() because they return values that include
   * the status bar. We only want the values of what will actually be shown on screen. We use
   * Display#getSize() to determine if the screen is in portrait or landscape. We don't use
   * getRotation because the 'natural' rotation will be portrait on phones and landscape on tablets.
   * This should only be called on the native modules/shadow nodes thread.
   */
  @Suppress("DEPRECATION")
  @JvmStatic
  fun getModalHostSizeLegacy(context: Context): Point {
    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val display = wm.defaultDisplay
    // getCurrentSizeRange will return the min and max width and height that the window can be
    display.getCurrentSizeRange(MIN_POINT, MAX_POINT)
    // getSize will return the dimensions of the screen in its current orientation
    display.getSize(SIZE_POINT)

    val attrs = intArrayOf(android.R.attr.windowFullscreen)
    val theme = context.theme
    val ta = theme.obtainStyledAttributes(attrs)
    val windowFullscreen = ta.getBoolean(0, false)

    // We need to add the status bar height to the height if we have a fullscreen window,
    // because Display.getCurrentSizeRange doesn't include it.
    val resources = context.resources
    @SuppressLint("DiscouragedApi", "InternalInsetResource")
    val statusBarId = resources.getIdentifier("status_bar_height", "dimen", "android")
    var statusBarHeight = 0
    if (windowFullscreen && statusBarId > 0) {
      statusBarHeight = resources.getDimension(statusBarId).toInt()
    }

    return if (SIZE_POINT.x < SIZE_POINT.y) {
      // If we are vertical the width value comes from min width and height comes from max height
      Point(MIN_POINT.x, MAX_POINT.y + statusBarHeight)
    } else {
      // If we are horizontal the width value comes from max width and height comes from min height
      Point(MAX_POINT.x, MIN_POINT.y + statusBarHeight)
    }
  }
}
