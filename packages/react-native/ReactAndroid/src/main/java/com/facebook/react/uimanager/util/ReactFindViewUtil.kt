/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.util

import android.view.View
import android.view.ViewGroup
import com.facebook.react.R
import java.util.ArrayList
import java.util.HashMap

/** Finds views in React Native view hierarchies */
public object ReactFindViewUtil {

  private val onViewFoundListeners: MutableList<OnViewFoundListener> = ArrayList()
  private val onMultipleViewsFoundListener: MutableMap<OnMultipleViewsFoundListener, Set<String>> =
      HashMap()

  /** Callback to be invoked when a react native view has been found */
  public interface OnViewFoundListener {
    /** Returns the native id of the view of interest */
    public fun getNativeId(): String

    /**
     * Called when the view has been found
     *
     * @param view
     */
    public fun onViewFound(view: View)
  }

  /** Callback to be invoked when all react native views with geiven NativeIds have been found */
  public fun interface OnMultipleViewsFoundListener {
    public fun onViewFound(view: View, nativeId: String)
  }

  /**
   * Finds a view that is tagged with {@param nativeId} as its nativeID prop under the {@param root}
   * view hierarchy. Returns the view if found, null otherwise.
   *
   * @param root root of the view hierarchy from which to find the view
   */
  @JvmStatic
  public fun findView(root: View, nativeId: String): View? {
    if (getNativeId(root) == nativeId) {
      return root
    }

    if (root is ViewGroup) {
      for (i in 0..<root.childCount) {
        val view = findView(root.getChildAt(i), nativeId)
        if (view != null) {
          return view
        }
      }
    }

    return null
  }

  /**
   * Finds a view tagged with {@param onViewFoundListener}'s nativeID in the given {@param root}
   * view hierarchy. If the view does not exist yet due to React Native's async layout, a listener
   * will be added. When the view is found, the {@param onViewFoundListener} will be invoked.
   *
   * @param root root of the view hierarchy from which to find the view
   */
  @JvmStatic
  public fun findView(root: View, onViewFoundListener: OnViewFoundListener) {
    val view = findView(root, onViewFoundListener.getNativeId())
    if (view != null) {
      onViewFoundListener.onViewFound(view)
    }
    addViewListener(onViewFoundListener)
  }

  /**
   * Registers an OnViewFoundListener to be invoked when a view with a matching nativeID is found.
   * Remove this listener using removeViewListener() if it's no longer needed.
   */
  @JvmStatic
  public fun addViewListener(onViewFoundListener: OnViewFoundListener) {
    onViewFoundListeners.add(onViewFoundListener)
  }

  /** Removes an OnViewFoundListener previously registered with addViewListener(). */
  @JvmStatic
  public fun removeViewListener(onViewFoundListener: OnViewFoundListener) {
    onViewFoundListeners.remove(onViewFoundListener)
  }

  @JvmStatic
  public fun addViewsListener(listener: OnMultipleViewsFoundListener, ids: Set<String>) {
    onMultipleViewsFoundListener[listener] = ids
  }

  @JvmStatic
  public fun removeViewsListener(listener: OnMultipleViewsFoundListener) {
    onMultipleViewsFoundListener.remove(listener)
  }

  /** Invokes any listeners that are listening on this {@param view}'s native id */
  @JvmStatic
  public fun notifyViewRendered(view: View) {
    val nativeId = getNativeId(view) ?: return
    val iterator = onViewFoundListeners.iterator()
    while (iterator.hasNext()) {
      val listener = iterator.next()
      if (nativeId == listener.getNativeId()) {
        listener.onViewFound(view)
        iterator.remove()
      }
    }
    onMultipleViewsFoundListener.forEach { (listener, nativeIds) ->
      if (nativeId in nativeIds) {
        listener.onViewFound(view, nativeId)
      }
    }
  }

  private fun getNativeId(view: View): String? {
    val tag = view.getTag(R.id.view_tag_native_id)
    return tag as? String
  }
}
