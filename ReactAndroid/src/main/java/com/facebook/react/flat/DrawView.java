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

/* package */ final class DrawView implements DrawCommand {

  /* package */ static DrawView INSTANCE = new DrawView(0, 0, 0, 0);

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
    canvas.save();
    canvas.clipRect(mClipLeft, mClipTop, mClipRight, mClipBottom);
    parent.drawNextChild(canvas);
    canvas.restore();
  }
}
