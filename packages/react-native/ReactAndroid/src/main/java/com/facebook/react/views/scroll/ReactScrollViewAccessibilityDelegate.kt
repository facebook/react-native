/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.R
import com.facebook.react.bridge.AssertionException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole

internal class ReactScrollViewAccessibilityDelegate : AccessibilityDelegateCompat() {

  private val TAG: String = ReactScrollViewAccessibilityDelegate::class.java.simpleName

  override fun onInitializeAccessibilityEvent(host: View, event: AccessibilityEvent) {
    super.onInitializeAccessibilityEvent(host, event)
    if (host is ReactAccessibleScrollView) {
      onInitializeAccessibilityEventInternal(host, event)
    } else {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          AssertionException(
              "ReactScrollViewAccessibilityDelegate should only be used with ReactAccessibleScrollView, not with class: ${host.javaClass.simpleName}"
          ),
      )
    }
  }

  override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
    super.onInitializeAccessibilityNodeInfo(host, info)
    if (host is ReactAccessibleScrollView) {
      onInitializeAccessibilityNodeInfoInternal(host, info)
    } else {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          AssertionException(
              "ReactScrollViewAccessibilityDelegate should only be used with ReactAccessibleScrollView, not with class: ${host.javaClass.simpleName}"
          ),
      )
    }
  }

  private fun onInitializeAccessibilityEventInternal(view: View, event: AccessibilityEvent) {
    val accessibilityCollection =
        view.getTag(R.id.accessibility_collection) as? ReadableMap ?: return

    event.itemCount = accessibilityCollection.getInt("itemCount")

    val contentView = (view as? ViewGroup)?.getChildAt(0) as? ViewGroup ?: return

    var firstVisibleIndex: Int? = null
    var lastVisibleIndex: Int? = null

    for (index in 0..<contentView.childCount) {
      val nextChild = contentView.getChildAt(index)
      val isVisible: Boolean =
          if (view is ReactAccessibleScrollView) {
            view.isPartiallyScrolledInView(nextChild)
          } else {
            return
          }
      val accessibilityCollectionItemRange = findAccessibilityCollectionItemRange(nextChild)

      if (isVisible && accessibilityCollectionItemRange != null) {
        if (firstVisibleIndex == null) {
          firstVisibleIndex = accessibilityCollectionItemRange.first
        }
        lastVisibleIndex = accessibilityCollectionItemRange.second
      }

      if (firstVisibleIndex != null && lastVisibleIndex != null) {
        event.fromIndex = firstVisibleIndex
        event.toIndex = lastVisibleIndex
      }
    }
  }

  private fun findAccessibilityCollectionItemRange(view: View): Pair<Int, Int>? {
    val accessibilityCollectionItem =
        view.getTag(R.id.accessibility_collection_item) as? ReadableMap
    if (accessibilityCollectionItem != null) {
      val itemIndex = accessibilityCollectionItem.getInt("itemIndex")
      return Pair(itemIndex, itemIndex)
    }

    if (view !is ViewGroup) {
      return null
    }

    var firstItemIndex: Int? = null
    var lastItemIndex: Int? = null
    for (index in 0..<view.childCount) {
      val childItemRange =
          findAccessibilityCollectionItemRange(view.getChildAt(index)) ?: continue
      if (firstItemIndex == null) {
        firstItemIndex = childItemRange.first
      }
      lastItemIndex = childItemRange.second
    }

    return if (firstItemIndex != null && lastItemIndex != null) {
      Pair(firstItemIndex, lastItemIndex)
    } else {
      null
    }
  }

  private fun onInitializeAccessibilityNodeInfoInternal(
      view: View,
      info: AccessibilityNodeInfoCompat,
  ) {
    val accessibilityRole = AccessibilityRole.fromViewTag(view)

    if (accessibilityRole != null) {
      ReactAccessibilityDelegate.setRole(info, accessibilityRole, view.context)
    }

    val accessibilityCollection = view.getTag(R.id.accessibility_collection) as? ReadableMap

    if (accessibilityCollection != null) {
      val rowCount = accessibilityCollection.getInt("rowCount")
      val columnCount = accessibilityCollection.getInt("columnCount")
      val hierarchical = accessibilityCollection.getBoolean("hierarchical")

      val collectionInfoCompat =
          AccessibilityNodeInfoCompat.CollectionInfoCompat.obtain(
              rowCount,
              columnCount,
              hierarchical,
          )
      info.setCollectionInfo(collectionInfoCompat)
    }

    if (view is ReactAccessibleScrollView) {
      info.isScrollable = view.scrollEnabled
    }
  }
}
