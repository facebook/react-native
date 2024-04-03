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

public class ReactUnimplementedView : LinearLayout {

  private val textView: AppCompatTextView

  public constructor(context: Context) : super(context) {
    textView = AppCompatTextView(context)
    textView.layoutParams =
        LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.MATCH_PARENT)
    textView.gravity = Gravity.CENTER
    textView.setTextColor(Color.WHITE)

    setBackgroundColor(0x55ff0000)
    gravity = Gravity.CENTER_HORIZONTAL
    orientation = VERTICAL
    addView(textView)
  }

  public fun setName(name: String) {
    textView.text = "'$name' is not Fabric compatible yet."
  }
}
