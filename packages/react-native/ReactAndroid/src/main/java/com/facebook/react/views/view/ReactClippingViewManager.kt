/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.view.View
import android.view.ViewGroup
import androidx.core.view.doOnDetach
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ReactClippingViewGroupHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import java.util.HashMap
import java.util.WeakHashMap

/**
 * View manager which handles clipped subviews. Useful for custom views which extends from
 * [com.facebook.react.views.view.ReactViewGroup]
 */
public abstract class ReactClippingViewManager<T : ReactViewGroup> : ViewGroupManager<T>() {

  @ReactProp(name = ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public open fun setRemoveClippedSubviews(view: T, removeClippedSubviews: Boolean) {
    UiThreadUtil.assertOnUiThread()

    view.removeClippedSubviews = removeClippedSubviews
  }

  // parent: childIndex[] - Used when we can't immediately add a view
  private val operationsMap = WeakHashMap<T, MutableMap<Int, Boolean>>()

  override fun addView(parent: T, child: View, index: Int) {
    UiThreadUtil.assertOnUiThread()

    if (child.parent != null) {
      operationsMap.getOrPut(parent) {
        mutableMapOf()
      }[index] = true

      // When the child-parent relation is removed, onDetachedFromWindow will be called.
      // Its important to wait for detaching as the view might be in a transition, and isn't removed immediately.
      child.doOnDetach {
        // Looking at how endViewTransition is implemented, dispatchDetachedFromWindow
        // gets called _before_ the parent relation is removed, so we need to post this to the end of the frame:
        child.post {
          if(operationsMap.remove(parent) == null) {
            // The addView operation was already countered by a removeView operation while we were waiting
            FLog.w("ReactClippingViewManager", "Tried to add a view to a parent after the child was detached, but a remove operation was already enqueued")
            return@post
          }
          FLog.w("ReactClippingViewManager", "addView(): ${child::class.java.simpleName} had a parent, removed from previous parent and after onDetach adding to new parent $parent")
          addViewInternal(parent, child, index)
        }
      }

      // With the detach listener in place, we can now remove the view from the previous parent:
      // Note: This call here is potentially redundant, as SurfaceMountingManager.kt is already removing it
      (child.parent as? ViewGroup)?.removeView(child)
    } else {
      addViewInternal(parent, child, index)
    }
  }

  private fun addViewInternal(parent: T, child: View, index: Int) {
    val removeClippedSubviews = parent.removeClippedSubviews
    if (removeClippedSubviews) {
      parent.addViewWithSubviewClippingEnabled(child, index)
    } else {
      parent.addView(child, index)
    }
  }

  override fun getChildCount(parent: T): Int {
    val removeClippedSubviews = parent.removeClippedSubviews
    return if (removeClippedSubviews) {
      parent.allChildrenCount
    } else {
      parent.childCount
    }
  }

  override fun getChildAt(parent: T, index: Int): View? {
    val removeClippedSubviews = parent.removeClippedSubviews
    return if (removeClippedSubviews) {
      parent.getChildAtWithSubviewClippingEnabled(index)
    } else {
      parent.getChildAt(index)
    }
  }

  override fun removeViewAt(parent: T, index: Int) {
    UiThreadUtil.assertOnUiThread()

    val removeClippedSubviews = parent.removeClippedSubviews
    if (removeClippedSubviews) {
      val child = getChildAt(parent, index)
      if (child != null) {
        parent.removeViewWithSubviewClippingEnabled(child)
      }
    } else {
      parent.removeViewAt(index)
    }
    operationsMap[parent]?.remove(index)
  }

  override fun removeAllViews(parent: T) {
    UiThreadUtil.assertOnUiThread()

    val removeClippedSubviews = parent.removeClippedSubviews
    if (removeClippedSubviews) {
      parent.removeAllViewsWithSubviewClippingEnabled()
    } else {
      parent.removeAllViews()
      operationsMap.remove(parent)
    }
  }
}
