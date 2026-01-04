/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.uimanager

import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.RectF
import android.view.View
import android.view.ViewParent
import androidx.annotation.UiThread
import com.facebook.react.bridge.UiThreadUtil

/** Utility for measuring a View's bounding box accounting for view transforms. */
public object ViewMeasureUtil {
  /**
   * Populates outputBuffer with `[x, y, width, height]` measured relative to the surface RootView.
   *
   * The resulting `x` and `y` are relative to the RootView's coordinate space (same space as
   * `pageX/pageY` in touch events).
   */
  @UiThread
  @JvmStatic
  public fun measureViewRelativeToRoot(view: View, outputBuffer: IntArray) {
    UiThreadUtil.assertOnUiThread()

    val rootView = RootViewUtil.getRootView(view) as? View
        ?: throw IllegalViewOperationException("Native view ${view.id} is no longer on screen")

    val rootBuffer = IntArray(4)
    computeBoundingBox(rootView, rootBuffer)
    val rootX = rootBuffer[0]
    val rootY = rootBuffer[1]

    computeBoundingBox(view, outputBuffer)
    outputBuffer[0] -= rootX
    outputBuffer[1] -= rootY
  }

  /**
   * Populates outputBuffer with `[x, y, width, height]` measured relative to the visible window.
   */
  @UiThread
  @JvmStatic
  public fun measureViewInWindow(view: View, outputBuffer: IntArray) {
    UiThreadUtil.assertOnUiThread()

    computeBoundingBox(view, outputBuffer)

    // Subtract window insets / split-screen offsets, matching Paper semantics.
    val visibleWindowFrame = Rect()
    view.getWindowVisibleDisplayFrame(visibleWindowFrame)
    outputBuffer[0] -= visibleWindowFrame.left
    outputBuffer[1] -= visibleWindowFrame.top
  }

  private fun computeBoundingBox(view: View, outputBuffer: IntArray) {
    val rect = RectF(0f, 0f, view.width.toFloat(), view.height.toFloat())
    mapRectFromViewToWindowCoords(view, rect)

    outputBuffer[0] = Math.round(rect.left)
    outputBuffer[1] = Math.round(rect.top)
    outputBuffer[2] = Math.round(rect.right - rect.left)
    outputBuffer[3] = Math.round(rect.bottom - rect.top)
  }

  private fun mapRectFromViewToWindowCoords(view: View, rect: RectF) {
    var matrix: Matrix = view.matrix
    if (!matrix.isIdentity) {
      matrix.mapRect(rect)
    }

    rect.offset(view.left.toFloat(), view.top.toFloat())

    var parent: ViewParent? = view.parent
    while (parent is View) {
      val parentView = parent

      rect.offset(-parentView.scrollX.toFloat(), -parentView.scrollY.toFloat())

      matrix = parentView.matrix
      if (!matrix.isIdentity) {
        matrix.mapRect(rect)
      }

      rect.offset(parentView.left.toFloat(), parentView.top.toFloat())

      parent = parentView.parent
    }
  }
}

