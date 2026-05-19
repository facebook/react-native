/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Rect
import android.view.View

/**
 * Interface that should be implemented by [View] subclasses that support `overflow` style and want
 * to use the overflowInset values. This allows the overflow information to be used by
 * [TouchTargetHelper] to determine if a View is touchable.
 */
internal interface ReactOverflowViewWithInset : ReactOverflowView {
  /**
   * Get the overflow inset rect values which indicate the extensions to the boundaries of current
   * view that wraps all of its children views
   *
   * @return Rect of integers indicating the left, top, right, bottom pixel extensions. The values
   *   are non-positive (indicating enlarged boundaries).
   */
  val overflowInset: Rect

  /**
   * Set the overflow inset rect values which indicate the extensions to the boundaries of current
   * view that wraps all of its children views
   */
  fun setOverflowInset(left: Int, top: Int, right: Int, bottom: Int)
}
