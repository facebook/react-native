/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.R
import com.facebook.react.bridge.ReadableArray

private object ReactAxOrderHelper {
  @JvmStatic
  public fun setCustomAccessibilityFocusOrder(host: View) {

    val axOrderIds = host.getTag(R.id.accessibility_order) as ReadableArray?

    if (axOrderIds == null || axOrderIds.size() == 0) {
      return
    }

    val axOrderIdsList = mutableListOf<String>()
    val axOrderSet: MutableSet<String> = HashSet()
    for (i in 0 until axOrderIds.size()) {
      val id = axOrderIds.getString(i)
      if (id != null) {
        axOrderIdsList.add(id)
        axOrderSet.add(axOrderIdsList[i])
      }
    }

    val axOrderViews = processAxOrderTree(host, axOrderIdsList, axOrderSet).filterNotNull()

    // Set up traversal order between views
    for (i in 0 until axOrderViews.size - 1) {
      val currentView = axOrderViews[i]
      val flowToView = axOrderViews[i + 1]

      currentView.setTag(R.id.accessibility_order_flow_to, flowToView)
    }
  }

  @JvmStatic
  public fun applyFlowToTraversal(host: View, info: AccessibilityNodeInfoCompat) {
    val flowTo = host.getTag(R.id.accessibility_order_flow_to) as View?

    if (flowTo != null) {
      info.setTraversalBefore(flowTo)
    }
  }

  @JvmStatic
  public fun unsetAccessibilityOrder(view: View) {
    view.setTag(R.id.accessibility_order_flow_to, null)
    // Restore original accessibility importance if it was saved
    val originalImportance = view.getTag(R.id.original_important_for_ax) as Int?
    if (originalImportance != null) {
      view.importantForAccessibility = originalImportance
    }

    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        unsetAccessibilityOrder(view.getChildAt(i))
      }
    }
  }

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
  private fun processAxOrderTree(
      root: View,
      axOrderIds: List<String?>,
      axOrderSet: Set<String?>
  ): Array<View?> {
    val axOrderViews = arrayOfNulls<View?>(axOrderIds.size)

    fun traverseAndDisableAxFromExcludedViews(
        view: View,
        parent: View,
        hasCooptingAncestor: Boolean
    ) {
      val nativeId = view.getTag(R.id.view_tag_native_id) as String?

      val isIncluded = nativeId != null && axOrderSet.contains(nativeId)

      if (nativeId != null) {
        view.setTag(R.id.accessibility_order_parent, parent)
        ReactAccessibilityDelegate.setDelegate(
            view, view.isFocusable, view.importantForAccessibility)
      }

      // There is a strange bug with TalkBack where if a focused view has nothing to announce, and
      // there are no accessibility node's below it, then it will run OCR model on its bounds and
      // announce any text it sees. Also, if there is a TextView below the View backing the node,
      // it will announce that text too. This can happen frequently with our implementation here
      // we change importantForAccessibility for TextView's that are not included in
      // accessibilityOrder thus kicking off the logic described. To avoid this double announcement
      // we just do not set importantForAccessibility on TextView's in the case where someone is
      // coopting them. We will not focus the text since they got coopted.
      if (isIncluded) {
        axOrderViews[axOrderIds.indexOf(nativeId)] = view
      } else if (!(view is TextView && hasCooptingAncestor)) {
        // Save original state before disabling
        view.setTag(R.id.original_important_for_ax, view.importantForAccessibility)
        view.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
      }

      val wantsToCoopt = isIncluded && view.contentDescription.isNullOrEmpty()

      if (view is ViewGroup) {
        // Continue to try to disable children if this view is not included and is
        // focusable. This view being focusable means it's an element, and not a container which
        // means its presence doesn't imply all its children should be focusable. And if its not
        // included we still want to attempt to disable the children of the container
        if (!isIncluded || view.isFocusable()) {
          for (i in 0 until view.childCount) {
            traverseAndDisableAxFromExcludedViews(view.getChildAt(i), parent, wantsToCoopt)
          }
        }
      }
    }

    // Technically we don't know if there is a coopting ancestor here, as it could be above the root
    // but those cases should be fairly rare
    traverseAndDisableAxFromExcludedViews(root, root, false)

    return axOrderViews
  }
}
