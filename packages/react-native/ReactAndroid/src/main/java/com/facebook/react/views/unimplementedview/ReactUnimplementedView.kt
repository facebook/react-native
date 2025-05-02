/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.unimplementedview

import android.content.Context
import android.graphics.Color
import android.view.Gravity
import android.widget.LinearLayout
import androidx.appcompat.widget.AppCompatTextView
import com.facebook.react.common.build.ReactBuildConfig

internal class ReactUnimplementedView(context: Context) : LinearLayout(context) {

  private val textView: AppCompatTextView = AppCompatTextView(context)

  init {
    textView.layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT)
    textView.setGravity(Gravity.CENTER)
    textView.setTextColor(Color.WHITE)
    textView.text = ""

    if (ReactBuildConfig.DEBUG) {
      setBackgroundColor(0x55ff0000)
    }
    gravity = Gravity.CENTER_HORIZONTAL
    orientation = VERTICAL
    addView(textView)
  }

  internal fun setName(name: String) {
    if (ReactBuildConfig.DEBUG) {
      textView.text = "'$name' is not registered."
    }
  }
}
