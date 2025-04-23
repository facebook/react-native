/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

/** ViewGroup that supports z-index. */
public interface ReactZIndexedViewGroup {
  /**
   * Determine the index of a child view at [index] considering z-index.
   *
   * @param index The child view index
   * @return The child view index considering z-index
   */
  public fun getZIndexMappedChildIndex(index: Int): Int

  /**
   * Redraw the view based on updated child z-index. This should be called after updating one of its
   * child z-index.
   */
  public fun updateDrawingOrder()
}
