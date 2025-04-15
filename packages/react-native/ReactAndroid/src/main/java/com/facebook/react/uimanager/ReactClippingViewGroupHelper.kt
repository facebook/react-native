/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Rect
import android.view.View
import javax.annotation.concurrent.NotThreadSafe

/**
 * Provides implementation of common tasks for view and it's view manager supporting property
 * [removeClippedSubviews].
 */
@NotThreadSafe
public object ReactClippingViewGroupHelper {

  public const val PROP_REMOVE_CLIPPED_SUBVIEWS: String = "removeClippedSubviews"

  private val helperRect: Rect = Rect()

  /**
   * Can be used by view that support [removeClippedSubviews] property to calculate area that given
   * [view] should be clipped to based on the clipping rectangle of it's parent in case when parent
   * is also set to clip it's children.
   *
   * @param view view that we want to calculate clipping rect for
   * @param outputRect where the calculated rectangle will be written
   */
  @JvmStatic
  public fun calculateClippingRect(view: View, outputRect: Rect): Unit {
    when (val parent = view.parent) {
      null -> {
        outputRect.setEmpty()
        return
      }
      is ReactClippingViewGroup -> {
        if (parent.removeClippedSubviews) {
          parent.getClippingRect(helperRect)
          // Intersect the view with the parent's rectangle
          if (!helperRect.intersect(
              view.left,
              view.top + view.translationY.toInt(),
              view.right,
              view.bottom + view.translationY.toInt())) {
            outputRect.setEmpty()
            return
          }
          // Move coordinates to View's coordinate space
          helperRect.offset(-view.left, -view.top)
          helperRect.offset(-view.translationX.toInt(), -view.translationY.toInt())
          helperRect.offset(view.scrollX, view.scrollY)
          outputRect.set(helperRect)
          return
        }
      }
    }
    view.getDrawingRect(outputRect)
  }
}
