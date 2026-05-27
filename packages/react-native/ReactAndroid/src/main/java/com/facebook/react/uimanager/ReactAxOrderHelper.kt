/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import android.view.ViewGroup
import com.facebook.react.R

/**
 * Helper object for managing accessibility order in React Native views.
 *
 * This object provides utilities to manage the accessibility focus order of views by storing and
 * restoring focusability states, and building ordered lists of views based on accessibility order
 * preferences.
 */
public object ReactAxOrderHelper {
  /**
   * Cleans up accessibility order state from a view and its children.
   *
   * This method removes stored focusability states and accessibility order parent references from
   * the view hierarchy. It recursively processes all children of ViewGroup instances.
   *
   * @param view The view from which to clean up accessibility order state
   */
  @JvmStatic
  public fun cleanUpAxOrder(view: View) {
    val originalFocusability = view.getTag(R.id.original_focusability) as Boolean?
    if (originalFocusability != null) {
      view.isFocusable = originalFocusability
    }

    val axOrderParent = view.getTag(R.id.accessibility_order_parent) as View?
    if (axOrderParent != null) {
      view.setTag(R.id.accessibility_order_parent, null)
    }

    if (view is ViewGroup) {
      for (i in 0..<view.childCount) {
        cleanUpAxOrder(view.getChildAt(i))
      }
    }
  }

  /**
   * Restores the original focusability state of a view and its children.
   *
   * This method traverses the view hierarchy and restores the focusability state that was
   * previously saved with the `R.id.original_focusability` tag. This is typically used after
   * accessibility order operations are complete to return views to their original state.
   *
   * @param view The view whose focusability state should be restored
   */
  @JvmStatic
  public fun restoreFocusability(view: View) {
    val originalFocusability = view.getTag(R.id.original_focusability) as Boolean?
    if (originalFocusability != null) {
      view.isFocusable = originalFocusability
    }

    if (view is ViewGroup) {
      for (i in 0..<view.childCount) {
        restoreFocusability(view.getChildAt(i))
      }
    }
  }

  /**
   * Disables focus for all views in the subtree that are not in the accessibility order list.
   *
   * This method recursively traverses the view hierarchy and disables focusability for views that
   * are not included in the provided accessibility order list. It stores the original focusability
   * state before modifying it, allowing for later restoration.
   *
   * @param view The root view of the subtree to process
   * @param axOrderList The list of native IDs that should maintain their focusability
   */
  public fun disableFocusForSubtree(view: View, axOrderList: MutableList<*>) {
    if (!axOrderList.contains(view.getTag(R.id.view_tag_native_id))) {
      if (view.getTag(R.id.original_focusability) == null) {
        view.setTag(R.id.original_focusability, view.isFocusable)
      }
      view.isFocusable = false
    }

    if (view is ViewGroup) {
      for (i in 0..<view.childCount) {
        disableFocusForSubtree(view.getChildAt(i), axOrderList)
      }
    }
  }

  /**
   * Builds an ordered list of views based on accessibility order preferences.
   *
   * This method recursively traverses the view hierarchy starting from the given view, looking for
   * views whose native IDs match entries in the accessibility order list. When matches are found,
   * views are placed in the result array at positions corresponding to their position in the
   * accessibility order list. This method also tags each view with its accessibility order parent.
   *
   * @param view The current view being processed in the hierarchy traversal
   * @param parent The parent view that defines the accessibility order context
   * @param axOrderList The list of native IDs defining the desired accessibility order
   * @param result The output array where views are placed according to their order in axOrderList
   */
  public fun buildAxOrderList(
      view: View,
      parent: View,
      axOrderList: MutableList<*>,
      result: Array<View?>,
  ) {
    val nativeId = view.getTag(R.id.view_tag_native_id)
    view.setTag(R.id.accessibility_order_parent, parent)

    if (axOrderList.contains(nativeId)) {
      val idx = axOrderList.indexOf(nativeId)
      if (idx != -1) {
        result[idx] = view
      }
    }

    if (view is ViewGroup) {
      for (i in 0..<view.childCount) {
        buildAxOrderList(view.getChildAt(i), parent, axOrderList, result)
      }
    }
  }
}
