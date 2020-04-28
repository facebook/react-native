/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.touch;

import android.graphics.Rect;
import androidx.annotation.Nullable;

/**
 * This interface should be implemented by all {@link View} subclasses that want to use the hitSlop
 * prop to extend their touch areas.
 */
public interface ReactHitSlopView {

  /**
   * Called when determining the touch area of a view.
   *
   * @return A {@link Rect} representing how far to extend the touch area in each direction.
   */
  @Nullable
  Rect getHitSlopRect();
}
