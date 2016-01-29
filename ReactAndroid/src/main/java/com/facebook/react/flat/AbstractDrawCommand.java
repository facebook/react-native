/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import android.graphics.Canvas;

/**
 * Base class for all DrawCommands. Becomes immutable once it has its bounds set. Until then, a
 * subclass is able to mutate any of its properties (e.g. updating Layout in DrawTextLayout).
 *
 * The idea is to be able to reuse unmodified objects when we build up DrawCommands before we ship
 * them to UI thread, but we can only do that if DrawCommands are immutable.
 */
/* package */ abstract class AbstractDrawCommand implements DrawCommand, Cloneable {

  private float mLeft;
  private float mTop;
  private float mRight;
  private float mBottom;
  private float mClipLeft;
  private float mClipTop;
  private float mClipRight;
  private float mClipBottom;
  private boolean mFrozen;

  @Override
  public final void draw(FlatViewGroup parent, Canvas canvas) {
    onPreDraw(parent, canvas);
    if (shouldClip()) {
      canvas.save();
      canvas.clipRect(mClipLeft, mClipTop, mClipRight, mClipBottom);
      onDraw(canvas);
      canvas.restore();
    } else {
      onDraw(canvas);
    }
  }

  protected void onPreDraw(FlatViewGroup parent, Canvas canvas) {
  }

  /**
   * Updates boundaries of the AbstractDrawCommand and freezes it.
   * Will return a frozen copy if the current AbstractDrawCommand cannot be mutated.
   */
  public final AbstractDrawCommand updateBoundsAndFreeze(
      float left,
      float top,
      float right,
      float bottom,
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    if (mFrozen) {
      // see if we can reuse it
      boolean boundsMatch = boundsMatch(left, top, right, bottom);
      boolean clipBoundsMatch = clipBoundsMatch(clipLeft, clipTop, clipRight, clipBottom);
      if (boundsMatch && clipBoundsMatch) {
        return this;
      }

      try {
        AbstractDrawCommand copy = (AbstractDrawCommand) clone();
        if (!boundsMatch) {
          copy.setBounds(left, top, right, bottom);
        }
        if (!clipBoundsMatch) {
          copy.setClipBounds(clipLeft, clipTop, clipRight, clipBottom);
        }
        return copy;
      } catch (CloneNotSupportedException e) {
        // This should not happen since AbstractDrawCommand implements Cloneable
        throw new RuntimeException(e);
      }
    }

    setBounds(left, top, right, bottom);
    setClipBounds(clipLeft, clipTop, clipRight, clipBottom);
    mFrozen = true;
    return this;
  }

  /**
   * Returns a non-frozen shallow copy of AbstractDrawCommand as defined by {@link Object#clone()}.
   */
  public final AbstractDrawCommand mutableCopy() {
    try {
      AbstractDrawCommand copy = (AbstractDrawCommand) super.clone();
      copy.mFrozen = false;
      return copy;
    } catch (CloneNotSupportedException e) {
      // should not happen since we implement Cloneable
      throw new RuntimeException(e);
    }
  }

  /**
   * Returns whether this object was frozen and thus cannot be mutated.
   */
  public final boolean isFrozen() {
    return mFrozen;
  }

  /**
   * Left position of this DrawCommand relative to the hosting View.
   */
  public final float getLeft() {
    return mLeft;
  }

  /**
   * Top position of this DrawCommand relative to the hosting View.
   */
  public final float getTop() {
    return mTop;
  }

  /**
   * Right position of this DrawCommand relative to the hosting View.
   */
  public final float getRight() {
    return mRight;
  }

  /**
   * Bottom position of this DrawCommand relative to the hosting View.
   */
  public final float getBottom() {
    return mBottom;
  }

  protected abstract void onDraw(Canvas canvas);

  protected boolean shouldClip() {
    return mLeft < mClipLeft || mTop < mClipTop || mRight > mClipRight || mBottom > mClipBottom;
  }

  protected void onBoundsChanged() {
  }

  /**
   * Updates boundaries of this DrawCommand.
   */
  private void setBounds(float left, float top, float right, float bottom) {
    mLeft = left;
    mTop = top;
    mRight = right;
    mBottom = bottom;

    onBoundsChanged();
  }

  private void setClipBounds(float clipLeft, float clipTop, float clipRight, float clipBottom) {
    mClipLeft = clipLeft;
    mClipTop = clipTop;
    mClipRight = clipRight;
    mClipBottom = clipBottom;
  }

  /**
   * Returns true if boundaries match and don't need to be updated. False otherwise.
   */
  private boolean boundsMatch(float left, float top, float right, float bottom) {
    return mLeft == left && mTop == top && mRight == right && mBottom == bottom;
  }

  private boolean clipBoundsMatch(
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    return mClipLeft == clipLeft && mClipTop == clipTop &&
        mClipRight == clipRight && mClipBottom == clipBottom;
  }
}
