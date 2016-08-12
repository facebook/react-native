/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

/* package */ class NodeRegion {
  /* package */ static final NodeRegion[] EMPTY_ARRAY = new NodeRegion[0];
  /* package */ static final NodeRegion EMPTY = new NodeRegion(0, 0, 0, 0, -1, false);

  /* package */ final float mLeft;
  /* package */ final float mTop;
  /* package */ final float mRight;
  /* package */ final float mBottom;
  /* package */ final int mTag;
  /* package */ final boolean mIsVirtual;

  /* package */ NodeRegion(
      float left,
      float top,
      float right,
      float bottom,
      int tag,
      boolean isVirtual) {
    mLeft = left;
    mTop = top;
    mRight = right;
    mBottom = bottom;
    mTag = tag;
    mIsVirtual = isVirtual;
  }

  /* package */ final boolean matches(
      float left,
      float top,
      float right,
      float bottom,
      boolean isVirtual) {
    return left == mLeft && top == mTop && bottom == mBottom && right == mRight &&
        isVirtual == mIsVirtual;
  }

  /* package */ final boolean withinBounds(float touchX, float touchY) {
      return mLeft <= touchX && touchX < mRight && mTop <= touchY && touchY < mBottom;
  }

  /* package */ int getReactTag(float touchX, float touchY) {
    return mTag;
  }

  /* package */ boolean matchesTag(int tag) {
    return mTag == tag;
  }
}
