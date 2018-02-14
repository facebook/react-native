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
 * NodeRegion that has a hit slop.
 */
/* package */ final class HitSlopNodeRegion extends NodeRegion {

  private final Rect mHitSlop;

  HitSlopNodeRegion(
      Rect hitSlop,
      float left,
      float top,
      float right,
      float bottom,
      int tag,
      boolean isVirtual) {
    super(left, top, right, bottom, tag, isVirtual);
    mHitSlop = hitSlop;
  }

  @Override
  /* package */ float getTouchableLeft() {
    return getLeft() - mHitSlop.left;
  }

  @Override
  /* package */ float getTouchableTop() {
    return getTop() - mHitSlop.top;
  }

  @Override
  /* package */ float getTouchableRight() {
    return getRight() + mHitSlop.right;
  }

  @Override
  /* package */ float getTouchableBottom() {
    return getBottom() + mHitSlop.bottom;
  }

  @Override
  /* package */ boolean withinBounds(float touchX, float touchY) {
    return getTouchableLeft() <= touchX && touchX < getTouchableRight() &&
        getTouchableTop() <= touchY && touchY < getTouchableBottom();
  }
}
