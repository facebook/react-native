/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.statusbar

import android.animation.ArgbEvaluator
import android.animation.ValueAnimator
import android.os.Build
import android.view.View
import android.view.WindowInsetsController
import android.view.WindowManager
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeStatusBarManagerAndroidSpec
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PixelUtil

/** [NativeModule] that allows changing the appearance of the status bar. */
@ReactModule(name = NativeStatusBarManagerAndroidSpec.NAME)
public class StatusBarModule(reactContext: ReactApplicationContext?) :
    NativeStatusBarManagerAndroidSpec(reactContext) {

  @Suppress("DEPRECATION")
  override fun getTypedExportedConstants(): Map<String, Any> {
    val statusBarColor =
        currentActivity?.window?.statusBarColor?.let { color ->
          String.format("#%06X", 0xFFFFFF and color)
        } ?: "black"
    return mapOf(
        HEIGHT_KEY to PixelUtil.toDIPFromPixel(getStatusBarHeightPx()),
        DEFAULT_BACKGROUND_COLOR_KEY to statusBarColor,
    )
  }

  @Suppress("DEPRECATION")
  private fun getStatusBarHeightPx(): Float {
    val windowInsets =
        currentActivity?.window?.decorView?.let(ViewCompat::getRootWindowInsets) ?: return 0f
    return windowInsets
        .getInsets(
            WindowInsetsCompat.Type.statusBars() or
                WindowInsetsCompat.Type.navigationBars() or
                WindowInsetsCompat.Type.displayCutout())
        .top
        .toFloat()
  }

  @Suppress("DEPRECATION")
  override fun setColor(colorDouble: Double, animated: Boolean) {
    val color = colorDouble.toInt()
    val activity = currentActivity
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.")
      return
    }
    UiThreadUtil.runOnUiThread(
        object : GuardedRunnable(reactApplicationContext) {
          override fun runGuarded() {
            val window = activity.window ?: return
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
            if (animated) {
              val curColor = window.statusBarColor
              val colorAnimation = ValueAnimator.ofObject(ArgbEvaluator(), curColor, color)
              colorAnimation.addUpdateListener { animator ->
                activity.window?.statusBarColor = (animator.animatedValue as Int)
              }
              colorAnimation.setDuration(300).startDelay = 0
              colorAnimation.start()
            } else {
              window.statusBarColor = color
            }
          }
        })
  }

  @Suppress("DEPRECATION")
  override fun setTranslucent(translucent: Boolean) {
    val activity = currentActivity
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.")
      return
    }
    UiThreadUtil.runOnUiThread(
        object : GuardedRunnable(reactApplicationContext) {
          override fun runGuarded() {
            // If the status bar is translucent hook into the window insets calculations
            // and consume all the top insets so no padding will be added under the status bar.
            val window = activity.window ?: return
            val decorView = window.decorView
            if (translucent) {
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
        })
  }

  @Suppress("DEPRECATION")
  override fun setHidden(hidden: Boolean) {
    val activity = currentActivity
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.")
      return
    }
    UiThreadUtil.runOnUiThread(
        Runnable {
          val window = activity.window ?: return@Runnable
          if (hidden) {
            window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
            window.clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
          } else {
            window.addFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
            window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
          }
        })
  }

  @Suppress("DEPRECATION")
  override fun setStyle(style: String?) {
    val activity = currentActivity
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.")
      return
    }
    UiThreadUtil.runOnUiThread(
        Runnable {
          val window = activity.window ?: return@Runnable
          if (Build.VERSION.SDK_INT > Build.VERSION_CODES.R) {
            val insetsController = window.insetsController ?: return@Runnable
            if ("dark-content" == style) {
              // dark-content means dark icons on a light status bar
              insetsController.setSystemBarsAppearance(
                  WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
                  WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS)
            } else {
              insetsController.setSystemBarsAppearance(
                  0, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS)
            }
          } else {
            val decorView = window.decorView
            var systemUiVisibilityFlags = decorView.systemUiVisibility
            systemUiVisibilityFlags =
                if ("dark-content" == style) {
                  systemUiVisibilityFlags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                } else {
                  systemUiVisibilityFlags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
                }
            decorView.systemUiVisibility = systemUiVisibilityFlags
          }
        })
  }

  public companion object {
    private const val HEIGHT_KEY = "HEIGHT"
    private const val DEFAULT_BACKGROUND_COLOR_KEY = "DEFAULT_BACKGROUND_COLOR"
    public const val NAME: String = NativeStatusBarManagerAndroidSpec.NAME
  }
}
