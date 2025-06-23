/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.os.Build
import android.view.Window
import android.view.WindowManager
import androidx.core.view.ViewCompat

@Suppress("DEPRECATION")
public fun Window.setStatusBarTranslucency(isTranslucent: Boolean) {
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

public fun Window.setStatusBarVisibility(isHidden: Boolean) {
  if (isHidden) {
    this.statusBarHide()
  } else {
    this.statusBarShow()
  }
}

@Suppress("DEPRECATION")
private fun Window.statusBarHide() {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    // Ensure the content extends into the cutout area
    attributes.layoutInDisplayCutoutMode =
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
    setDecorFitsSystemWindows(false)
  }
  addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
  clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
}

@Suppress("DEPRECATION")
private fun Window.statusBarShow() {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    attributes.layoutInDisplayCutoutMode =
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT
    setDecorFitsSystemWindows(true)
  }
  addFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
  clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
}
