/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.graphics.Color
import android.os.Build
import android.view.Window
import android.view.WindowManager
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.views.common.ContextUtils

internal val LightNavigationBarColor = Color.argb(0xe6, 0xFF, 0xFF, 0xFF)
internal val DarkNavigationBarColor = Color.argb(0x80, 0x1b, 0x1b, 0x1b)

@Suppress("DEPRECATION")
internal fun Window.setStatusBarTranslucency(isTranslucent: Boolean) {
  // If the status bar is translucent hook into the window insets calculations
  // and consume all the top insets so no padding will be added under the status bar.
  if (isTranslucent) {
    decorView.setOnApplyWindowInsetsListener { v, insets ->
      val defaultInsets = v.onApplyWindowInsets(insets)
      defaultInsets.replaceSystemWindowInsets(
          defaultInsets.systemWindowInsetLeft,
          0,
          defaultInsets.systemWindowInsetRight,
          defaultInsets.systemWindowInsetBottom)
    }
  } else {
    decorView.setOnApplyWindowInsetsListener(null)
  }
  ViewCompat.requestApplyInsets(decorView)
}

internal fun Window.setStatusBarVisibility(isHidden: Boolean) {
  WindowInsetsControllerCompat(this, decorView).apply {
    systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

    when (isHidden) {
      true -> hide(WindowInsetsCompat.Type.statusBars())
      else -> show(WindowInsetsCompat.Type.statusBars())
    }
  }
}

@Suppress("DEPRECATION")
internal fun Window.enableEdgeToEdge() {
  val isDarkMode = ContextUtils.isDarkMode(context)

  WindowCompat.setDecorFitsSystemWindows(this, false)

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    isStatusBarContrastEnforced = false
    isNavigationBarContrastEnforced = true
  }

  statusBarColor = Color.TRANSPARENT
  navigationBarColor =
    when {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q -> Color.TRANSPARENT
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !isDarkMode -> LightNavigationBarColor
      else -> DarkNavigationBarColor
    }

  WindowInsetsControllerCompat(this, this.decorView).run {
    isAppearanceLightNavigationBars = !isDarkMode
  }

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    attributes.layoutInDisplayCutoutMode =
      when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ->
          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
        else -> WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
      }
  }
}
