/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.view;

import javax.annotation.Nullable;

import java.util.Locale;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.DashPathEffect;
import android.graphics.Outline;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PathEffect;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.os.Build;

import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.csslayout.CSSConstants;
import com.facebook.csslayout.FloatUtil;
import com.facebook.csslayout.Spacing;

/**
 * A subclass of {@link Drawable} used for background of {@link ReactViewGroup}. It supports
 * drawing background color and borders (including rounded borders) by providing a react friendly
 * API (setter for each of those properties).
 *
 * The implementation tries to allocate as few objects as possible depending on which properties are
 * set. E.g. for views with rounded background/borders we allocate {@code mPathForBorderRadius} and
 * {@code mTempRectForBorderRadius}. In case when view have a rectangular borders we allocate
 * {@code mBorderWidthResult} and similar. When only background color is set we won't allocate any
 * extra/unnecessary objects.
 */
/* package */ class ReactViewBackgroundDrawable extends Drawable {

  private static final int DEFAULT_BORDER_COLOR = Color.BLACK;

  private static enum BorderStyle {
    SOLID,
    DASHED,
    DOTTED;

    public @Nullable PathEffect getPathEffect(float borderWidth) {
      switch (this) {
        case SOLID:
          return null;

        case DASHED:
          return new DashPathEffect(
              new float[] {borderWidth*3, borderWidth*3, borderWidth*3, borderWidth*3}, 0);

        case DOTTED:
          return new DashPathEffect(
              new float[] {borderWidth, borderWidth, borderWidth, borderWidth}, 0);

        default:
          return null;
      }
    }
  };

  /* Value at Spacing.ALL index used for rounded borders, whole array used by rectangular borders */
  private @Nullable Spacing mBorderWidth;
  private @Nullable Spacing mBorderColor;
  private @Nullable BorderStyle mBorderStyle;

  /* Used for rounded border and rounded background */
  private @Nullable PathEffect mPathEffectForBorderStyle;
  private @Nullable Path mPathForBorderRadius;
  private @Nullable RectF mTempRectForBorderRadius;
  private boolean mNeedUpdatePathForBorderRadius = false;
  private float mBorderRadius = CSSConstants.UNDEFINED;

  /* Used by all types of background and for drawing borders */
  private final Paint mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
  private int mColor = Color.TRANSPARENT;
  private int mAlpha = 255;

  @Override
  public void draw(Canvas canvas) {
    if (!CSSConstants.isUndefined(mBorderRadius) && mBorderRadius > 0) {
      drawRoundedBackgroundWithBorders(canvas);
    } else {
      drawRectangularBackgroundWithBorders(canvas);
    }
  }

  @Override
  protected void onBoundsChange(Rect bounds) {
    super.onBoundsChange(bounds);
    mNeedUpdatePathForBorderRadius = true;
  }

  @Override
  public void setAlpha(int alpha) {
    if (alpha != mAlpha) {
      mAlpha = alpha;
      invalidateSelf();
    }
  }

  @Override
  public int getAlpha() {
    return mAlpha;
  }

  @Override
  public void setColorFilter(ColorFilter cf) {
    // do nothing
  }

  @Override
  public int getOpacity() {
    return ColorUtil.getOpacityFromColor(ColorUtil.multiplyColorAlpha(mColor, mAlpha));
  }

  /* Android's elevation implementation requires this to be implemented to know where to draw the shadow. */
  @Override
  public void getOutline(Outline outline) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      super.getOutline(outline);
      return;
    }
    if(!CSSConstants.isUndefined(mBorderRadius) && mBorderRadius > 0) {
      float extraRadiusFromBorderWidth = (mBorderWidth != null)
              ? mBorderWidth.get(Spacing.ALL) / 2f
              : 0;
      outline.setRoundRect(getBounds(), mBorderRadius + extraRadiusFromBorderWidth);
    } else {
      outline.setRect(getBounds());
    }
  }

  public void setBorderWidth(int position, float width) {
    if (mBorderWidth == null) {
      mBorderWidth = new Spacing();
    }
    if (!FloatUtil.floatsEqual(mBorderWidth.getRaw(position), width)) {
      mBorderWidth.set(position, width);
      if (position == Spacing.ALL) {
        mNeedUpdatePathForBorderRadius = true;
      }
      invalidateSelf();
    }
  }

  public void setBorderColor(int position, float color) {
    if (mBorderColor == null) {
      mBorderColor = new Spacing();
      mBorderColor.setDefault(Spacing.LEFT, DEFAULT_BORDER_COLOR);
      mBorderColor.setDefault(Spacing.TOP, DEFAULT_BORDER_COLOR);
      mBorderColor.setDefault(Spacing.RIGHT, DEFAULT_BORDER_COLOR);
      mBorderColor.setDefault(Spacing.BOTTOM, DEFAULT_BORDER_COLOR);
    }
    if (!FloatUtil.floatsEqual(mBorderColor.getRaw(position), color)) {
      mBorderColor.set(position, color);
      invalidateSelf();
    }
  }

  public void setBorderStyle(@Nullable String style) {
    BorderStyle borderStyle = style == null
        ? null
        : BorderStyle.valueOf(style.toUpperCase(Locale.US));
    if (mBorderStyle != borderStyle) {
      mBorderStyle = borderStyle;
      mNeedUpdatePathForBorderRadius = true;
      invalidateSelf();
    }
  }

  public void setRadius(float radius) {
    if (mBorderRadius != radius) {
      mBorderRadius = radius;
      invalidateSelf();
    }
  }

  public void setColor(int color) {
    mColor = color;
    invalidateSelf();
  }

  @VisibleForTesting
  public int getColor() {
    return mColor;
  }

  private void drawRoundedBackgroundWithBorders(Canvas canvas) {
    updatePath();
    int useColor = ColorUtil.multiplyColorAlpha(mColor, mAlpha);
    if ((useColor >>> 24) != 0) { // color is not transparent
      mPaint.setColor(useColor);
      mPaint.setStyle(Paint.Style.FILL);
      canvas.drawPath(mPathForBorderRadius, mPaint);
    }
    // maybe draw borders?
    float fullBorderWidth = getFullBorderWidth();
    if (fullBorderWidth > 0) {
      int borderColor = getFullBorderColor();
      mPaint.setColor(ColorUtil.multiplyColorAlpha(borderColor, mAlpha));
      mPaint.setStyle(Paint.Style.STROKE);
      mPaint.setStrokeWidth(fullBorderWidth);
      mPaint.setPathEffect(mPathEffectForBorderStyle);
      canvas.drawPath(mPathForBorderRadius, mPaint);
    }
  }

  private void updatePath() {
    if (!mNeedUpdatePathForBorderRadius) {
      return;
    }
    mNeedUpdatePathForBorderRadius = false;
    if (mPathForBorderRadius == null) {
      mPathForBorderRadius = new Path();
      mTempRectForBorderRadius = new RectF();
    }
    mPathForBorderRadius.reset();
    mTempRectForBorderRadius.set(getBounds());
    float fullBorderWidth = getFullBorderWidth();
    if (fullBorderWidth > 0) {
      mTempRectForBorderRadius.inset(fullBorderWidth * 0.5f, fullBorderWidth * 0.5f);
    }
    mPathForBorderRadius.addRoundRect(
        mTempRectForBorderRadius,
        mBorderRadius,
        mBorderRadius,
        Path.Direction.CW);

    mPathEffectForBorderStyle = mBorderStyle != null
        ? mBorderStyle.getPathEffect(getFullBorderWidth())
        : null;
  }

  /**
   * For rounded borders we use default "borderWidth" property.
   */
  private float getFullBorderWidth() {
    return (mBorderWidth != null && !CSSConstants.isUndefined(mBorderWidth.getRaw(Spacing.ALL))) ?
        mBorderWidth.getRaw(Spacing.ALL) : 0f;
  }

  /**
   * We use this method for getting color for rounded borders only similarly as for
   * {@link #getFullBorderWidth}.
   */
  private int getFullBorderColor() {
    return (mBorderColor != null && !CSSConstants.isUndefined(mBorderColor.getRaw(Spacing.ALL))) ?
        (int) (long) mBorderColor.getRaw(Spacing.ALL) : DEFAULT_BORDER_COLOR;
  }

  private void drawRectangularBackgroundWithBorders(Canvas canvas) {
    int useColor = ColorUtil.multiplyColorAlpha(mColor, mAlpha);
    if ((useColor >>> 24) != 0) { // color is not transparent
      mPaint.setColor(useColor);
      mPaint.setStyle(Paint.Style.FILL);
      canvas.drawRect(getBounds(), mPaint);
    }
    // maybe draw borders?
    if (getBorderWidth(Spacing.LEFT) > 0 || getBorderWidth(Spacing.TOP) > 0 ||
        getBorderWidth(Spacing.RIGHT) > 0 || getBorderWidth(Spacing.BOTTOM) > 0) {

      int borderLeft = getBorderWidth(Spacing.LEFT);
      int borderTop = getBorderWidth(Spacing.TOP);
      int borderRight = getBorderWidth(Spacing.RIGHT);
      int borderBottom = getBorderWidth(Spacing.BOTTOM);
      int colorLeft = getBorderColor(Spacing.LEFT);
      int colorTop = getBorderColor(Spacing.TOP);
      int colorRight = getBorderColor(Spacing.RIGHT);
      int colorBottom = getBorderColor(Spacing.BOTTOM);

      int width = getBounds().width();
      int height = getBounds().height();

      if (borderLeft > 0 && colorLeft != Color.TRANSPARENT) {
        mPaint.setColor(colorLeft);
        canvas.drawRect(0, borderTop, borderLeft, height - borderBottom, mPaint);
      }

      if (borderTop > 0 && colorTop != Color.TRANSPARENT) {
        mPaint.setColor(colorTop);
        canvas.drawRect(0, 0, width, borderTop, mPaint);
      }

      if (borderRight > 0 && colorRight != Color.TRANSPARENT) {
        mPaint.setColor(colorRight);
        canvas.drawRect(
            width - borderRight,
            borderTop,
            width,
            height - borderBottom,
            mPaint);
      }

      if (borderBottom > 0 && colorBottom != Color.TRANSPARENT) {
        mPaint.setColor(colorBottom);
        canvas.drawRect(0, height - borderBottom, width, height, mPaint);
      }
    }
  }

  private int getBorderWidth(int position) {
    return mBorderWidth != null ? Math.round(mBorderWidth.get(position)) : 0;
  }

  private int getBorderColor(int position) {
    // Check ReactStylesDiffMap#getColorInt() to see why this is needed
    return mBorderColor != null ? (int) (long) mBorderColor.get(position) : DEFAULT_BORDER_COLOR;
  }
}
