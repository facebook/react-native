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
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;

/**
 * Base class for all DrawCommands. Becomes immutable once it has its bounds set. Until then, a
 * subclass is able to mutate any of its properties (e.g. updating Layout in DrawTextLayout).
 *
 * The idea is to be able to reuse unmodified objects when we build up DrawCommands before we ship
 * them to UI thread, but we can only do that if DrawCommands are immutable.
 */
/* package */ abstract class AbstractDrawCommand extends DrawCommand implements Cloneable {

  private float mLeft;
  private float mTop;
  private float mRight;
  private float mBottom;
  private boolean mFrozen;

  protected boolean mNeedsClipping;
  private float mClipLeft;
  private float mClipTop;
  private float mClipRight;
  private float mClipBottom;

  // Used to draw highlights in debug draw.
  private static Paint sDebugHighlightRed;
  private static Paint sDebugHighlightYellow;
  private static Paint sDebugHighlightOverlayText;

  public final boolean clipBoundsMatch(
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    return mClipLeft == clipLeft && mClipTop == clipTop
        && mClipRight == clipRight && mClipBottom == clipBottom;
  }

  protected final void setClipBounds(
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    mClipLeft = clipLeft;
    mClipTop = clipTop;
    mClipRight = clipRight;
    mClipBottom = clipBottom;
    // We put this check here to not clip when we have the default [-infinity, infinity] bounds,
    // since clipRect in those cases is essentially no-op anyway. This is needed to fix a bug that
    // shows up during screenshot testing. Note that checking one side is enough, since if one side
    // is infinite, all sides will be infinite, since we only set infinite for all sides at the
    // same time - conversely, if one side is finite, all sides will be finite.
    mNeedsClipping = mClipLeft != Float.NEGATIVE_INFINITY;
  }

  public final float getClipLeft() {
    return mClipLeft;
  }

  public final float getClipTop() {
    return mClipTop;
  }

  public final float getClipRight() {
    return mClipRight;
  }

  public final float getClipBottom() {
    return mClipBottom;
  }

  protected void applyClipping(Canvas canvas) {
    canvas.clipRect(mClipLeft, mClipTop, mClipRight, mClipBottom);
  }

  /**
   * Don't override this unless you need to do custom clipping in a draw command.  Otherwise just
   * override onPreDraw and onDraw.
   */
  @Override
  public void draw(FlatViewGroup parent, Canvas canvas) {
    onPreDraw(parent, canvas);
    if (mNeedsClipping && shouldClip()) {
      canvas.save(Canvas.CLIP_SAVE_FLAG);
      applyClipping(canvas);
      onDraw(canvas);
      canvas.restore();
    } else {
      onDraw(canvas);
    }
  }

  protected static int getDebugBorderColor() {
    return Color.CYAN;
  }

  protected String getDebugName() {
    return getClass().getSimpleName().substring(4);
  }

  private void initDebugHighlightResources(FlatViewGroup parent) {
    if (sDebugHighlightRed == null) {
      sDebugHighlightRed = new Paint();
      sDebugHighlightRed.setARGB(75, 255, 0, 0);
    }
    if (sDebugHighlightYellow == null) {
      sDebugHighlightYellow = new Paint();
      sDebugHighlightYellow.setARGB(100, 255, 204, 0);
    }
    if (sDebugHighlightOverlayText == null) {
      sDebugHighlightOverlayText = new Paint();
      sDebugHighlightOverlayText.setAntiAlias(true);
      sDebugHighlightOverlayText.setARGB(200, 50, 50, 50);
      sDebugHighlightOverlayText.setTextAlign(Paint.Align.RIGHT);
      sDebugHighlightOverlayText.setTypeface(Typeface.MONOSPACE);
      sDebugHighlightOverlayText.setTextSize(parent.dipsToPixels(9));
    }
  }

  private void debugDrawHighlightRect(Canvas canvas, Paint paint, String text) {
    canvas.drawRect(getLeft(), getTop(), getRight(), getBottom(), paint);
    canvas.drawText(text, getRight() - 5, getBottom() - 5, sDebugHighlightOverlayText);
  }

  protected void debugDrawWarningHighlight(Canvas canvas, String text) {
    debugDrawHighlightRect(canvas, sDebugHighlightRed, text);
  }

  protected void debugDrawCautionHighlight(Canvas canvas, String text) {
    debugDrawHighlightRect(canvas, sDebugHighlightYellow, text);
  }

  @Override
  public final void debugDraw(FlatViewGroup parent, Canvas canvas) {
    onDebugDraw(parent, canvas);
    if (FlatViewGroup.DEBUG_HIGHLIGHT_PERFORMANCE_ISSUES) {
      initDebugHighlightResources(parent);
      onDebugDrawHighlight(canvas);
    }
  }

  protected void onDebugDraw(FlatViewGroup parent, Canvas canvas) {
    parent.debugDrawNamedRect(
        canvas,
        getDebugBorderColor(),
        getDebugName(),
        mLeft,
        mTop,
        mRight,
        mBottom);
  }

  protected void onDebugDrawHighlight(Canvas canvas) {
  }

  protected void onPreDraw(FlatViewGroup parent, Canvas canvas) {
  }

  /**
   * Updates boundaries of the AbstractDrawCommand and freezes it.
   * Will return a frozen copy if the current AbstractDrawCommand cannot be mutated.
   *
   * This should not be called on a DrawView, as the DrawView is modified on UI thread.  Use
   * DrawView.collectDrawView instead to avoid race conditions.
   */
  public AbstractDrawCommand updateBoundsAndFreeze(
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
   * Mark this object as frozen, indicating that it should not be mutated.
   */
  public final void freeze() {
    mFrozen = true;
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
    return mLeft < getClipLeft() || mTop < getClipTop() ||
        mRight > getClipRight() || mBottom > getClipBottom();
  }

  protected void onBoundsChanged() {
  }

  /**
   * Updates boundaries of this DrawCommand.
   */
  protected final void setBounds(float left, float top, float right, float bottom) {
    mLeft = left;
    mTop = top;
    mRight = right;
    mBottom = bottom;

    onBoundsChanged();
  }

  /**
   * Returns true if boundaries match and don't need to be updated. False otherwise.
   */
  protected final boolean boundsMatch(float left, float top, float right, float bottom) {
    return mLeft == left && mTop == top && mRight == right && mBottom == bottom;
  }
}
