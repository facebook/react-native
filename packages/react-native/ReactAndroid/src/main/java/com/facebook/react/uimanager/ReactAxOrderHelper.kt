/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Rect
import android.view.View
import android.view.ViewGroup
import com.facebook.react.R
import com.facebook.react.bridge.ReadableArray

private object ReactAxOrderHelper {
  /**
   * Processes the View tree that begins at the View with AccessibilityOrder set
   *
   * Disables accessibility for views not included in the specified accessibility order.
   *
   * This method emulates iOS's focusing order behavior to facilitate cross-platform code sharing.
   * It disables accessibility for views that are either not part of the accessibility order or
   * don't have a container that belongs to the accessibility order.
   *
   * The container/element concept is borrowed from iOS, where a "container" is a non-accessible
   * view with children, and an "element" is any accessible view.
   *
   * @return an array of views following the accessibility order
   */
  @JvmStatic
  fun processAxOrderTree(
      root: View,
      axOrderIds: MutableList<String?>,
      axOrderSet: MutableSet<String?>
  ): List<View> {
    val axOrderViews = Array(axOrderIds.size) { mutableListOf<View?>() }.toMutableList()

    fun traverseAndBuildAxOrder(parent: View, view: View, containerId: String?) {
      val nativeId = view.getTag(R.id.view_tag_native_id) as String?

      val isContained = (containerId != null && axOrderSet.contains(containerId))
      val isIncluded = (nativeId != null && axOrderSet.contains(nativeId))

      val isNestedAxOrder = view.getTag(R.id.accessibility_order) != null && view != parent

      if (isIncluded && view.isFocusable) {
        axOrderViews[axOrderIds.indexOf(nativeId)].add(view)
        if (parent != view) {
          view.setTag(R.id.accessibility_order_parent, parent)
        }
      } else if (isContained && view.isFocusable) {
        axOrderViews[axOrderIds.indexOf(containerId)].add(view)
        if (parent != view) {
          view.setTag(R.id.accessibility_order_parent, parent)
        }
      }

      if (isNestedAxOrder) {
        val nestedOrder = view.getTag(R.id.accessibility_order) as ReadableArray
        for (i in 0 until nestedOrder.size()) {
          val id = nestedOrder.getString(i)
          if (id != null) {
            val insertIdx = axOrderIds.indexOf(nativeId) + 1
            if (insertIdx < axOrderIds.size) {
              axOrderIds.add(axOrderIds.indexOf(nativeId) + 1 + i, id)
              axOrderViews.add(axOrderIds.indexOf(nativeId) + 1 + i, mutableListOf())
            } else {
              axOrderIds.add(id)
              axOrderViews.add(mutableListOf())
            }

            axOrderSet.add(id)
          }
        }
      }

      // Don't traverse the children of a nested accessibility order
      if (view is ViewGroup) {
        val axChildren: ArrayList<View> = getAxChildren(view)

        // If the View is a "container" (Not focusable but is included in the order) We add all its
        // children to the order.
        if (containerId != null) {
          for (i in 0 until axChildren.size) {
            traverseAndBuildAxOrder(parent, axChildren[i], containerId)
          }
        } else if (!view.isFocusable && isIncluded) {
          for (i in 0 until axChildren.size) {
            traverseAndBuildAxOrder(parent, axChildren[i], nativeId)
          }
        } else {
          for (i in 0 until axChildren.size) {
            traverseAndBuildAxOrder(parent, axChildren[i], null)
          }
        }
      }

      if (!isIncluded && !isContained && parent != view) {
        if (view.getTag(R.id.original_focusability) == null) {
          view.setTag(R.id.original_focusability, view.isFocusable)
        }
        view.isFocusable = false
      }
    }

    traverseAndBuildAxOrder(
        root,
        root,
        null,
    )

    val result = mutableListOf<View>()
    for (viewList in axOrderViews) {
      for (view in viewList) {
        if (view != null) {
          result.add(view)
        }
      }
    }

    root.setTag(R.id.accessibility_order_dirty, false)

    return result
  }

  @JvmStatic
  fun getVirtualViewBounds(host: View, virtualView: View): Rect {
    var currentView: View = virtualView
    val viewBoundsInParent =
        Rect(virtualView.left, virtualView.top, virtualView.right, virtualView.bottom)
    while (currentView.parent != host && currentView != host) {
      val parent = currentView.parent as View
      viewBoundsInParent.top += parent.top
      viewBoundsInParent.bottom += parent.top
      viewBoundsInParent.left += parent.left
      viewBoundsInParent.right += parent.left
      currentView = parent
    }

    return viewBoundsInParent
  }

  private fun getAxChildren(host: ViewGroup): ArrayList<View> {
    val axChildren: ArrayList<View> = ArrayList()

    // When host has an accessibilityNodeProvider it means the order is not default so ViewGroup's
    // method bails, in this case we should just add the children to the node in the edge case where
    // we need to coopt at accessibilityOrderParent level
    if (host.accessibilityNodeProvider != null) {
      for (i in 0 until host.childCount) {
        val child = host.getChildAt(i)
        if (child != null) {
          axChildren.add(child)
        }
      }
    } else {
      // This extracts the children of host sorted in accessibility order, this is by layout
      // top to bottom, left to right
      host.addChildrenForAccessibility(axChildren)
    }
    return axChildren
  }

  @JvmStatic
  public fun restoreSubtreeFocusability(view: View) {
    val originalFocusability = view.getTag(R.id.original_focusability)
    if (originalFocusability is Boolean) {
      view.isFocusable = originalFocusability
    }

    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        val child = view.getChildAt(i)
        if (child != null) {
          restoreSubtreeFocusability(child)
        }
      }
    }
  }
}
