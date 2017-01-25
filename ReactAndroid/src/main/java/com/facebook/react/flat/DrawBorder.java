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
import android.graphics.Path;

import com.facebook.react.uimanager.Spacing;

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
  private @Nullable Path mPathForBorder;

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
    if (getBorderRadius() >= 0.5f || getPathEffectForBorderStyle() != null) {
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

  /**
   * @return true when border colors differs where two border sides meet (e.g. right and top border
   * colors differ)
   */
  private boolean isBorderColorDifferentAtIntersectionPoints() {
    return isFlagSet(BORDER_TOP_COLOR_SET) ||
        isFlagSet(BORDER_BOTTOM_COLOR_SET) ||
        isFlagSet(BORDER_LEFT_COLOR_SET) ||
        isFlagSet(BORDER_RIGHT_COLOR_SET);
  }

  private void drawRectangularBorders(Canvas canvas) {
    int defaultColor = getBorderColor();
    float defaultWidth = getBorderWidth();

    float top = getTop();
    float topWidth = resolveWidth(mBorderTopWidth, defaultWidth);
    float bottomOfTheTop = top + topWidth;
    int topColor = resolveBorderColor(BORDER_TOP_COLOR_SET, mBorderTopColor, defaultColor);

    float bottom = getBottom();
    float bottomWidth = resolveWidth(mBorderBottomWidth, defaultWidth);
    float topOfTheBottom = bottom - bottomWidth;
    int bottomColor = resolveBorderColor(BORDER_BOTTOM_COLOR_SET, mBorderBottomColor, defaultColor);

    float left = getLeft();
    float leftWidth = resolveWidth(mBorderLeftWidth, defaultWidth);
    float rightOfTheLeft = left + leftWidth;
    int leftColor = resolveBorderColor(BORDER_LEFT_COLOR_SET, mBorderLeftColor, defaultColor);

    float right = getRight();
    float rightWidth = resolveWidth(mBorderRightWidth, defaultWidth);
    float leftOfTheRight = right - rightWidth;
    int rightColor = resolveBorderColor(BORDER_RIGHT_COLOR_SET, mBorderRightColor, defaultColor);

    boolean isDrawPathRequired = isBorderColorDifferentAtIntersectionPoints();
    if (isDrawPathRequired && mPathForBorder == null) {
      mPathForBorder = new Path();
    }

    // draw top
    if (Color.alpha(topColor) != 0 && topWidth != 0) {
      PAINT.setColor(topColor);

      if (isDrawPathRequired) {
        updatePathForTopBorder(
            top,
            bottomOfTheTop,
            left,
            rightOfTheLeft,
            right,
            leftOfTheRight);
        canvas.drawPath(mPathForBorder, PAINT);
      } else {
        canvas.drawRect(left, top, right, bottomOfTheTop, PAINT);
      }
    }

    // draw bottom
    if (Color.alpha(bottomColor) != 0 && bottomWidth != 0) {
      PAINT.setColor(bottomColor);

      if (isDrawPathRequired) {
        updatePathForBottomBorder(
            bottom,
            topOfTheBottom,
            left,
            rightOfTheLeft,
            right,
            leftOfTheRight);
        canvas.drawPath(mPathForBorder, PAINT);
      } else {
        canvas.drawRect(left, topOfTheBottom, right, bottom, PAINT);
      }
    }

    // draw left
    if (Color.alpha(leftColor) != 0 && leftWidth != 0) {
      PAINT.setColor(leftColor);

      if (isDrawPathRequired) {
        updatePathForLeftBorder(
            top,
            bottomOfTheTop,
            bottom,
            topOfTheBottom,
            left,
            rightOfTheLeft);
        canvas.drawPath(mPathForBorder, PAINT);
      } else {
        canvas.drawRect(left, bottomOfTheTop, rightOfTheLeft, topOfTheBottom, PAINT);
      }
    }

    // draw right
    if (Color.alpha(rightColor) != 0 && rightWidth != 0) {
      PAINT.setColor(rightColor);

      if (isDrawPathRequired) {
        updatePathForRightBorder(
            top,
            bottomOfTheTop,
            bottom,
            topOfTheBottom,
            right,
            leftOfTheRight);
        canvas.drawPath(mPathForBorder, PAINT);
      } else {
        canvas.drawRect(leftOfTheRight, bottomOfTheTop, right, topOfTheBottom, PAINT);
      }
    }

    // draw center
    if (Color.alpha(mBackgroundColor) != 0) {
      PAINT.setColor(mBackgroundColor);
      canvas.drawRect(rightOfTheLeft, bottomOfTheTop, leftOfTheRight, topOfTheBottom, PAINT);
    }
  }

  private void updatePathForTopBorder(
      float top,
      float bottomOfTheTop,
      float left,
      float rightOfTheLeft,
      float right,
      float leftOfTheRight) {
    if (mPathForBorder == null) {
      mPathForBorder = new Path();
    }
    mPathForBorder.reset();
    mPathForBorder.moveTo(left, top);
    mPathForBorder.lineTo(rightOfTheLeft, bottomOfTheTop);
    mPathForBorder.lineTo(leftOfTheRight, bottomOfTheTop);
    mPathForBorder.lineTo(right, top);
    mPathForBorder.lineTo(left, top);
  }

  private void updatePathForBottomBorder(
      float bottom,
      float topOfTheBottom,
      float left,
      float rightOfTheLeft,
      float right,
      float leftOfTheRight) {
    if (mPathForBorder == null) {
      mPathForBorder = new Path();
    }
    mPathForBorder.reset();
    mPathForBorder.moveTo(left, bottom);
    mPathForBorder.lineTo(right, bottom);
    mPathForBorder.lineTo(leftOfTheRight, topOfTheBottom);
    mPathForBorder.lineTo(rightOfTheLeft, topOfTheBottom);
    mPathForBorder.lineTo(left, bottom);
  }

  private void updatePathForLeftBorder(
      float top,
      float bottomOfTheTop,
      float bottom,
      float topOfTheBottom,
      float left,
      float rightOfTheLeft) {
    if (mPathForBorder == null) {
      mPathForBorder = new Path();
    }
    mPathForBorder.reset();
    mPathForBorder.moveTo(left, top);
    mPathForBorder.lineTo(rightOfTheLeft, bottomOfTheTop);
    mPathForBorder.lineTo(rightOfTheLeft, topOfTheBottom);
    mPathForBorder.lineTo(left, bottom);
    mPathForBorder.lineTo(left, top);
  }

  private void updatePathForRightBorder(
      float top,
      float bottomOfTheTop,
      float bottom,
      float topOfTheBottom,
      float right,
      float leftOfTheRight) {
    if (mPathForBorder == null) {
      mPathForBorder = new Path();
    }
    mPathForBorder.reset();
    mPathForBorder.moveTo(right, top);
    mPathForBorder.lineTo(right, bottom);
    mPathForBorder.lineTo(leftOfTheRight, topOfTheBottom);
    mPathForBorder.lineTo(leftOfTheRight, bottomOfTheTop);
    mPathForBorder.lineTo(right, top);
  }

  private int resolveBorderColor(int flag, int color, int defaultColor) {
    return isFlagSet(flag) ? color : defaultColor;
  }

  private static float resolveWidth(float width, float defaultWidth) {
    return (width == 0 || /* check for NaN */ width != width) ? defaultWidth : width;
  }

  private static DashPathEffect createDashPathEffect(float borderWidth) {
    for (int i = 0; i < 4; ++i) {
      TMP_FLOAT_ARRAY[i] = borderWidth;
    }
    return new DashPathEffect(TMP_FLOAT_ARRAY, 0);
  }
}
