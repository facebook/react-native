/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;

/** Interface providing children management API for view managers of classes extending ViewGroup. */
public interface IViewGroupManager<T extends View> extends IViewManagerWithChildren {

  /** Adds a child view into the parent at the index specified as a parameter */
  void addView(T parent, View child, int index);

  /** @return child of the parent view at the index specified as a parameter. */
  View getChildAt(T parent, int index);

  /** Removes View from the parent View at the index specified as a parameter. */
  void removeViewAt(T parent, int index);

  /** Return the amount of children contained by the view specified as a parameter. */
  int getChildCount(T parent);
}
