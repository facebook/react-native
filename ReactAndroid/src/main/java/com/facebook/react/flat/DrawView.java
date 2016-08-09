/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.graphics.Canvas;
import android.graphics.Path;
import android.graphics.RectF;

/* package */ final class DrawView extends AbstractDrawCommand {
  public static final DrawView[] EMPTY_ARRAY = new DrawView[0];
  // the minimum rounded clipping value before we actually do rounded clipping
  /* package */ static final float MINIMUM_ROUNDED_CLIPPING_VALUE = 0.5f;
  private final RectF TMP_RECT = new RectF();

  /* package */ final int reactTag;
  // Indicates whether this DrawView has been previously mounted to a clipping FlatViewGroup.  This
  // lets us know that the bounds haven't changed, as a bounds change would trigger a new DrawView,
  // which will set this to false for the new DrawView.  This is safe, despite the dual access with
  // FlatViewGroup, because the FlatViewGroup copy is only ever modified by the FlatViewGroup.
  // Changing how this boolean is used should be handled with caution, as race conditions are the
  // quickest way to create unreproducible super bugs.
  /* package */ boolean mWasMounted;

  // the clipping radius - if this is greater than MINIMUM_ROUNDED_CLIPPING_VALUE, we clip using
  // a rounded path, otherwise we clip in a rectangular fashion.
  private float mClipRadius;

  // the path to clip against if we're doing path clipping for rounded borders.
  @Nullable private Path mPath;

  // These should only ever be set from within the DrawView, they serve to provide clipping bounds
  // for FlatViewGroups, which have strange clipping when it comes to overflow: visible.  They are
  // left package protected to speed up direct access.  For overflow visible, these are the adjusted
  // bounds while taking overflowing elements into account, other wise they are just the regular
  // bounds of the view.
  /* package */ float mLogicalLeft;
  /* package */ float mLogicalTop;
  /* package */ float mLogicalRight;
  /* package */ float mLogicalBottom;

  public DrawView(int reactTag) {
    this.reactTag = reactTag;
  }

  /**
   * Similar to updateBoundsAndFreeze, but thread safe as the mounting flag is modified on the UI
   * thread.
   *
   * @return A DrawView with the passed bounds and clipping bounds.  If we can use the same
   *     DrawView, it will just be this, otherwise it will be a frozen copy.
   */
  public DrawView collectDrawView(
      float left,
      float top,
      float right,
      float bottom,
      float logicalLeft,
      float logicalTop,
      float logicalRight,
      float logicalBottom,
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom,
      float clipRadius) {
    DrawView drawView = (DrawView)
        updateBoundsAndFreeze(
            left,
            top,
            right,
            bottom,
            clipLeft,
            clipTop,
            clipRight,
            clipBottom);
    boolean clipRadiusChanged = Math.abs(mClipRadius - clipRadius) > 0.001f;
    boolean logicalBoundsChanged =
        !logicalBoundsMatch(logicalLeft, logicalTop, logicalRight, logicalBottom);
    if (drawView == this && (clipRadiusChanged || logicalBoundsChanged)) {
      // everything matches except the clip radius, so we clone the old one so that we can update
      // the clip radius in the block below.
      try {
        drawView = (DrawView) clone();
      } catch (CloneNotSupportedException e) {
        // This should not happen since AbstractDrawCommand implements Cloneable
        throw new RuntimeException(e);
      }
    }

    if (drawView != this) {
      drawView.mClipRadius = clipRadius;
      if (clipRadius > MINIMUM_ROUNDED_CLIPPING_VALUE) {
        // update the path that we'll clip based on
        drawView.updateClipPath();
      } else {
        drawView.mPath = null;
      }

      if (logicalBoundsChanged) {
        drawView.setLogicalBounds(logicalLeft, logicalTop, logicalRight, logicalBottom);
      }

      // It is very important that we unset this, as our spec is that newly created DrawViews are
      // handled differently by the FlatViewGroup.  This is needed because updateBoundsAndFreeze
      // uses .clone(), so we maintain the previous state.
      drawView.mWasMounted = false;
    }
    return drawView;
  }

  private boolean logicalBoundsMatch(float left, float top, float right, float bottom) {
    return left == mLogicalLeft && top == mLogicalTop &&
        right == mLogicalRight && bottom == mLogicalBottom;
  }

  private void setLogicalBounds(float left, float top, float right, float bottom) {
    // Do rounding up front and off of the UI thread.
    mLogicalLeft = left;
    mLogicalTop = top;
    mLogicalRight = right;
    mLogicalBottom = bottom;
  }

  @Override
  public void draw(FlatViewGroup parent, Canvas canvas) {
    onPreDraw(parent, canvas);
    if (mNeedsClipping || mClipRadius > MINIMUM_ROUNDED_CLIPPING_VALUE) {
      canvas.save(Canvas.CLIP_SAVE_FLAG);
      applyClipping(canvas);
      parent.drawNextChild(canvas);
      canvas.restore();
    } else {
      parent.drawNextChild(canvas);
    }
  }

  /**
   * Update the path with which we'll clip this view
   */
  private void updateClipPath() {
    mPath = new Path();

    TMP_RECT.set(
        getLeft(),
        getTop(),
        getRight(),
        getBottom());

    // set the path
    mPath.addRoundRect(
        TMP_RECT,
        mClipRadius,
        mClipRadius,
        Path.Direction.CW);
  }

  @Override
  protected void applyClipping(Canvas canvas) {
    // only clip using a path if our radius is greater than some minimum threshold, because
    // clipPath is more expensive than clipRect.
    if (mClipRadius > MINIMUM_ROUNDED_CLIPPING_VALUE) {
      canvas.clipPath(mPath);
    } else {
      super.applyClipping(canvas);
    }
  }

  @Override
  protected void onDraw(Canvas canvas) {
    // no op as we override draw.
  }

  @Override
  public void debugDraw(FlatViewGroup parent, Canvas canvas) {
    parent.debugDrawNextChild(canvas);
  }
}
