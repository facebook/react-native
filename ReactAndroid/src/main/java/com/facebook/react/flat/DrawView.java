/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
    if (!isFrozen()) {
      // We haven't collected this draw view yet, so we can just set everything.
      setBounds(left, top, right, bottom);
      setClipBounds(clipLeft, clipTop, clipRight, clipBottom);
      setClipRadius(clipRadius);
      setLogicalBounds(logicalLeft, logicalTop, logicalRight, logicalBottom);
      freeze();
      return this;
    }

    boolean boundsMatch = boundsMatch(left, top, right, bottom);
    boolean clipBoundsMatch = clipBoundsMatch(clipLeft, clipTop, clipRight, clipBottom);
    boolean clipRadiusMatch = mClipRadius == clipRadius;
    boolean logicalBoundsMatch =
        logicalBoundsMatch(logicalLeft, logicalTop, logicalRight, logicalBottom);

    // See if we can reuse the draw view.
    if (boundsMatch && clipBoundsMatch && clipRadiusMatch && logicalBoundsMatch) {
      return this;
    }

    DrawView drawView = (DrawView) mutableCopy();

    if (!boundsMatch) {
      drawView.setBounds(left, top, right, bottom);
    }

    if (!clipBoundsMatch) {
      drawView.setClipBounds(clipLeft, clipTop, clipRight, clipBottom);
    }

    if (!logicalBoundsMatch) {
      drawView.setLogicalBounds(logicalLeft, logicalTop, logicalRight, logicalBottom);
    }

    if (!clipRadiusMatch || !boundsMatch) {
      // If the bounds change, we need to update the clip path.
      drawView.setClipRadius(clipRadius);
    }

    // It is very important that we unset this, as our spec is that newly created DrawViews
    // are handled differently by the FlatViewGroup.  This is needed because clone() maintains
    // the previous state.
    drawView.mWasMounted = false;

    drawView.freeze();

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
   * Set the clip radius.  Should only be called when the clip radius is first set or when it
   * changes, in order to avoid extra work.
   *
   * @param clipRadius The new clip radius.
   */
  void setClipRadius(float clipRadius) {
    mClipRadius = clipRadius;
    if (clipRadius > MINIMUM_ROUNDED_CLIPPING_VALUE) {
      // update the path that we'll clip based on
      updateClipPath();
    } else {
      mPath = null;
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
  protected void onDebugDraw(FlatViewGroup parent, Canvas canvas) {
    parent.debugDrawNextChild(canvas);
  }

  @Override
  protected void onDebugDrawHighlight(Canvas canvas) {
    if (mPath != null) {
      debugDrawWarningHighlight(canvas, "borderRadius: " + mClipRadius);
    } else if (!boundsMatch(mLogicalLeft, mLogicalTop, mLogicalRight, mLogicalBottom)) {
      StringBuilder warn = new StringBuilder("Overflow: { ");
      String[] names = { "left: ", "top: ", "right: ", "bottom: "};
      int i = 0;
      float[] offsets = new float[4];
      offsets[i++] = getLeft() - mLogicalLeft;
      offsets[i++] = getTop() - mLogicalTop;
      offsets[i++] = mLogicalRight - getRight();
      offsets[i++] = mLogicalBottom - getBottom();

      for (i = 0; i < 4; i++) {
        if (offsets[i] != 0f) {
          warn.append(names[i]);
          warn.append(offsets[i]);
          warn.append(", ");
        }
      }

      warn.append("}");

      debugDrawCautionHighlight(canvas, warn.toString());
    }
  }
}
