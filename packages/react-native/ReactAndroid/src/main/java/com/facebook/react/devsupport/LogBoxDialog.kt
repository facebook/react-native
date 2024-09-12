/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.app.Activity
import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.View
import android.view.Window
import android.widget.FrameLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.R

/** Dialog for displaying JS errors in LogBox. */
internal class LogBoxDialog(context: Activity, private val reactRootView: View?) :
    Dialog(context, R.style.Theme_Catalyst_LogBox) {
  init {
    requestWindowFeature(Window.FEATURE_NO_TITLE)
    if (reactRootView != null) {
      setContentView(reactRootView)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // set background color so it will show below transparent system bars on forced edge-to-edge
    this.window?.setBackgroundDrawable(ColorDrawable(Color.BLACK))
    // register insets listener to update margins on the ReactRootView to avoid overlap w/ system
    // bars
    reactRootView?.let { rootView ->
      val insetsType: Int =
          WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()

      val windowInsetsListener = { view: View, windowInsets: WindowInsetsCompat ->
        val insets = windowInsets.getInsets(insetsType)

        (view.layoutParams as FrameLayout.LayoutParams).apply {
          setMargins(insets.left, insets.top, insets.right, insets.bottom)
        }

        WindowInsetsCompat.CONSUMED
      }
      ViewCompat.setOnApplyWindowInsetsListener(rootView, windowInsetsListener)
    }
  }
}
