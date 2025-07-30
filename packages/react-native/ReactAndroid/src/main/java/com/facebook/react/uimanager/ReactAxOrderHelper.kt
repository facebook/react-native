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

public object ReactAxOrderHelper {
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
