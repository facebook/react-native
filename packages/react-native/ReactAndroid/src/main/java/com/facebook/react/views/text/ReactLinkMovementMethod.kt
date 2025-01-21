/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Selection
import android.text.Spannable
import android.text.method.LinkMovementMethod
import android.view.MotionEvent
import android.widget.TextView

internal object ReactLinkMovementMethod : LinkMovementMethod() {
  override fun onTouchEvent(widget: TextView, buffer: Spannable, event: MotionEvent): Boolean {
    val result = super.onTouchEvent(widget, buffer, event)
    Selection.removeSelection(buffer)
    return result
  }
}
