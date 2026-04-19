/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.common.annotations.internal.LegacyArchitecture

/**
 * ViewGroup that supports z-index.
 *
 * This interface is part of the legacy architecture. CustomDrawOrder is no longer used when Fabric
 * is enabled, which is now everywhere. Z-order is managed at the C++ layer, and no re-ordering is
 * needed in the Android View layer. This interface is kept for backward compatibility but should
 * not be used in new code.
 */
@LegacyArchitecture
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
