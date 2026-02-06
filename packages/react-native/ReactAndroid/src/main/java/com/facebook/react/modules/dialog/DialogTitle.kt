/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.dialog

import android.content.Context
import android.util.AttributeSet
import android.widget.TextView

/**
 * Reimplementation of Android's internal DialogTitle. This class will attempt to render titles on
 * two lines if they are too long, applying ellipsis as necessary.
 *
 * @see
 *   https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/core/java/com/android/internal/widget/DialogTitle.java
 */
internal class DialogTitle : TextView {

  constructor(
      context: Context,
      attrs: AttributeSet,
      defStyleAttr: Int,
      defStyleRes: Int,
  ) : super(context, attrs, defStyleAttr, defStyleRes)

  constructor(
      context: Context,
      attrs: AttributeSet,
      defStyleAttr: Int,
  ) : super(context, attrs, defStyleAttr)

  constructor(context: Context, attrs: AttributeSet) : super(context, attrs)

  constructor(context: Context) : super(context)

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    val layout = layout
    if (layout != null) {
      val lineCount = layout.lineCount
      if (lineCount > 0) {
        val ellipsisCount = layout.getEllipsisCount(lineCount - 1)
        if (ellipsisCount > 0) {
          isSingleLine = false
          maxLines = 2
          super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        }
      }
    }
  }
}
