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
  private float mLayoutWidth;

  /* package */ DrawTextLayout(Layout layout) {
    setLayout(layout);
  }

  /**
   * Assigns a new {@link Layout} to draw.
   */
  public void setLayout(Layout layout) {
    mLayout = layout;

    // determine how wide we actually are
    float maxLineWidth = 0;
    int lineCount = layout.getLineCount();
    for (int i = 0; i != lineCount; ++i) {
      maxLineWidth = Math.max(maxLineWidth, layout.getLineMax(i));
    }

    mLayoutWidth = maxLineWidth;
  }

  public Layout getLayout() {
    return mLayout;
  }

  public float getLayoutWidth() {
    // mLayout.getWidth() doesn't return correct width of the text Layout
    return mLayoutWidth;
  }

  public float getLayoutHeight() {
    return mLayout.getHeight();
  }

  @Override
  protected void onDraw(Canvas canvas) {
    float left = getLeft();
    float top = getTop();

    canvas.translate(left, top);
    mLayout.draw(canvas);
    canvas.translate(-left, -top);
  }
}
