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
import android.text.Layout;

/**
 * DrawTextLayout is a DrawCommand that draw {@link Layout}.
 */
/* package */ final class DrawTextLayout extends AbstractDrawCommand {

  private Layout mLayout;

  /* package */ DrawTextLayout(Layout layout) {
    mLayout = layout;
  }

  /**
   * Assigns a new {@link Layout} to draw.
   */
  public void setLayout(Layout layout) {
    mLayout = layout;
  }

  public Layout getLayout() {
    return mLayout;
  }

  @Override
  public void draw(FlatViewGroup parent, Canvas canvas) {
    float left = getLeft();
    float top = getTop();

    canvas.translate(left, top);
    mLayout.draw(canvas);
    canvas.translate(-left, -top);
  }
}
