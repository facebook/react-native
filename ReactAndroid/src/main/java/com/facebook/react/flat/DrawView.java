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
import android.graphics.Rect;

/* package */ final class DrawView implements DrawCommand {

  /* package */ static final DrawView INSTANCE = new DrawView(0, 0, 0, 0);
  private static final Rect TMP_CLIP_RECT = new Rect();

  private final float mClipLeft;
  private final float mClipTop;
  private final float mClipRight;
  private final float mClipBottom;

  public DrawView(float clipLeft, float clipTop, float clipRight, float clipBottom) {
    mClipLeft = clipLeft;
    mClipTop = clipTop;
    mClipRight = clipRight;
    mClipBottom = clipBottom;
  }

  public boolean clipBoundsMatch(float clipLeft, float clipTop, float clipRight, float clipBottom) {
    return mClipLeft == clipLeft && mClipTop == clipTop
        && mClipRight == clipRight && mClipBottom == clipBottom;
  }

  @Override
  public void draw(FlatViewGroup parent, Canvas canvas) {
    // This should not be required, except that there is a bug in Canvas that only shows up in
    // screenshot tests where Canvas incorrectly applies clip rect caused by integer overflows
    // because software Canvas is actually using ints for bounds, not floats.
    canvas.getClipBounds(TMP_CLIP_RECT);
    TMP_CLIP_RECT.intersect(
        Math.round(mClipLeft),
        Math.round(mClipTop),
        Math.round(mClipRight),
        Math.round(mClipBottom));

    canvas.save();
    canvas.clipRect(TMP_CLIP_RECT);
    parent.drawNextChild(canvas);
    canvas.restore();
  }
}
