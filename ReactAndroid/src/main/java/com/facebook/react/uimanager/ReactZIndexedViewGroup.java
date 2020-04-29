/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

/** ViewGroup that supports z-index. */
public interface ReactZIndexedViewGroup {
  /**
   * Determine the index of a child view at {@param index} considering z-index.
   *
   * @param index The child view index
   * @return The child view index considering z-index
   */
  int getZIndexMappedChildIndex(int index);

  /**
   * Redraw the view based on updated child z-index. This should be called after updating one of its
   * child z-index.
   */
  void updateDrawingOrder();
}
