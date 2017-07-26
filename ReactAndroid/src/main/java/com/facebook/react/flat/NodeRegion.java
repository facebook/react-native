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

  private final float mLeft;
  private final float mTop;
  private final float mRight;
  private final float mBottom;
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
    return left == mLeft && top == mTop && right == mRight && bottom == mBottom &&
        isVirtual == mIsVirtual;
  }

  /**
   * The left bound of the underlying node.
   *
   * @return The node bound.
   */
  /* package */ final float getLeft() {
    return mLeft;
  }

  /**
   * The top bound of the underlying node.
   *
   * @return The node bound.
   */
  /* package */ final float getTop() {
    return mTop;
  }

  /**
   * The right bound of the underlying node.
   *
   * @return The node bound.
   */
  /* package */ final float getRight() {
    return mRight;
  }

  /**
   * The bottom bound of the underlying node.
   *
   * @return The node bound.
   */
  /* package */ final float getBottom() {
    return mBottom;
  }

  /**
   * The left bound of the region for the purpose of touch.  This is usually the bound of the
   * underlying node, except in the case of hit slop.
   *
   * @return The touch bound.
   */
  /* package */ float getTouchableLeft() {
    return getLeft();
  }

  /**
   * The top bound of the region for the purpose of touch.  This is usually the bound of the
   * underlying node, except in the case of hit slop.
   *
   * @return The touch bound.
   */
  /* package */ float getTouchableTop() {
    return getTop();
  }

  /**
   * The right bound of the region for the purpose of touch.  This is usually the bound of the
   * underlying node, except in the case of hit slop.
   *
   * @return The touch bound.
   */
  /* package */ float getTouchableRight() {
    return getRight();
  }

  /**
   * The bottom bound of the region for the purpose of touch.  This is usually the bound of the
   * underlying node, except in the case of hit slop.
   *
   * @return The touch bound.
   */
  /* package */ float getTouchableBottom() {
    return getBottom();
  }

  /* package */ boolean withinBounds(float touchX, float touchY) {
    return mLeft <= touchX && touchX < mRight && mTop <= touchY && touchY < mBottom;
  }

  /* package */ int getReactTag(float touchX, float touchY) {
    return mTag;
  }

  /* package */ boolean matchesTag(int tag) {
    return mTag == tag;
  }
}
