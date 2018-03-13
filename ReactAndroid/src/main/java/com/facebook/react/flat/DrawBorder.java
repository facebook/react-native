/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

  // ~0 == 0xFFFFFFFF, all bits set to 1.
  private static final int ALL_BITS_SET = ~0;
  // 0 == 0x00000000, all bits set to 0.
  private static final int ALL_BITS_UNSET = 0;

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
   * Quickly determine if all the set border colors are equal.  Bitwise AND all the set colors
   * together, then OR them all together.  If the AND and the OR are the same, then the colors
   * are compatible, so return this color.
   *
   * Used to avoid expensive path creation and expensive calls to canvas.drawPath
   *
   * @return A compatible border color, or zero if the border colors are not compatible.
   */
  private static int fastBorderCompatibleColorOrZero(
      float borderLeft,
      float borderTop,
      float borderRight,
      float borderBottom,
      int colorLeft,
      int colorTop,
      int colorRight,
      int colorBottom) {
    int andSmear = (borderLeft > 0 ? colorLeft : ALL_BITS_SET) &
        (borderTop > 0 ? colorTop : ALL_BITS_SET) &
        (borderRight > 0 ? colorRight : ALL_BITS_SET) &
        (borderBottom > 0 ? colorBottom : ALL_BITS_SET);
    int orSmear = (borderLeft > 0 ? colorLeft : ALL_BITS_UNSET) |
        (borderTop > 0 ? colorTop : ALL_BITS_UNSET) |
        (borderRight > 0 ? colorRight : ALL_BITS_UNSET) |
        (borderBottom > 0 ? colorBottom : ALL_BITS_UNSET);
    return andSmear == orSmear ? andSmear : 0;
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

    // Check for fast path to border drawing.
    int fastBorderColor = fastBorderCompatibleColorOrZero(
        borderLeft,
        borderTop,
        borderRight,
        borderBottom,
        leftColor,
        topColor,
        rightColor,
        bottomColor);
    if (fastBorderColor != 0) {
      // Fast border color draw.
      if (Color.alpha(fastBorderColor) != 0) {
        // Border color is not transparent.

        // Draw center.
        if (Color.alpha(mBackgroundColor) != 0) {
          PAINT.setColor(mBackgroundColor);
          if (Color.alpha(fastBorderColor) == 255) {
            // The border will draw over the edges, so only draw the inset background.
            canvas.drawRect(leftInset, topInset, rightInset, bottomInset, PAINT);
          } else {
            // The border is opaque, so we have to draw the entire background color.
            canvas.drawRect(left, top, right, bottom, PAINT);
          }
        }

        PAINT.setColor(fastBorderColor);
        if (borderLeft > 0) {
          canvas.drawRect(left, top, leftInset, bottom - borderBottom, PAINT);
        }
        if (borderTop > 0) {
          canvas.drawRect(left + borderLeft, top, right, topInset, PAINT);
        }
        if (borderRight > 0) {
          canvas.drawRect(rightInset, top + borderTop, right, bottom, PAINT);
        }
        if (borderBottom > 0) {
          canvas.drawRect(left, bottomInset, right - borderRight, bottom, PAINT);
        }
      }
    } else {
      if (mPathForBorder == null) {
        mPathForBorder = new Path();
      }

      // Draw center.  Any of the borders might be opaque or transparent, so we need to draw this.
      if (Color.alpha(mBackgroundColor) != 0) {
        PAINT.setColor(mBackgroundColor);
        canvas.drawRect(left, top, right, bottom, PAINT);
      }

      // Draw top.
      if (borderTop != 0 && Color.alpha(topColor) != 0) {
        PAINT.setColor(topColor);
        updatePathForTopBorder(
            mPathForBorder,
            top,
            topInset,
            left,
            leftInset,
            right,
            rightInset);
        canvas.drawPath(mPathForBorder, PAINT);
      }

      // Draw bottom.
      if (borderBottom != 0 && Color.alpha(bottomColor) != 0) {
        PAINT.setColor(bottomColor);
        updatePathForBottomBorder(
            mPathForBorder,
            bottom,
            bottomInset,
            left,
            leftInset,
            right,
            rightInset);
        canvas.drawPath(mPathForBorder, PAINT);
      }

      // Draw left.
      if (borderLeft != 0 && Color.alpha(leftColor) != 0) {
        PAINT.setColor(leftColor);
        updatePathForLeftBorder(
            mPathForBorder,
            top,
            topInset,
            bottom,
            bottomInset,
            left,
            leftInset);
        canvas.drawPath(mPathForBorder, PAINT);
      }

      // Draw right.
      if (borderRight != 0 && Color.alpha(rightColor) != 0) {
        PAINT.setColor(rightColor);
        updatePathForRightBorder(
            mPathForBorder,
            top,
            topInset,
            bottom,
            bottomInset,
            right,
            rightInset);
        canvas.drawPath(mPathForBorder, PAINT);
      }
    }
  }

  private static void updatePathForTopBorder(
      Path path,
      float top,
      float topInset,
      float left,
      float leftInset,
      float right,
      float rightInset) {
    path.reset();
    path.moveTo(left, top);
    path.lineTo(leftInset, topInset);
    path.lineTo(rightInset, topInset);
    path.lineTo(right, top);
    path.lineTo(left, top);
  }

  private static void updatePathForBottomBorder(
      Path path,
      float bottom,
      float bottomInset,
      float left,
      float leftInset,
      float right,
      float rightInset) {
    path.reset();
    path.moveTo(left, bottom);
    path.lineTo(right, bottom);
    path.lineTo(rightInset, bottomInset);
    path.lineTo(leftInset, bottomInset);
    path.lineTo(left, bottom);
  }

  private static void updatePathForLeftBorder(
      Path path,
      float top,
      float topInset,
      float bottom,
      float bottomInset,
      float left,
      float leftInset) {
    path.reset();
    path.moveTo(left, top);
    path.lineTo(leftInset, topInset);
    path.lineTo(leftInset, bottomInset);
    path.lineTo(left, bottom);
    path.lineTo(left, top);
  }

  private static void updatePathForRightBorder(
      Path path,
      float top,
      float topInset,
      float bottom,
      float bottomInset,
      float right,
      float rightInset) {
    path.reset();
    path.moveTo(right, top);
    path.lineTo(right, bottom);
    path.lineTo(rightInset, bottomInset);
    path.lineTo(rightInset, topInset);
    path.lineTo(right, top);
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
