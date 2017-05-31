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
    float borderTop = resolveWidth(mBorderTopWidth, defaultWidth);
    float topInset = top + borderTop;
    int topColor = resolveBorderColor(BORDER_TOP_COLOR_SET, mBorderTopColor, defaultColor);

    float bottom = getBottom();
    float borderBottom = resolveWidth(mBorderBottomWidth, defaultWidth);
    float bottomInset = bottom - borderBottom;
    int bottomColor = resolveBorderColor(BORDER_BOTTOM_COLOR_SET, mBorderBottomColor, defaultColor);

    float left = getLeft();
    float borderLeft = resolveWidth(mBorderLeftWidth, defaultWidth);
    float leftInset = left + borderLeft;
    int leftColor = resolveBorderColor(BORDER_LEFT_COLOR_SET, mBorderLeftColor, defaultColor);

    float right = getRight();
    float borderRight = resolveWidth(mBorderRightWidth, defaultWidth);
    float rightInset = right - borderRight;
    int rightColor = resolveBorderColor(BORDER_RIGHT_COLOR_SET, mBorderRightColor, defaultColor);

    boolean isDrawPathRequired = isBorderColorDifferentAtIntersectionPoints();
    if (isDrawPathRequired && mPathForBorder == null) {
      mPathForBorder = new Path();
    }

    // Draw center.  The border might be opaque, so we need to draw this.
    if (Color.alpha(mBackgroundColor) != 0) {
      PAINT.setColor(mBackgroundColor);
      canvas.drawRect(left, top, right, bottom, PAINT);
    }

    // Draw top.
    if (borderTop != 0 && Color.alpha(topColor) != 0) {
      PAINT.setColor(topColor);

      if (isDrawPathRequired) {
        updatePathForTopBorder(
            top,
            topInset,
            left,
            leftInset,
            right,
            rightInset);
        canvas.drawPath(mPathForBorder, PAINT);
      } else {
        canvas.drawRect(left, top, right, topInset, PAINT);
      }
    }

    // Draw bottom.
    if (borderBottom != 0 && Color.alpha(bottomColor) != 0) {
      PAINT.setColor(bottomColor);

      if (isDrawPathRequired) {
        updatePathForBottomBorder(
            bottom,
            bottomInset,
            left,
            leftInset,
            right,
            rightInset);
        canvas.drawPath(mPathForBorder, PAINT);
      } else {
        canvas.drawRect(left, bottomInset, right, bottom, PAINT);
      }
    }

    // Draw left.
    if (borderLeft != 0 && Color.alpha(leftColor) != 0) {
      PAINT.setColor(leftColor);

      if (isDrawPathRequired) {
        updatePathForLeftBorder(
            top,
            topInset,
            bottom,
            bottomInset,
            left,
            leftInset);
        canvas.drawPath(mPathForBorder, PAINT);
      } else {
        canvas.drawRect(left, topInset, leftInset, bottomInset, PAINT);
      }
    }

    // Draw right.
    if (borderRight != 0 && Color.alpha(rightColor) != 0) {
      PAINT.setColor(rightColor);

      if (isDrawPathRequired) {
        updatePathForRightBorder(
            top,
            topInset,
            bottom,
            bottomInset,
            right,
            rightInset);
        canvas.drawPath(mPathForBorder, PAINT);
      } else {
        canvas.drawRect(rightInset, topInset, right, bottomInset, PAINT);
      }
    }
  }

  private void updatePathForTopBorder(
      float top,
      float topInset,
      float left,
      float leftInset,
      float right,
      float rightInset) {
    if (mPathForBorder == null) {
      mPathForBorder = new Path();
    }
    mPathForBorder.reset();
    mPathForBorder.moveTo(left, top);
    mPathForBorder.lineTo(leftInset, topInset);
    mPathForBorder.lineTo(rightInset, topInset);
    mPathForBorder.lineTo(right, top);
    mPathForBorder.lineTo(left, top);
  }

  private void updatePathForBottomBorder(
      float bottom,
      float bottomInset,
      float left,
      float leftInset,
      float right,
      float rightInset) {
    if (mPathForBorder == null) {
      mPathForBorder = new Path();
    }
    mPathForBorder.reset();
    mPathForBorder.moveTo(left, bottom);
    mPathForBorder.lineTo(right, bottom);
    mPathForBorder.lineTo(rightInset, bottomInset);
    mPathForBorder.lineTo(leftInset, bottomInset);
    mPathForBorder.lineTo(left, bottom);
  }

  private void updatePathForLeftBorder(
      float top,
      float topInset,
      float bottom,
      float bottomInset,
      float left,
      float leftInset) {
    if (mPathForBorder == null) {
      mPathForBorder = new Path();
    }
    mPathForBorder.reset();
    mPathForBorder.moveTo(left, top);
    mPathForBorder.lineTo(leftInset, topInset);
    mPathForBorder.lineTo(leftInset, bottomInset);
    mPathForBorder.lineTo(left, bottom);
    mPathForBorder.lineTo(left, top);
  }

  private void updatePathForRightBorder(
      float top,
      float topInset,
      float bottom,
      float bottomInset,
      float right,
      float rightInset) {
    if (mPathForBorder == null) {
      mPathForBorder = new Path();
    }
    mPathForBorder.reset();
    mPathForBorder.moveTo(right, top);
    mPathForBorder.lineTo(right, bottom);
    mPathForBorder.lineTo(rightInset, bottomInset);
    mPathForBorder.lineTo(rightInset, topInset);
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
