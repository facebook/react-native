/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.touch;

import android.graphics.Rect;

import javax.annotation.Nullable;

/**
 * This interface should be implemented by all {@link View} subclasses that want to use the
 * hitSlop prop to extend their touch areas.
 */
public interface ReactHitSlopView {

  /**
   * Called when determining the touch area of a view.
   * @return A {@link Rect} representing how far to extend the touch area in each direction.
   */
  public @Nullable Rect getHitSlopRect();

}
