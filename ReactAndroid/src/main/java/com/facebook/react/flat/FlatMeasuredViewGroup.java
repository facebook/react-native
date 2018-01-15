/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.graphics.Rect;

/**
 * Helper interface to provide measuring of FlatViewGroup when needed.  We don't override onMeasure
 * for FlatViewGroup, which means that draw commands don't contributed to the measured width and
 * height.  This allows us to expose our calculated dimensions taking into account draw commands,
 * without changing the visibility of the FlatViewGroup.
 */
public interface FlatMeasuredViewGroup {
  /**
   * @return A rect consisting of the left, top, right, and bottommost edge among all children,
   *   including draw commands.
   */
  Rect measureWithCommands();
}
