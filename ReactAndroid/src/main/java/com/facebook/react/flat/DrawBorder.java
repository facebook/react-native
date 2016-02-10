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
import android.graphics.DashPathEffect;
import android.graphics.Paint;

import com.facebook.csslayout.Spacing;

/* package */ final class DrawBorder extends AbstractDrawBorder {

  private static final Paint PAINT = new Paint(Paint.ANTI_ALIAS_FLAG);
  private static final float[] TMP_FLOAT_ARRAY = new float[4];

  private static final int BORDER_STYLE_SOLID = 0;
  private static final int BORDER_STYLE_DOTTED = 1;
  private static final int BORDER_STYLE_DASHED = 2;

  private static final int BORDER_LEFT_COLOR_SET = 1 << 1;
  private static final int BORDER_TOP_COLOR_SET = 1 << 2;
  private static final int BORDER_RIGHT_COLOR_SET = 1 << 3;
  private static final int BORDER_BOTTOM_COLOR_SET = 1 << 4;
  private static final int BORDER_PATH_EFFECT_DIRTY = 1 << 5;

  private float mBorderLeftWidth;
  private float mBorderTopWidth;
  private float mBorderRightWidth;
  private float mBorderBottomWidth;

  private int mBorderLeftColor;
  private int mBorderTopColor;
  private int mBorderRightColor;
  private int mBorderBottomColor;

  private int mBorderStyle = BORDER_STYLE_SOLID;

  private int mBackgroundColor;

  private @Nullable DashPathEffect mPathEffectForBorderStyle;

  public void setBorderWidth(int position, float borderWidth) {
    switch (position) {
      case Spacing.LEFT:
        mBorderLeftWidth = borderWidth;
        break;
      case Spacing.TOP:
        mBorderTopWidth = borderWidth;
        break;
      case Spacing.RIGHT:
        mBorderRightWidth = borderWidth;
        break;
      case Spacing.BOTTOM:
        mBorderBottomWidth = borderWidth;
        break;
      case Spacing.ALL:
        setBorderWidth(borderWidth);
        break;
    }
  }

  public float getBorderWidth(int position) {
    switch (position) {
      case Spacing.LEFT:
        return mBorderLeftWidth;
      case Spacing.TOP:
        return mBorderTopWidth;
      case Spacing.RIGHT:
        return mBorderRightWidth;
      case Spacing.BOTTOM:
        return mBorderBottomWidth;
      case Spacing.ALL:
        return getBorderWidth();
    }

    return 0.0f;
  }

  public void setBorderStyle(@Nullable String style) {
    if ("dotted".equals(style)) {
      mBorderStyle = BORDER_STYLE_DOTTED;
    } else if ("dashed".equals(style)) {
      mBorderStyle = BORDER_STYLE_DASHED;
    } else {
      mBorderStyle = BORDER_STYLE_SOLID;
    }

    setFlag(BORDER_PATH_EFFECT_DIRTY);
  }

  public void resetBorderColor(int position) {
    switch (position) {
      case Spacing.LEFT:
        resetFlag(BORDER_LEFT_COLOR_SET);
        break;
      case Spacing.TOP:
        resetFlag(BORDER_TOP_COLOR_SET);
        break;
      case Spacing.RIGHT:
        resetFlag(BORDER_RIGHT_COLOR_SET);
        break;
      case Spacing.BOTTOM:
        resetFlag(BORDER_BOTTOM_COLOR_SET);
        break;
      case Spacing.ALL:
        setBorderColor(Color.BLACK);
        break;
    }
  }

  public void setBorderColor(int position, int borderColor) {
    switch (position) {
      case Spacing.LEFT:
        mBorderLeftColor = borderColor;
        setFlag(BORDER_LEFT_COLOR_SET);
        break;
      case Spacing.TOP:
        mBorderTopColor = borderColor;
        setFlag(BORDER_TOP_COLOR_SET);
        break;
      case Spacing.RIGHT:
        mBorderRightColor = borderColor;
        setFlag(BORDER_RIGHT_COLOR_SET);
        break;
      case Spacing.BOTTOM:
        mBorderBottomColor = borderColor;
        setFlag(BORDER_BOTTOM_COLOR_SET);
        break;
      case Spacing.ALL:
        setBorderColor(borderColor);
        break;
    }
  }

  public int getBorderColor(int position) {
    int defaultColor = getBorderColor();
    switch (position) {
      case Spacing.LEFT:
        return resolveBorderColor(BORDER_LEFT_COLOR_SET, mBorderLeftColor, defaultColor);
      case Spacing.TOP:
        return resolveBorderColor(BORDER_TOP_COLOR_SET, mBorderTopColor, defaultColor);
      case Spacing.RIGHT:
        return resolveBorderColor(BORDER_RIGHT_COLOR_SET, mBorderRightColor, defaultColor);
      case Spacing.BOTTOM:
        return resolveBorderColor(BORDER_BOTTOM_COLOR_SET, mBorderBottomColor, defaultColor);
      case Spacing.ALL:
        return defaultColor;
    }

    return defaultColor;
  }

  public void setBackgroundColor(int backgroundColor) {
    mBackgroundColor = backgroundColor;
  }

  public int getBackgroundColor() {
    return mBackgroundColor;
  }

  @Override
  protected void onDraw(Canvas canvas) {
    if (getBorderRadius() >= 0.5f) {
      drawRoundedBorders(canvas);
    } else {
      drawRectangularBorders(canvas);
    }
  }

  @Override
  protected @Nullable DashPathEffect getPathEffectForBorderStyle() {
    if (isFlagSet(BORDER_PATH_EFFECT_DIRTY)) {
      switch (mBorderStyle) {
        case BORDER_STYLE_DOTTED:
          mPathEffectForBorderStyle = createDashPathEffect(getBorderWidth());
          break;

        case BORDER_STYLE_DASHED:
          mPathEffectForBorderStyle = createDashPathEffect(getBorderWidth() * 3);
          break;

        default:
          mPathEffectForBorderStyle = null;
          break;
      }

      resetFlag(BORDER_PATH_EFFECT_DIRTY);
    }

    return mPathEffectForBorderStyle;
  }

  private void drawRoundedBorders(Canvas canvas) {
    if (mBackgroundColor != 0) {
      PAINT.setColor(mBackgroundColor);
      canvas.drawPath(getPathForBorderRadius(), PAINT);
    }

    drawBorders(canvas);
  }

  private void drawRectangularBorders(Canvas canvas) {
    int defaultColor = getBorderColor();
    float defaultWidth = getBorderWidth();

    // draw top
    float topWidth = resolveWidth(mBorderTopWidth, defaultWidth);
    float bottomOfTheTop = getTop() + topWidth;
    int topColor = resolveBorderColor(BORDER_TOP_COLOR_SET, mBorderTopColor, defaultColor);
    if (Color.alpha(topColor) != 0 && topWidth != 0) {
      PAINT.setColor(topColor);
      canvas.drawRect(getLeft(), getTop(), getRight(), bottomOfTheTop, PAINT);
    }

    // draw bottom
    float bottomWidth = resolveWidth(mBorderBottomWidth, defaultWidth);
    float topOfTheBottom = getBottom() - bottomWidth;
    int bottomColor = resolveBorderColor(BORDER_BOTTOM_COLOR_SET, mBorderBottomColor, defaultColor);
    if (Color.alpha(bottomColor) != 0 && bottomWidth != 0) {
      PAINT.setColor(bottomColor);
      canvas.drawRect(getLeft(), topOfTheBottom, getRight(), getBottom(), PAINT);
    }

    // draw left
    float leftWidth = resolveWidth(mBorderLeftWidth, defaultWidth);
    float rightOfTheLeft = getLeft() + leftWidth;
    int leftColor = resolveBorderColor(BORDER_LEFT_COLOR_SET, mBorderLeftColor, defaultColor);
    if (Color.alpha(leftColor) != 0 && leftWidth != 0) {
      PAINT.setColor(leftColor);
      canvas.drawRect(getLeft(), bottomOfTheTop, rightOfTheLeft, topOfTheBottom, PAINT);
    }

    // draw right
    float rightWidth = resolveWidth(mBorderRightWidth, defaultWidth);
    float leftOfTheRight = getRight() - rightWidth;
    int rightColor = resolveBorderColor(BORDER_RIGHT_COLOR_SET, mBorderRightColor, defaultColor);
    if (Color.alpha(rightColor) != 0 && rightWidth != 0) {
      PAINT.setColor(rightColor);
      canvas.drawRect(leftOfTheRight, bottomOfTheTop, getRight(), topOfTheBottom, PAINT);
    }

    // draw center
    if (Color.alpha(mBackgroundColor) != 0) {
      PAINT.setColor(mBackgroundColor);
      canvas.drawRect(rightOfTheLeft, bottomOfTheTop, leftOfTheRight, topOfTheBottom, PAINT);
    }
  }

  private int resolveBorderColor(int flag, int color, int defaultColor) {
    return isFlagSet(flag) ? color : defaultColor;
  }

  private static float resolveWidth(float width, float defaultWidth) {
    return width == 0 ? defaultWidth : width;
  }

  private static DashPathEffect createDashPathEffect(float borderWidth) {
    for (int i = 0; i < 4; ++i) {
      TMP_FLOAT_ARRAY[i] = borderWidth;
    }
    return new DashPathEffect(TMP_FLOAT_ARRAY, 0);
  }
}
