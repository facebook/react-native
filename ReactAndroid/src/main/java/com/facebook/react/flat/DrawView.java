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

/* package */ final class DrawView extends AbstractClippingDrawCommand {

  /* package */ final int reactTag;
  // Indicates if the DrawView is frozen.  If it is frozen then any setting of the clip bounds
  // should create a new DrawView.
  private boolean mFrozen;
  // Indicates whether this DrawView has been previously drawn.  If it has been drawn, then we know
  // that the bounds haven't changed, as a bounds change would trigger a new DrawView, which will
  // set this to false for the new DrawView.  Leaving this as package for direct access, but this
  // should only be set from draw in DrawView, to avoid race conditions.
  /* package */ boolean mPreviouslyDrawn;

  public DrawView(int reactTag) {
    this.reactTag = reactTag;
  }

  public DrawView collectDrawView(
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    if (mFrozen) {
      return clipBoundsMatch(clipLeft, clipTop, clipRight, clipBottom) ?
          this :
          new DrawView(reactTag).collectDrawView(clipLeft, clipTop, clipRight, clipBottom);
    } else {
      mFrozen = true;
      setClipBounds(clipLeft, clipTop, clipRight, clipBottom);
      return this;
    }
  }

  @Override
  public void draw(FlatViewGroup parent, Canvas canvas) {
    mPreviouslyDrawn = true;
    if (mNeedsClipping) {
      canvas.save(Canvas.CLIP_SAVE_FLAG);
      applyClipping(canvas);
      parent.drawNextChild(canvas);
      canvas.restore();
    } else {
      parent.drawNextChild(canvas);
    }
  }

  @Override
  public void debugDraw(FlatViewGroup parent, Canvas canvas) {
    parent.debugDrawNextChild(canvas);
  }
}
