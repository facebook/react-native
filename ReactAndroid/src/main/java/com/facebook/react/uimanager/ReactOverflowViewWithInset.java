/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.graphics.Rect;
import android.view.View;

/**
 * Interface that should be implemented by {@link View} subclasses that support {@code overflow}
 * style and want to use the overflowInset values. This allows the overflow information to be used
 * by {@link TouchTargetHelper} to determine if a View is touchable.
 */
public interface ReactOverflowViewWithInset extends ReactOverflowView {
  /**
   * Get the overflow inset rect values which indicate the extensions to the boundaries of current
   * view that wraps all of its children views
   *
   * @return Rect of integers indicating the left, top, right, bottom pixel extensions. The values
   *     are non-positive (indicating enlarged boundaries).
   */
  Rect getOverflowInset();

  /**
   * Set the overflow inset rect values which indicate the extensions to the boundaries of current
   * view that wraps all of its children views
   */
  void setOverflowInset(int left, int top, int right, int bottom);
}
