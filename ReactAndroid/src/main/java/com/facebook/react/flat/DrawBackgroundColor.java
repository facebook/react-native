/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import android.graphics.Canvas;
import android.graphics.Paint;

/**
 * Draws background for a FlatShadowNode as a solid rectangle.
 */
/* package */ final class DrawBackgroundColor extends AbstractDrawCommand {

  private static final Paint PAINT = new Paint();

  private final int mBackgroundColor;

  /* package */ DrawBackgroundColor(int backgroundColor) {
    mBackgroundColor = backgroundColor;
  }

  @Override
  public void onDraw(Canvas canvas) {
    PAINT.setColor(mBackgroundColor);
    canvas.drawRect(getLeft(), getTop(), getRight(), getBottom(), PAINT);
  }
}
