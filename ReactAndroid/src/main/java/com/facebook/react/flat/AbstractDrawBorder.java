/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PathEffect;
import android.graphics.RectF;

/**
 * Base class for border drawing operations (used by DrawImage and DrawBorder). Draws rectangular or
 * rounded border along the rectangle, defined by the bounding box of the AbstractDrawCommand.
 */
/* package */ abstract class AbstractDrawBorder extends AbstractDrawCommand {

  private static final Paint PAINT = new Paint(Paint.ANTI_ALIAS_FLAG);
  private static final RectF TMP_RECT = new RectF();
  private static final int BORDER_PATH_DIRTY = 1 << 0;

  static {
    PAINT.setStyle(Paint.Style.STROKE);
  }

  private int mSetPropertiesFlag;
  private int mBorderColor = Color.BLACK;
  private float mBorderWidth;
  private float mBorderRadius;
  private @Nullable Path mPathForBorderRadius;

  public final void setBorderWidth(float borderWidth) {
    mBorderWidth = borderWidth;
    setFlag(BORDER_PATH_DIRTY);
  }

  public final float getBorderWidth() {
    return mBorderWidth;
  }

  public void setBorderRadius(float borderRadius) {
    mBorderRadius = borderRadius;
    setFlag(BORDER_PATH_DIRTY);
  }

  public final float getBorderRadius() {
    return mBorderRadius;
  }

  public final void setBorderColor(int borderColor) {
    mBorderColor = borderColor;
  }

  public final int getBorderColor() {
    return mBorderColor;
  }

  @Override
  protected void onBoundsChanged() {
    setFlag(BORDER_PATH_DIRTY);
  }

  protected final void drawBorders(Canvas canvas) {
    if (mBorderWidth < 0.5f) {
      return;
    }

    if (mBorderColor == 0) {
      return;
    }

    PAINT.setColor(mBorderColor);
    PAINT.setStrokeWidth(mBorderWidth);
    PAINT.setPathEffect(getPathEffectForBorderStyle());
    canvas.drawPath(getPathForBorderRadius(), PAINT);
  }

  protected final void updatePath(Path path, float correction) {
    path.reset();

    TMP_RECT.set(
        getLeft() + correction,
        getTop() + correction,
        getRight() - correction,
        getBottom() - correction);

    path.addRoundRect(
        TMP_RECT,
        mBorderRadius,
        mBorderRadius,
        Path.Direction.CW);
  }

  protected @Nullable PathEffect getPathEffectForBorderStyle() {
    return null;
  }

  protected final boolean isFlagSet(int mask) {
    return (mSetPropertiesFlag & mask) == mask;
  }

  protected final void setFlag(int mask) {
    mSetPropertiesFlag |= mask;
  }

  protected final void resetFlag(int mask) {
    mSetPropertiesFlag &= ~mask;
  }

  protected final Path getPathForBorderRadius() {
    if (isFlagSet(BORDER_PATH_DIRTY)) {
      if (mPathForBorderRadius == null) {
        mPathForBorderRadius = new Path();
      }

      updatePath(mPathForBorderRadius, mBorderWidth * 0.5f);

      resetFlag(BORDER_PATH_DIRTY);
    }

    return mPathForBorderRadius;
  }
}
