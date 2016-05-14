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
  /* package */ boolean isViewGroupClipped;

  public DrawView(int reactTag, float clipLeft, float clipTop, float clipRight, float clipBottom) {
    this.reactTag = reactTag;
    setClipBounds(clipLeft, clipTop, clipRight, clipBottom);
  }

  @Override
  public void draw(FlatViewGroup parent, Canvas canvas) {
    if (mNeedsClipping) {
      canvas.save(Canvas.CLIP_SAVE_FLAG);
      applyClipping(canvas);
      parent.drawNextChild(canvas);
      canvas.restore();
    } else {
      parent.drawNextChild(canvas);
    }
  }
}
