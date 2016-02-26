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

/* package */ abstract class AbstractClippingDrawCommand implements DrawCommand {

  private float mClipLeft;
  private float mClipTop;
  private float mClipRight;
  private float mClipBottom;

  public final boolean clipBoundsMatch(
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    return mClipLeft == clipLeft && mClipTop == clipTop
        && mClipRight == clipRight && mClipBottom == clipBottom;
  }

  public final void setClipBounds(
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    mClipLeft = clipLeft;
    mClipTop = clipTop;
    mClipRight = clipRight;
    mClipBottom = clipBottom;
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

  protected final void applyClipping(Canvas canvas) {
    // We put this check here to not clip when we have the default [-infinity, infinity] bounds,
    // since clipRect in those cases is essentially no-op anyway. This is needed to fix a bug that
    // shows up during screenshot testing. Note that checking one side is enough, since if one side
    // is infinite, all sides will be infinite, since we only set infinite for all sides at the
    // same time - conversely, if one side is finite, all sides will be finite.
    if (mClipLeft != Float.NEGATIVE_INFINITY) {
      canvas.clipRect(mClipLeft, mClipTop, mClipRight, mClipBottom);
    }
  }
}
