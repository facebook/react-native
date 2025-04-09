/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import android.view.ViewGroup
import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants

/** Helper to handle implementing ViewGroups with custom drawing order based on z-index. */
public class ViewGroupDrawingOrderHelper(private val viewGroup: ViewGroup) {
  private var numberOfChildrenWithZIndex = 0
  private var drawingOrderIndices: IntArray? = null

  /**
   * This should be called every time a view is added to the ViewGroup in [ViewGroup.addView].
   *
   * @param view The view that is being added
   */
  public fun handleAddView(view: View) {
    if (ViewGroupManager.getViewZIndex(view) != null) {
      numberOfChildrenWithZIndex++
    }

    drawingOrderIndices = null
  }

  /**
   * This should be called every time a view is removed from the ViewGroup in [ViewGroup.removeView]
   * and [ViewGroup.removeViewAt].
   *
   * @param view The view that is being removed.
   */
  public fun handleRemoveView(view: View?) {
    if (ViewGroupManager.getViewZIndex(view) != null) {
      numberOfChildrenWithZIndex--
    }

    drawingOrderIndices = null
  }

  /**
   * If the ViewGroup should enable drawing order. ViewGroups should call
   * [ViewGroup.setChildrenDrawingOrderEnabled] with the value returned from this method when a view
   * is added or removed.
   */
  public fun shouldEnableCustomDrawingOrder(): Boolean = numberOfChildrenWithZIndex > 0

  /**
   * The index of the child view that should be drawn. This should be used in
   * [ViewGroup.getChildDrawingOrder].
   */
  public fun getChildDrawingOrder(childCount: Int, index: Int): Int {
    var currentDrawingOrderIndices = this.drawingOrderIndices
    if (currentDrawingOrderIndices != null &&
        (index >= currentDrawingOrderIndices.size ||
            currentDrawingOrderIndices[index] >= childCount)) {
      FLog.w(
          ReactConstants.TAG,
          "getChildDrawingOrder index out of bounds! Please check any custom view manipulations you" +
              " may have done. childCount = %d, index = %d",
          childCount,
          index)
      update()
    }

    if (currentDrawingOrderIndices == null) {
      val viewsToSort = ArrayList<View>()
      for (i in 0 until childCount) {
        viewsToSort.add(viewGroup.getChildAt(i))
      }

      // Sort the views by zIndex
      viewsToSort.sortWith(
          Comparator { view1, view2 ->
            val view1ZIndex = ViewGroupManager.getViewZIndex(view1) ?: 0
            val view2ZIndex = ViewGroupManager.getViewZIndex(view2) ?: 0
            view1ZIndex - view2ZIndex
          })

      currentDrawingOrderIndices = IntArray(childCount)
      for (i in 0 until childCount) {
        val child = viewsToSort[i]
        currentDrawingOrderIndices[i] = viewGroup.indexOfChild(child)
      }

      this.drawingOrderIndices = currentDrawingOrderIndices
    }

    return currentDrawingOrderIndices[index]
  }

  /** Recheck all children for z-index changes. */
  public fun update() {
    numberOfChildrenWithZIndex = 0
    for (i in 0 until viewGroup.childCount) {
      val child = viewGroup.getChildAt(i)
      if (ViewGroupManager.getViewZIndex(child) != null) {
        numberOfChildrenWithZIndex++
      }
    }
    drawingOrderIndices = null
  }
}
