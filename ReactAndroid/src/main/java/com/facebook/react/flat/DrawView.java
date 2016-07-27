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

/* package */ final class DrawView extends AbstractDrawCommand {

  /* package */ final int reactTag;
  // Indicates whether this DrawView has been previously mounted to a clipping FlatViewGroup.  This
  // lets us know that the bounds haven't changed, as a bounds change would trigger a new DrawView,
  // which will set this to false for the new DrawView.  This is safe, despite the dual access with
  // FlatViewGroup, because the FlatViewGroup copy is only ever modified by the FlatViewGroup.
  // Changing how this boolean is used should be handled with caution, as race conditions are the
  // quickest way to create unreproducible super bugs.
  /* package */ boolean mWasMounted;

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
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    DrawView drawView = (DrawView)
        updateBoundsAndFreeze(left, top, right, bottom, clipLeft, clipTop, clipRight, clipBottom);
    if (drawView != this) {
      // It is very important that we unset this, as our spec is that newly created DrawViews are
      // handled differently by the FlatViewGroup.  This is needed because updateBoundsAndFreeze
      // uses .clone(), so we maintain the previous state.
      drawView.mWasMounted = false;
    }
    return drawView;
  }

  @Override
  public void draw(FlatViewGroup parent, Canvas canvas) {
    onPreDraw(parent, canvas);
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
  protected void onDraw(Canvas canvas) {
    // no op as we override draw.
  }

  @Override
  public void debugDraw(FlatViewGroup parent, Canvas canvas) {
    parent.debugDrawNextChild(canvas);
  }
}
