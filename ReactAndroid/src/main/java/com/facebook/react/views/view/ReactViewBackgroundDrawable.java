/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.view;

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
import com.facebook.react.uimanager.FloatUtil;
import com.facebook.react.uimanager.Spacing;
import com.facebook.yoga.YogaConstants;
import java.util.Arrays;
import java.util.Locale;
import javax.annotation.Nullable;

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
public class ReactViewBackgroundDrawable extends Drawable {

  private static final int DEFAULT_BORDER_COLOR = Color.BLACK;
  private static final int DEFAULT_BORDER_RGB = 0x00FFFFFF & DEFAULT_BORDER_COLOR;
  private static final int DEFAULT_BORDER_ALPHA = (0xFF000000 & DEFAULT_BORDER_COLOR) >>> 24;
  // ~0 == 0xFFFFFFFF, all bits set to 1.
  private static final int ALL_BITS_SET = ~0;
  // 0 == 0x00000000, all bits set to 0.
  private static final int ALL_BITS_UNSET = 0;


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
  private @Nullable Spacing mBorderRGB;
  private @Nullable Spacing mBorderAlpha;
  private @Nullable BorderStyle mBorderStyle;

  /* Used for rounded border and rounded background */
  private @Nullable PathEffect mPathEffectForBorderStyle;
  private @Nullable Path mPathForBorderRadius;
  private @Nullable Path mPathForBorderRadiusOutline;
  private @Nullable Path mPathForBorder;
  private @Nullable RectF mTempRectForBorderRadius;
  private @Nullable RectF mTempRectForBorderRadiusOutline;
  private boolean mNeedUpdatePathForBorderRadius = false;
  private float mBorderRadius = YogaConstants.UNDEFINED;

  /* Used by all types of background and for drawing borders */
  private final Paint mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
  private int mColor = Color.TRANSPARENT;
  private int mAlpha = 255;

  private @Nullable float[] mBorderCornerRadii;

  @Override
  public void draw(Canvas canvas) {
    updatePathEffect();
    boolean roundedBorders = mBorderCornerRadii != null ||
        (!YogaConstants.isUndefined(mBorderRadius) && mBorderRadius > 0);

    if (!roundedBorders) {
      drawRectangularBackgroundWithBorders(canvas);
    } else {
      drawRoundedBackgroundWithBorders(canvas);
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
    if ((!YogaConstants.isUndefined(mBorderRadius) && mBorderRadius > 0) || mBorderCornerRadii != null) {
      updatePath();

      outline.setConvexPath(mPathForBorderRadiusOutline);
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

  public void setBorderColor(int position, float rgb, float alpha) {
    this.setBorderRGB(position, rgb);
    this.setBorderAlpha(position, alpha);
  }

  private void setBorderRGB(int position, float rgb) {
    // set RGB component
    if (mBorderRGB == null) {
      mBorderRGB = new Spacing(DEFAULT_BORDER_RGB);
    }
    if (!FloatUtil.floatsEqual(mBorderRGB.getRaw(position), rgb)) {
      mBorderRGB.set(position, rgb);
      invalidateSelf();
    }
  }

  private void setBorderAlpha(int position, float alpha) {
    // set Alpha component
    if (mBorderAlpha == null) {
      mBorderAlpha = new Spacing(DEFAULT_BORDER_ALPHA);
    }
    if (!FloatUtil.floatsEqual(mBorderAlpha.getRaw(position), alpha)) {
      mBorderAlpha.set(position, alpha);
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
    if (!FloatUtil.floatsEqual(mBorderRadius,radius)) {
      mBorderRadius = radius;
      mNeedUpdatePathForBorderRadius = true;
      invalidateSelf();
    }
  }

  public void setRadius(float radius, int position) {
    if (mBorderCornerRadii == null) {
      mBorderCornerRadii = new float[4];
      Arrays.fill(mBorderCornerRadii, YogaConstants.UNDEFINED);
    }

    if (!FloatUtil.floatsEqual(mBorderCornerRadii[position], radius)) {
      mBorderCornerRadii[position] = radius;
      mNeedUpdatePathForBorderRadius = true;
      invalidateSelf();
    }
  }

  public float getRadius() {
    return mBorderRadius;
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
    if (Color.alpha(useColor) != 0) { // color is not transparent
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
      mPathForBorderRadiusOutline = new Path();
      mTempRectForBorderRadiusOutline = new RectF();
    }

    mPathForBorderRadius.reset();
    mPathForBorderRadiusOutline.reset();

    mTempRectForBorderRadius.set(getBounds());
    mTempRectForBorderRadiusOutline.set(getBounds());
    float fullBorderWidth = getFullBorderWidth();
    if (fullBorderWidth > 0) {
      mTempRectForBorderRadius.inset(fullBorderWidth * 0.5f, fullBorderWidth * 0.5f);
    }

    float defaultBorderRadius = !YogaConstants.isUndefined(mBorderRadius) ? mBorderRadius : 0;
    float topLeftRadius = mBorderCornerRadii != null && !YogaConstants.isUndefined(mBorderCornerRadii[0]) ? mBorderCornerRadii[0] : defaultBorderRadius;
    float topRightRadius = mBorderCornerRadii != null && !YogaConstants.isUndefined(mBorderCornerRadii[1]) ? mBorderCornerRadii[1] : defaultBorderRadius;
    float bottomRightRadius = mBorderCornerRadii != null && !YogaConstants.isUndefined(mBorderCornerRadii[2]) ? mBorderCornerRadii[2] : defaultBorderRadius;
    float bottomLeftRadius = mBorderCornerRadii != null && !YogaConstants.isUndefined(mBorderCornerRadii[3]) ? mBorderCornerRadii[3] : defaultBorderRadius;

    mPathForBorderRadius.addRoundRect(
        mTempRectForBorderRadius,
        new float[] {
          topLeftRadius,
          topLeftRadius,
          topRightRadius,
          topRightRadius,
          bottomRightRadius,
          bottomRightRadius,
          bottomLeftRadius,
          bottomLeftRadius
        },
        Path.Direction.CW);

    float extraRadiusForOutline = 0;

    if (mBorderWidth != null) {
      extraRadiusForOutline = mBorderWidth.get(Spacing.ALL) / 2f;
    }

    mPathForBorderRadiusOutline.addRoundRect(
      mTempRectForBorderRadiusOutline,
      new float[] {
        topLeftRadius + extraRadiusForOutline,
        topLeftRadius + extraRadiusForOutline,
        topRightRadius + extraRadiusForOutline,
        topRightRadius + extraRadiusForOutline,
        bottomRightRadius + extraRadiusForOutline,
        bottomRightRadius + extraRadiusForOutline,
        bottomLeftRadius + extraRadiusForOutline,
        bottomLeftRadius + extraRadiusForOutline
      },
      Path.Direction.CW);
  }

  /**
   * Set type of border
   */
  private void updatePathEffect() {
    mPathEffectForBorderStyle = mBorderStyle != null
        ? mBorderStyle.getPathEffect(getFullBorderWidth())
        : null;

    mPaint.setPathEffect(mPathEffectForBorderStyle);
  }

  /** For rounded borders we use default "borderWidth" property. */
  public float getFullBorderWidth() {
    return (mBorderWidth != null && !YogaConstants.isUndefined(mBorderWidth.getRaw(Spacing.ALL))) ?
        mBorderWidth.getRaw(Spacing.ALL) : 0f;
  }

  /**
   * We use this method for getting color for rounded borders only similarly as for
   * {@link #getFullBorderWidth}.
   */
  private int getFullBorderColor() {
    float rgb = (mBorderRGB != null && !YogaConstants.isUndefined(mBorderRGB.getRaw(Spacing.ALL))) ?
        mBorderRGB.getRaw(Spacing.ALL) : DEFAULT_BORDER_RGB;
    float alpha = (mBorderAlpha != null && !YogaConstants.isUndefined(mBorderAlpha.getRaw(Spacing.ALL))) ?
        mBorderAlpha.getRaw(Spacing.ALL) : DEFAULT_BORDER_ALPHA;
    return ReactViewBackgroundDrawable.colorFromAlphaAndRGBComponents(alpha, rgb);
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
      int borderLeft,
      int borderTop,
      int borderRight,
      int borderBottom,
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

  private void drawRectangularBackgroundWithBorders(Canvas canvas) {
    int useColor = ColorUtil.multiplyColorAlpha(mColor, mAlpha);
    if (Color.alpha(useColor) != 0) { // color is not transparent
      mPaint.setColor(useColor);
      mPaint.setStyle(Paint.Style.FILL);
      canvas.drawRect(getBounds(), mPaint);
    }
    // maybe draw borders?
    if (getBorderWidth(Spacing.LEFT) > 0 || getBorderWidth(Spacing.TOP) > 0 ||
        getBorderWidth(Spacing.RIGHT) > 0 || getBorderWidth(Spacing.BOTTOM) > 0) {
      Rect bounds = getBounds();

      int borderLeft = getBorderWidth(Spacing.LEFT);
      int borderTop = getBorderWidth(Spacing.TOP);
      int borderRight = getBorderWidth(Spacing.RIGHT);
      int borderBottom = getBorderWidth(Spacing.BOTTOM);
      int colorLeft = getBorderColor(Spacing.LEFT);
      int colorTop = getBorderColor(Spacing.TOP);
      int colorRight = getBorderColor(Spacing.RIGHT);
      int colorBottom = getBorderColor(Spacing.BOTTOM);

      int left = bounds.left;
      int top = bounds.top;

      // Check for fast path to border drawing.
      int fastBorderColor = fastBorderCompatibleColorOrZero(
          borderLeft,
          borderTop,
          borderRight,
          borderBottom,
          colorLeft,
          colorTop,
          colorRight,
          colorBottom);
      if (fastBorderColor != 0) {
        if (Color.alpha(fastBorderColor) != 0) {
          // Border color is not transparent.
          int right = bounds.right;
          int bottom = bounds.bottom;

          mPaint.setColor(fastBorderColor);
          if (borderLeft > 0) {
            int leftInset = left + borderLeft;
            canvas.drawRect(left, top, leftInset, bottom - borderBottom, mPaint);
          }
          if (borderTop > 0) {
            int topInset = top + borderTop;
            canvas.drawRect(left + borderLeft, top, right, topInset, mPaint);
          }
          if (borderRight > 0) {
            int rightInset = right - borderRight;
            canvas.drawRect(rightInset, top + borderTop, right, bottom, mPaint);
          }
          if (borderBottom > 0) {
            int bottomInset = bottom - borderBottom;
            canvas.drawRect(left, bottomInset, right - borderRight, bottom, mPaint);
          }
        }
      } else {
        if (mPathForBorder == null) {
          mPathForBorder = new Path();
        }

        // If the path drawn previously is of the same color,
        // there would be a slight white space between borders
        // with anti-alias set to true.
        // Therefore we need to disable anti-alias, and
        // after drawing is done, we will re-enable it.

        mPaint.setAntiAlias(false);

        int width = bounds.width();
        int height = bounds.height();

        if (borderLeft > 0 && colorLeft != Color.TRANSPARENT) {
          mPaint.setColor(colorLeft);
          mPathForBorder.reset();
          mPathForBorder.moveTo(left, top);
          mPathForBorder.lineTo(left + borderLeft, top + borderTop);
          mPathForBorder.lineTo(left + borderLeft, top + height - borderBottom);
          mPathForBorder.lineTo(left, top + height);
          mPathForBorder.lineTo(left, top);
          canvas.drawPath(mPathForBorder, mPaint);
        }

        if (borderTop > 0 && colorTop != Color.TRANSPARENT) {
          mPaint.setColor(colorTop);
          mPathForBorder.reset();
          mPathForBorder.moveTo(left, top);
          mPathForBorder.lineTo(left + borderLeft, top + borderTop);
          mPathForBorder.lineTo(left + width - borderRight, top + borderTop);
          mPathForBorder.lineTo(left + width, top);
          mPathForBorder.lineTo(left, top);
          canvas.drawPath(mPathForBorder, mPaint);
        }

        if (borderRight > 0 && colorRight != Color.TRANSPARENT) {
          mPaint.setColor(colorRight);
          mPathForBorder.reset();
          mPathForBorder.moveTo(left + width, top);
          mPathForBorder.lineTo(left + width, top + height);
          mPathForBorder.lineTo(left + width - borderRight, top + height - borderBottom);
          mPathForBorder.lineTo(left + width - borderRight, top + borderTop);
          mPathForBorder.lineTo(left + width, top);
          canvas.drawPath(mPathForBorder, mPaint);
        }

        if (borderBottom > 0 && colorBottom != Color.TRANSPARENT) {
          mPaint.setColor(colorBottom);
          mPathForBorder.reset();
          mPathForBorder.moveTo(left, top + height);
          mPathForBorder.lineTo(left + width, top + height);
          mPathForBorder.lineTo(left + width - borderRight, top + height - borderBottom);
          mPathForBorder.lineTo(left + borderLeft, top + height - borderBottom);
          mPathForBorder.lineTo(left, top + height);
          canvas.drawPath(mPathForBorder, mPaint);
        }

        // re-enable anti alias
        mPaint.setAntiAlias(true);
      }
    }
  }

  private int getBorderWidth(int position) {
    return mBorderWidth != null ? Math.round(mBorderWidth.get(position)) : 0;
  }

  private static int colorFromAlphaAndRGBComponents(float alpha, float rgb) {
    int rgbComponent = 0x00FFFFFF & (int)rgb;
    int alphaComponent = 0xFF000000 & ((int)alpha) << 24;

    return rgbComponent | alphaComponent;
  }

  private int getBorderColor(int position) {
    float rgb = mBorderRGB != null ? mBorderRGB.get(position) : DEFAULT_BORDER_RGB;
    float alpha = mBorderAlpha != null ? mBorderAlpha.get(position) : DEFAULT_BORDER_ALPHA;

    return ReactViewBackgroundDrawable.colorFromAlphaAndRGBComponents(alpha, rgb);
  }
}
