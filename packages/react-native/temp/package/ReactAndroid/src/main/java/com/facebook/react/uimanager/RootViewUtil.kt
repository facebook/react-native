/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Point
import android.graphics.Rect
import android.view.View
import androidx.annotation.UiThread
import com.facebook.infer.annotation.Assertions

public object RootViewUtil {
  /** Returns the root view of a given view in a react application. */
  @JvmStatic
  public fun getRootView(reactView: View): RootView? {
    var current = reactView
    while (true) {
      if (current is RootView) {
        return current
      }
      val next = current.parent ?: return null
      Assertions.assertCondition(next is View)
      current = next as View
    }
  }

  @UiThread
  @JvmStatic
  public fun getViewportOffset(v: View): Point {
    val locationInWindow = IntArray(2)
    v.getLocationInWindow(locationInWindow)

    // we need to subtract visibleWindowCoords - to subtract possible window insets, split
    // screen or multi window
    val visibleWindowFrame = Rect()
    v.getWindowVisibleDisplayFrame(visibleWindowFrame)
    locationInWindow[0] -= visibleWindowFrame.left
    locationInWindow[1] -= visibleWindowFrame.top
    return Point(locationInWindow[0], locationInWindow[1])
  }
}
