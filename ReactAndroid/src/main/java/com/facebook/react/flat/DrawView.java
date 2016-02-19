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

  /* package */ static final DrawView INSTANCE = new DrawView(0, 0, 0, 0);

  public DrawView(float clipLeft, float clipTop, float clipRight, float clipBottom) {
    setClipBounds(clipLeft, clipTop, clipRight, clipBottom);
  }

  @Override
  public void draw(FlatViewGroup parent, Canvas canvas) {
    canvas.save();
    applyClipping(canvas);
    parent.drawNextChild(canvas);
    canvas.restore();
  }
}
