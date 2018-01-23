// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager;

/**
 * ViewGroup that supports z-index.
 */
public interface ReactZIndexedViewGroup {
  /**
   * Determine the index of a child view at {@param index} considering z-index.
   * @param index The child view index
   * @return The child view index considering z-index
   */
  int getZIndexMappedChildIndex(int index);

  /**
   * Redraw the view based on updated child z-index. This should be called after updating one of its child
   * z-index.
   */
  void updateDrawingOrder();
}
