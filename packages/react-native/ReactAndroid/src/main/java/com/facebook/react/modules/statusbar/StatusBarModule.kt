/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.statusbar

import android.view.Window
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeStatusBarManagerAndroidSpec
import com.facebook.react.bridge.ExtraWindowEventListener
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.DisplayMetricsHolder.getStatusBarHeightPx
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn
import com.facebook.react.views.view.setStatusBarColor
import com.facebook.react.views.view.setStatusBarStyle
import com.facebook.react.views.view.setStatusBarTranslucency
import com.facebook.react.views.view.setStatusBarVisibility

/** [NativeModule] that allows changing the appearance of the status bar. */
@ReactModule(name = NativeStatusBarManagerAndroidSpec.NAME)
internal class StatusBarModule(reactContext: ReactApplicationContext?) :
    NativeStatusBarManagerAndroidSpec(reactContext), ExtraWindowEventListener {

  private val extraWindows = mutableSetOf<Window>()

  init {
    reactApplicationContext.addExtraWindowEventListener(this)
  }

  override fun invalidate() {
    super.invalidate()
    reactApplicationContext.removeExtraWindowEventListener(this)
  }

  override fun onExtraWindowCreated(window: Window) {
    extraWindows.add(window)

    UiThreadUtil.runOnUiThread {
      val controller = WindowCompat.getInsetsController(window, window.decorView)
      val insets = ViewCompat.getRootWindowInsets(window.decorView)
      val style = if (controller.isAppearanceLightStatusBars) "dark-content" else "light-content"
      val visible = insets?.isVisible(WindowInsetsCompat.Type.statusBars()) ?: true

      window.setStatusBarStyle(style)
      window.setStatusBarVisibility(!visible)
    }
  }

  override fun onExtraWindowDestroyed(window: Window) {
    extraWindows.remove(window)
  }

  @Suppress("DEPRECATION")
  override fun getTypedExportedConstants(): Map<String, Any> {
    val currentActivity = reactApplicationContext.currentActivity
    val statusBarColor =
        currentActivity?.window?.statusBarColor?.let { color ->
          String.format("#%06X", 0xFFFFFF and color)
        } ?: "black"
    return mapOf(
        HEIGHT_KEY to PixelUtil.toDIPFromPixel(getStatusBarHeightPx(currentActivity).toFloat()),
        DEFAULT_BACKGROUND_COLOR_KEY to statusBarColor,
    )
  }

  override fun setColor(colorDouble: Double, animated: Boolean) {
    val color = colorDouble.toInt()
    val activity = reactApplicationContext.getCurrentActivity()
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.",
      )
      return
    }
    if (isEdgeToEdgeFeatureFlagOn) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is edge-to-edge.",
      )
      return
    }
    UiThreadUtil.runOnUiThread { activity.window?.setStatusBarColor(color, animated) }
  }

  override fun setTranslucent(translucent: Boolean) {
    val activity = reactApplicationContext.getCurrentActivity()
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.",
      )
      return
    }
    if (isEdgeToEdgeFeatureFlagOn) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is edge-to-edge.",
      )
      return
    }
    UiThreadUtil.runOnUiThread { activity.window?.setStatusBarTranslucency(translucent) }
  }

  override fun setHidden(hidden: Boolean) {
    val activity = reactApplicationContext.getCurrentActivity()
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.",
      )
      return
    }
    UiThreadUtil.runOnUiThread {
      activity.window?.setStatusBarVisibility(hidden)
      extraWindows.forEach { it.setStatusBarVisibility(hidden) }
    }
  }

  override fun setStyle(style: String?) {
    val activity = reactApplicationContext.getCurrentActivity()
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.",
      )
      return
    }
    UiThreadUtil.runOnUiThread {
      activity.window?.setStatusBarStyle(style)
      extraWindows.forEach { it.setStatusBarStyle(style) }
    }
  }

  companion object {
    private const val HEIGHT_KEY = "HEIGHT"
    private const val DEFAULT_BACKGROUND_COLOR_KEY = "DEFAULT_BACKGROUND_COLOR"
    const val NAME: String = NativeStatusBarManagerAndroidSpec.NAME
  }
}
