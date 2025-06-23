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

public class ReactUnimplementedView(context: Context) : LinearLayout(context) {

  private val textView: AppCompatTextView

  init {
    textView = AppCompatTextView(context)
    textView.layoutParams =
        LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.MATCH_PARENT)
    textView.setGravity(Gravity.CENTER)
    textView.setTextColor(Color.WHITE)

    setBackgroundColor(0x55ff0000)
    setGravity(Gravity.CENTER_HORIZONTAL)
    setOrientation(LinearLayout.VERTICAL)
    addView(textView)
  }

  public fun setName(name: String) {
    textView.setText("'$name' is not Fabric compatible yet.")
  }
}
