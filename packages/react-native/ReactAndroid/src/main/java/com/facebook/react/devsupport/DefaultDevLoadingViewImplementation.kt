/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.Context
import android.graphics.Rect
import android.view.Gravity
import android.view.LayoutInflater
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.PopupWindow
import android.widget.TextView
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import java.util.Locale

/**
 * Default implementation of Dev Loading View Manager to display loading messages on top of the
 * screen. All methods are thread safe.
 */
public class DefaultDevLoadingViewImplementation(
    private val reactInstanceDevHelper: ReactInstanceDevHelper
) : DevLoadingViewManager {
  private var devLoadingView: TextView? = null
  private var devLoadingPopup: PopupWindow? = null

  override fun showMessage(message: String) {
    if (!isEnabled) {
      return
    }
    UiThreadUtil.runOnUiThread { showInternal(message) }
  }

  override fun updateProgress(status: String?, done: Int?, total: Int?) {
    if (!isEnabled) {
      return
    }
    UiThreadUtil.runOnUiThread {
      val percentage =
          if (done != null && total != null && total > 0)
              String.format(Locale.getDefault(), " %.1f%%", done.toFloat() / total * 100)
          else ""
      devLoadingView?.text =
          "${status ?: "Loading"}${percentage}\u2026" // `...` character at the end
    }
  }

  public override fun hide() {
    if (isEnabled) {
      UiThreadUtil.runOnUiThread { hideInternal() }
    }
  }

  private fun showInternal(message: String) {
    if (devLoadingPopup?.isShowing == true) {
      // already showing
      return
    }
    val currentActivity = reactInstanceDevHelper.currentActivity
    if (currentActivity == null) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to display loading message because react " + "activity isn't available")
      return
    }

    // PopupWindow#showAtLocation uses absolute screen position. In order for
    // loading view to be placed below status bar (if the status bar is present) we need to pass
    // an appropriate Y offset.
    try {
      val rectangle = Rect()
      currentActivity.window.decorView.getWindowVisibleDisplayFrame(rectangle)
      val topOffset = rectangle.top
      val inflater =
          currentActivity.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
      val view = inflater.inflate(R.layout.dev_loading_view, null) as TextView
      view.text = message
      val popup =
          PopupWindow(
              view, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
      popup.isTouchable = false
      popup.showAtLocation(currentActivity.window.decorView, Gravity.NO_GRAVITY, 0, topOffset)
      devLoadingView = view
      devLoadingPopup = popup
      // TODO T164786028: Find out the root cause of the BadTokenException exception here
    } catch (e: WindowManager.BadTokenException) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to display loading message because react activity isn't active, message: $message")
    }
  }

  private fun hideInternal() {
    val popup = devLoadingPopup ?: return
    if (popup.isShowing == true) {
      popup.dismiss()
      devLoadingPopup = null
      devLoadingView = null
    }
  }

  private val context: Context?
    get() = reactInstanceDevHelper.currentActivity

  public companion object {
    private var isEnabled = true

    public fun setDevLoadingEnabled(enabled: Boolean) {
      isEnabled = enabled
    }
  }
}
