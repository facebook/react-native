/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.UiThreadUtil

/** Interface providing children management API for view managers of classes extending ViewGroup. */
public interface IViewGroupManager<T : View> : IViewManagerWithChildren {

  /** Adds a child view into the parent at the index specified as a parameter */
  public fun addView(parent: T, child: View, index: Int)

  /** @return child of the parent view at the index specified as a parameter. */
  public fun getChildAt(parent: T, index: Int): View?

  /** Removes View from the parent View at the index specified as a parameter. */
  public fun removeViewAt(parent: T, index: Int)

  /** Remove all child views from the parent View. */
  public fun removeAllViews(parent: T) {
    UiThreadUtil.assertOnUiThread()
    for (i in getChildCount(parent) - 1 downTo 0) {
      removeViewAt(parent, i)
    }
  }

  /** Return the amount of children contained by the view specified as a parameter. */
  public fun getChildCount(parent: T): Int
}
