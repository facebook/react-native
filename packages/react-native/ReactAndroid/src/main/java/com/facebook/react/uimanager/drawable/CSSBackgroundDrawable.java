/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.ComposeShader;
import android.graphics.DashPathEffect;
import android.graphics.Outline;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PathEffect;
import android.graphics.PixelFormat;
import android.graphics.PointF;
import android.graphics.PorterDuff;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Region;
import android.graphics.Shader;
import android.graphics.drawable.Drawable;
import android.view.View;
import androidx.annotation.Nullable;
import androidx.core.graphics.ColorUtils;
import androidx.core.util.Preconditions;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.FloatUtil;
import com.facebook.react.uimanager.LengthPercentage;
import com.facebook.react.uimanager.LengthPercentageType;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.style.BackgroundImageLayer;
import com.facebook.react.uimanager.style.BorderRadiusProp;
import com.facebook.react.uimanager.style.BorderRadiusStyle;
import com.facebook.react.uimanager.style.BorderStyle;
import com.facebook.react.uimanager.style.ComputedBorderRadius;
import com.facebook.react.uimanager.style.CornerRadii;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * A subclass of {@link Drawable} used for background of {@link
 * com.facebook.react.views.view.ReactViewGroup}. It supports drawing background color and borders
 * (including rounded borders) by providing a react friendly API (setter for each of those
 * properties).
 *
 * <p>The implementation tries to allocate as few objects as possible depending on which properties
 * are set. E.g. for views with rounded background/borders we allocate {@code
 * mInnerClipPathForBorderRadius} and {@code mInnerClipTempRectForBorderRadius}. In case when view
 * have a rectangular borders we allocate {@code mBorderWidthResult} and similar. When only
 * background color is set we won't allocate any extra/unnecessary objects.
 */
@UnstableReactNativeAPI
@Nullsafe(Nullsafe.Mode.LOCAL)
public class CSSBackgroundDrawable extends Drawable {

  private static final int DEFAULT_BORDER_COLOR = Color.BLACK;
  private static final int DEFAULT_BORDER_RGB = 0x00FFFFFF & DEFAULT_BORDER_COLOR;
  private static final int DEFAULT_BORDER_ALPHA = (0xFF000000 & DEFAULT_BORDER_COLOR) >>> 24;
  // ~0 == 0xFFFFFFFF, all bits set to 1.
  private static final int ALL_BITS_SET = ~0;
  // 0 == 0x00000000, all bits set to 0.
  private static final int ALL_BITS_UNSET = 0;

  private static @Nullable PathEffect getPathEffect(BorderStyle style, float borderWidth) {
    switch (style) {
      case SOLID:
        return null;

      case DASHED:
        return new DashPathEffect(
            new float[] {borderWidth * 3, borderWidth * 3, borderWidth * 3, borderWidth * 3}, 0);

      case DOTTED:
        return new DashPathEffect(
            new float[] {borderWidth, borderWidth, borderWidth, borderWidth}, 0);

      default:
        return null;
    }
  }

  /* Value at Spacing.ALL index used for rounded borders, whole array used by rectangular borders */
  private @Nullable Spacing mBorderWidth;
  private @Nullable Spacing mBorderRGB;
  private @Nullable Spacing mBorderAlpha;
  private @Nullable BorderStyle mBorderStyle;

  private @Nullable Path mInnerClipPathForBorderRadius;
  private @Nullable Path mBackgroundColorRenderPath;
  private @Nullable Path mOuterClipPathForBorderRadius;
  private @Nullable Path mPathForBorderRadiusOutline;
  private @Nullable Path mPathForBorder;
  private final Path mPathForSingleBorder = new Path();
  private @Nullable Path mCenterDrawPath;
  private @Nullable RectF mInnerClipTempRectForBorderRadius;
  private @Nullable RectF mOuterClipTempRectForBorderRadius;
  private @Nullable RectF mTempRectForBorderRadiusOutline;
  private @Nullable RectF mTempRectForCenterDrawPath;
  private @Nullable PointF mInnerTopLeftCorner;
  private @Nullable PointF mInnerTopRightCorner;
  private @Nullable PointF mInnerBottomRightCorner;
  private @Nullable PointF mInnerBottomLeftCorner;
  private boolean mNeedUpdatePathForBorderRadius = false;

  /* Used by all types of background and for drawing borders */
  private final Paint mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
  private int mColor = Color.TRANSPARENT;
  private @Nullable List<BackgroundImageLayer> mBackgroundImageLayers = null;
  private int mAlpha = 255;

  // There is a small gap between the edges of adjacent paths
  // such as between the mBackgroundColorRenderPath and its border.
  // The smallest amount (found to be 0.8f) is used to extend
  // the paths, overlapping them and closing the visible gap.
  private final float mGapBetweenPaths = 0.8f;

  private BorderRadiusStyle mBorderRadius = new BorderRadiusStyle();
  private ComputedBorderRadius mComputedBorderRadius = new ComputedBorderRadius();
  private final Context mContext;

  // Should be removed after migrating to Android layout direction.
  private int mLayoutDirectionOverride = -1;

  public CSSBackgroundDrawable(Context context) {
    mContext = context;
  }

  @Override
  public void draw(Canvas canvas) {
    updatePathEffect();
    if (!hasRoundedBorders()) {
      drawRectangularBackgroundWithBorders(canvas);
    } else {
      drawRoundedBackgroundWithBorders(canvas);
    }
  }

  public boolean hasRoundedBorders() {
    return mBorderRadius.hasRoundedBorders();
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

  @Deprecated
  public void setLayoutDirectionOverride(int layoutDirection) {
    if (mLayoutDirectionOverride != layoutDirection) {
      mLayoutDirectionOverride = layoutDirection;
    }
  }

  @Override
  @SuppressLint("WrongConstant")
  public int getLayoutDirection() {
    return mLayoutDirectionOverride == -1 ? super.getLayoutDirection() : mLayoutDirectionOverride;
  }

  @Override
  public int getOpacity() {
    int alpha = (Color.alpha(mColor) * mAlpha) >> 8;
    switch (alpha) {
      case 255:
        return PixelFormat.OPAQUE;
      case 0:
        return PixelFormat.TRANSPARENT;
      default:
        return PixelFormat.TRANSLUCENT;
    }
  }

  /* Android's elevation implementation requires this to be implemented to know where to draw the shadow. */
  @Override
  public void getOutline(Outline outline) {
    if (hasRoundedBorders()) {
      updatePath();

      outline.setConvexPath(Preconditions.checkNotNull(mPathForBorderRadiusOutline));
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
      switch (position) {
        case Spacing.ALL:
        case Spacing.LEFT:
        case Spacing.BOTTOM:
        case Spacing.RIGHT:
        case Spacing.TOP:
        case Spacing.START:
        case Spacing.END:
          mNeedUpdatePathForBorderRadius = true;
      }
      invalidateSelf();
    }
  }

  public void setBorderColor(int position, @Nullable Integer color) {
    float rgbComponent = color == null ? Float.NaN : (float) ((int) color & 0x00FFFFFF);
    float alphaComponent = color == null ? Float.NaN : (float) ((int) color >>> 24);

    this.setBorderRGB(position, rgbComponent);
    this.setBorderAlpha(position, alphaComponent);
    mNeedUpdatePathForBorderRadius = true;
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
    BorderStyle borderStyle =
        style == null ? null : BorderStyle.valueOf(style.toUpperCase(Locale.US));
    setBorderStyle(borderStyle);
  }

  public void setBorderStyle(@Nullable BorderStyle borderStyle) {
    if (mBorderStyle != borderStyle) {
      mBorderStyle = borderStyle;
      mNeedUpdatePathForBorderRadius = true;
      invalidateSelf();
    }
  }

  public @Nullable BorderStyle getBorderStyle() {
    return mBorderStyle;
  }

  /**
   * @deprecated Use {@link #setBorderRadius(BorderRadiusProp, LengthPercentage)} instead.
   */
  @Deprecated(since = "0.75.0", forRemoval = true)
  public void setRadius(float radius) {
    @Nullable Float boxedRadius = Float.isNaN(radius) ? null : Float.valueOf(radius);
    if (boxedRadius == null) {
      setBorderRadius(BorderRadiusProp.BORDER_RADIUS, null);
    } else {
      setBorderRadius(
          BorderRadiusProp.BORDER_RADIUS,
          new LengthPercentage(boxedRadius, LengthPercentageType.POINT));
    }
  }

  /**
   * @deprecated Use {@link #setBorderRadius(BorderRadiusProp, LengthPercentage)} instead.
   */
  @Deprecated(since = "0.75.0", forRemoval = true)
  public void setRadius(float radius, int position) {
    @Nullable Float boxedRadius = Float.isNaN(radius) ? null : Float.valueOf(radius);

    if (boxedRadius == null) {
      mBorderRadius.set(BorderRadiusProp.values()[position], null);
      invalidateSelf();
    } else {
      setBorderRadius(
          BorderRadiusProp.values()[position],
          new LengthPercentage(boxedRadius, LengthPercentageType.POINT));
    }
  }

  public void setBorderRadius(BorderRadiusProp property, @Nullable LengthPercentage radius) {
    if (!Objects.equals(radius, mBorderRadius.get(property))) {
      mBorderRadius.set(property, radius);
      mNeedUpdatePathForBorderRadius = true;
      invalidateSelf();
    }
  }

  public void setBorderRadius(BorderRadiusStyle radius) {
    mBorderRadius = radius;
  }

  public BorderRadiusStyle getBorderRadius() {
    return mBorderRadius;
  }

  // Here, "inner" refers to the border radius on the inside of the border. So
  // it ends up being the "outer" border radius inset by the respective width.
  public float getInnerBorderRadius(float computedRadius, float borderWidth) {
    return Math.max(computedRadius - borderWidth, 0);
  }

  public void setColor(int color) {
    mColor = color;
    invalidateSelf();
  }

  public void setBackgroundImage(@Nullable List<BackgroundImageLayer> backgroundImageLayers) {
    mBackgroundImageLayers = backgroundImageLayers;
    invalidateSelf();
  }

  @VisibleForTesting
  public int getColor() {
    return mColor;
  }

  public @Nullable Path getBorderBoxPath() {
    if (hasRoundedBorders()) {
      updatePath();
      return new Path(Preconditions.checkNotNull(mOuterClipPathForBorderRadius));
    }

    return null;
  }

  public RectF getBorderBoxRect() {
    return new RectF(getBounds());
  }

  public @Nullable Path getPaddingBoxPath() {
    if (hasRoundedBorders()) {
      updatePath();
      return new Path(Preconditions.checkNotNull(mInnerClipPathForBorderRadius));
    }

    return null;
  }

  public RectF getPaddingBoxRect() {
    @Nullable RectF insets = getDirectionAwareBorderInsets();
    if (insets == null) {
      return new RectF(0, 0, getBounds().width(), getBounds().height());
    }

    return new RectF(
        insets.left,
        insets.top,
        getBounds().width() - insets.right,
        getBounds().height() - insets.bottom);
  }

  private void drawRoundedBackgroundWithBorders(Canvas canvas) {
    updatePath();
    canvas.save();

    // Clip outer border
    canvas.clipPath(Preconditions.checkNotNull(mOuterClipPathForBorderRadius), Region.Op.INTERSECT);

    // Draws the View without its border first (with background color fill)
    int useColor = ColorUtils.setAlphaComponent(mColor, (Color.alpha(mColor) * mAlpha) >> 8);
    if (Color.alpha(useColor) != 0) {
      mPaint.setColor(useColor);
      mPaint.setStyle(Paint.Style.FILL);
      canvas.drawPath(Preconditions.checkNotNull(mBackgroundColorRenderPath), mPaint);
    }

    if (mBackgroundImageLayers != null && !mBackgroundImageLayers.isEmpty()) {
      mPaint.setShader(getBackgroundImageShader());
      mPaint.setStyle(Paint.Style.FILL);
      canvas.drawPath(Preconditions.checkNotNull(mBackgroundColorRenderPath), mPaint);
      mPaint.setShader(null);
    }

    final RectF borderWidth = getDirectionAwareBorderInsets();
    int colorLeft = getBorderColor(Spacing.LEFT);
    int colorTop = getBorderColor(Spacing.TOP);
    int colorRight = getBorderColor(Spacing.RIGHT);
    int colorBottom = getBorderColor(Spacing.BOTTOM);

    int colorBlock = getBorderColor(Spacing.BLOCK);
    int colorBlockStart = getBorderColor(Spacing.BLOCK_START);
    int colorBlockEnd = getBorderColor(Spacing.BLOCK_END);

    if (isBorderColorDefined(Spacing.BLOCK)) {
      colorBottom = colorBlock;
      colorTop = colorBlock;
    }
    if (isBorderColorDefined(Spacing.BLOCK_END)) {
      colorBottom = colorBlockEnd;
    }
    if (isBorderColorDefined(Spacing.BLOCK_START)) {
      colorTop = colorBlockStart;
    }

    if (borderWidth.top > 0
        || borderWidth.bottom > 0
        || borderWidth.left > 0
        || borderWidth.right > 0) {

      // If it's a full and even border draw inner rect path with stroke
      final float fullBorderWidth = getFullBorderWidth();
      int borderColor = getBorderColor(Spacing.ALL);
      if (borderWidth.top == fullBorderWidth
          && borderWidth.bottom == fullBorderWidth
          && borderWidth.left == fullBorderWidth
          && borderWidth.right == fullBorderWidth
          && colorLeft == borderColor
          && colorTop == borderColor
          && colorRight == borderColor
          && colorBottom == borderColor) {
        if (fullBorderWidth > 0) {
          mPaint.setColor(multiplyColorAlpha(borderColor, mAlpha));
          mPaint.setStyle(Paint.Style.STROKE);
          mPaint.setStrokeWidth(fullBorderWidth);
          canvas.drawPath(Preconditions.checkNotNull(mCenterDrawPath), mPaint);
        }
      }
      // In the case of uneven border widths/colors draw quadrilateral in each direction
      else {
        mPaint.setStyle(Paint.Style.FILL);

        // Clip inner border
        canvas.clipPath(
            Preconditions.checkNotNull(mInnerClipPathForBorderRadius), Region.Op.DIFFERENCE);

        final boolean isRTL = getLayoutDirection() == View.LAYOUT_DIRECTION_RTL;
        int colorStart = getBorderColor(Spacing.START);
        int colorEnd = getBorderColor(Spacing.END);

        if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(mContext)) {
          if (!isBorderColorDefined(Spacing.START)) {
            colorStart = colorLeft;
          }

          if (!isBorderColorDefined(Spacing.END)) {
            colorEnd = colorRight;
          }

          final int directionAwareColorLeft = isRTL ? colorEnd : colorStart;
          final int directionAwareColorRight = isRTL ? colorStart : colorEnd;

          colorLeft = directionAwareColorLeft;
          colorRight = directionAwareColorRight;
        } else {
          final int directionAwareColorLeft = isRTL ? colorEnd : colorStart;
          final int directionAwareColorRight = isRTL ? colorStart : colorEnd;

          final boolean isColorStartDefined = isBorderColorDefined(Spacing.START);
          final boolean isColorEndDefined = isBorderColorDefined(Spacing.END);
          final boolean isDirectionAwareColorLeftDefined =
              isRTL ? isColorEndDefined : isColorStartDefined;
          final boolean isDirectionAwareColorRightDefined =
              isRTL ? isColorStartDefined : isColorEndDefined;

          if (isDirectionAwareColorLeftDefined) {
            colorLeft = directionAwareColorLeft;
          }

          if (isDirectionAwareColorRightDefined) {
            colorRight = directionAwareColorRight;
          }
        }

        final RectF outerClipTempRect =
            Preconditions.checkNotNull(mOuterClipTempRectForBorderRadius);
        final float left = outerClipTempRect.left;
        final float right = outerClipTempRect.right;
        final float top = outerClipTempRect.top;
        final float bottom = outerClipTempRect.bottom;

        final PointF innerTopLeftCorner = Preconditions.checkNotNull(mInnerTopLeftCorner);
        final PointF innerTopRightCorner = Preconditions.checkNotNull(mInnerTopRightCorner);
        final PointF innerBottomLeftCorner = Preconditions.checkNotNull(mInnerBottomLeftCorner);
        final PointF innerBottomRightCorner = Preconditions.checkNotNull(mInnerBottomRightCorner);

        // mGapBetweenPaths is used to close the gap between the diagonal
        // edges of the quadrilaterals on adjacent sides of the rectangle
        if (borderWidth.left > 0) {
          final float x1 = left;
          final float y1 = top - mGapBetweenPaths;
          final float x2 = innerTopLeftCorner.x;
          final float y2 = innerTopLeftCorner.y - mGapBetweenPaths;
          final float x3 = innerBottomLeftCorner.x;
          final float y3 = innerBottomLeftCorner.y + mGapBetweenPaths;
          final float x4 = left;
          final float y4 = bottom + mGapBetweenPaths;

          drawQuadrilateral(canvas, colorLeft, x1, y1, x2, y2, x3, y3, x4, y4);
        }

        if (borderWidth.top > 0) {
          final float x1 = left - mGapBetweenPaths;
          final float y1 = top;
          final float x2 = innerTopLeftCorner.x - mGapBetweenPaths;
          final float y2 = innerTopLeftCorner.y;
          final float x3 = innerTopRightCorner.x + mGapBetweenPaths;
          final float y3 = innerTopRightCorner.y;
          final float x4 = right + mGapBetweenPaths;
          final float y4 = top;

          drawQuadrilateral(canvas, colorTop, x1, y1, x2, y2, x3, y3, x4, y4);
        }

        if (borderWidth.right > 0) {
          final float x1 = right;
          final float y1 = top - mGapBetweenPaths;
          final float x2 = innerTopRightCorner.x;
          final float y2 = innerTopRightCorner.y - mGapBetweenPaths;
          final float x3 = innerBottomRightCorner.x;
          final float y3 = innerBottomRightCorner.y + mGapBetweenPaths;
          final float x4 = right;
          final float y4 = bottom + mGapBetweenPaths;

          drawQuadrilateral(canvas, colorRight, x1, y1, x2, y2, x3, y3, x4, y4);
        }

        if (borderWidth.bottom > 0) {
          final float x1 = left - mGapBetweenPaths;
          final float y1 = bottom;
          final float x2 = innerBottomLeftCorner.x - mGapBetweenPaths;
          final float y2 = innerBottomLeftCorner.y;
          final float x3 = innerBottomRightCorner.x + mGapBetweenPaths;
          final float y3 = innerBottomRightCorner.y;
          final float x4 = right + mGapBetweenPaths;
          final float y4 = bottom;

          drawQuadrilateral(canvas, colorBottom, x1, y1, x2, y2, x3, y3, x4, y4);
        }
      }
    }

    canvas.restore();
  }

  private void updatePath() {
    if (!mNeedUpdatePathForBorderRadius) {
      return;
    }

    mNeedUpdatePathForBorderRadius = false;

    if (mInnerClipPathForBorderRadius == null) {
      mInnerClipPathForBorderRadius = new Path();
    }

    if (mBackgroundColorRenderPath == null) {
      mBackgroundColorRenderPath = new Path();
    }

    if (mOuterClipPathForBorderRadius == null) {
      mOuterClipPathForBorderRadius = new Path();
    }

    if (mPathForBorderRadiusOutline == null) {
      mPathForBorderRadiusOutline = new Path();
    }

    if (mCenterDrawPath == null) {
      mCenterDrawPath = new Path();
    }

    if (mInnerClipTempRectForBorderRadius == null) {
      mInnerClipTempRectForBorderRadius = new RectF();
    }

    if (mOuterClipTempRectForBorderRadius == null) {
      mOuterClipTempRectForBorderRadius = new RectF();
    }

    if (mTempRectForBorderRadiusOutline == null) {
      mTempRectForBorderRadiusOutline = new RectF();
    }

    if (mTempRectForCenterDrawPath == null) {
      mTempRectForCenterDrawPath = new RectF();
    }

    mInnerClipPathForBorderRadius.reset();
    mBackgroundColorRenderPath.reset();
    mOuterClipPathForBorderRadius.reset();
    mPathForBorderRadiusOutline.reset();
    mCenterDrawPath.reset();

    mInnerClipTempRectForBorderRadius.set(getBounds());
    mOuterClipTempRectForBorderRadius.set(getBounds());
    mTempRectForBorderRadiusOutline.set(getBounds());
    mTempRectForCenterDrawPath.set(getBounds());

    final RectF borderWidth = getDirectionAwareBorderInsets();

    int colorLeft = getBorderColor(Spacing.LEFT);
    int colorTop = getBorderColor(Spacing.TOP);
    int colorRight = getBorderColor(Spacing.RIGHT);
    int colorBottom = getBorderColor(Spacing.BOTTOM);
    int borderColor = getBorderColor(Spacing.ALL);

    int colorBlock = getBorderColor(Spacing.BLOCK);
    int colorBlockStart = getBorderColor(Spacing.BLOCK_START);
    int colorBlockEnd = getBorderColor(Spacing.BLOCK_END);

    if (isBorderColorDefined(Spacing.BLOCK)) {
      colorBottom = colorBlock;
      colorTop = colorBlock;
    }
    if (isBorderColorDefined(Spacing.BLOCK_END)) {
      colorBottom = colorBlockEnd;
    }
    if (isBorderColorDefined(Spacing.BLOCK_START)) {
      colorTop = colorBlockStart;
    }

    // Clip border ONLY if at least one edge is non-transparent
    float pathAdjustment = 0f;
    if (Color.alpha(colorLeft) != 0
        || Color.alpha(colorTop) != 0
        || Color.alpha(colorRight) != 0
        || Color.alpha(colorBottom) != 0
        || Color.alpha(borderColor) != 0) {

      mInnerClipTempRectForBorderRadius.top += borderWidth.top;
      mInnerClipTempRectForBorderRadius.bottom -= borderWidth.bottom;
      mInnerClipTempRectForBorderRadius.left += borderWidth.left;
      mInnerClipTempRectForBorderRadius.right -= borderWidth.right;

      // only close gap between border and main path if we draw the border, otherwise
      // we wind up pixelating small pixel-radius curves
      pathAdjustment = mGapBetweenPaths;
    }

    mTempRectForCenterDrawPath.top += borderWidth.top * 0.5f;
    mTempRectForCenterDrawPath.bottom -= borderWidth.bottom * 0.5f;
    mTempRectForCenterDrawPath.left += borderWidth.left * 0.5f;
    mTempRectForCenterDrawPath.right -= borderWidth.right * 0.5f;

    mComputedBorderRadius =
        mBorderRadius.resolve(
            getLayoutDirection(),
            mContext,
            PixelUtil.toDIPFromPixel(mOuterClipTempRectForBorderRadius.width()),
            PixelUtil.toDIPFromPixel(mOuterClipTempRectForBorderRadius.height()));
    CornerRadii topLeftRadius = mComputedBorderRadius.getTopLeft().toPixelFromDIP();
    CornerRadii topRightRadius = mComputedBorderRadius.getTopRight().toPixelFromDIP();
    CornerRadii bottomLeftRadius = mComputedBorderRadius.getBottomLeft().toPixelFromDIP();
    CornerRadii bottomRightRadius = mComputedBorderRadius.getBottomRight().toPixelFromDIP();

    final float innerTopLeftRadiusX =
        getInnerBorderRadius(topLeftRadius.getHorizontal(), borderWidth.left);
    final float innerTopLeftRadiusY =
        getInnerBorderRadius(topLeftRadius.getVertical(), borderWidth.top);
    final float innerTopRightRadiusX =
        getInnerBorderRadius(topRightRadius.getHorizontal(), borderWidth.right);
    final float innerTopRightRadiusY =
        getInnerBorderRadius(topRightRadius.getVertical(), borderWidth.top);
    final float innerBottomRightRadiusX =
        getInnerBorderRadius(bottomRightRadius.getHorizontal(), borderWidth.right);
    final float innerBottomRightRadiusY =
        getInnerBorderRadius(bottomRightRadius.getVertical(), borderWidth.bottom);
    final float innerBottomLeftRadiusX =
        getInnerBorderRadius(bottomLeftRadius.getHorizontal(), borderWidth.left);
    final float innerBottomLeftRadiusY =
        getInnerBorderRadius(bottomLeftRadius.getVertical(), borderWidth.bottom);

    mInnerClipPathForBorderRadius.addRoundRect(
        mInnerClipTempRectForBorderRadius,
        new float[] {
          innerTopLeftRadiusX,
          innerTopLeftRadiusY,
          innerTopRightRadiusX,
          innerTopRightRadiusY,
          innerBottomRightRadiusX,
          innerBottomRightRadiusY,
          innerBottomLeftRadiusX,
          innerBottomLeftRadiusY,
        },
        Path.Direction.CW);

    // There is a small gap between mBackgroundColorRenderPath and its
    // border. mGapBetweenPaths is used to slightly enlarge the rectangle
    // (mInnerClipTempRectForBorderRadius), ensuring the border can be
    // drawn on top without the gap.
    mBackgroundColorRenderPath.addRoundRect(
        mInnerClipTempRectForBorderRadius.left - pathAdjustment,
        mInnerClipTempRectForBorderRadius.top - pathAdjustment,
        mInnerClipTempRectForBorderRadius.right + pathAdjustment,
        mInnerClipTempRectForBorderRadius.bottom + pathAdjustment,
        new float[] {
          innerTopLeftRadiusX,
          innerTopLeftRadiusY,
          innerTopRightRadiusX,
          innerTopRightRadiusY,
          innerBottomRightRadiusX,
          innerBottomRightRadiusY,
          innerBottomLeftRadiusX,
          innerBottomLeftRadiusY,
        },
        Path.Direction.CW);

    mOuterClipPathForBorderRadius.addRoundRect(
        mOuterClipTempRectForBorderRadius,
        new float[] {
          topLeftRadius.getHorizontal(),
          topLeftRadius.getVertical(),
          topRightRadius.getHorizontal(),
          topRightRadius.getVertical(),
          bottomRightRadius.getHorizontal(),
          bottomRightRadius.getVertical(),
          bottomLeftRadius.getHorizontal(),
          bottomLeftRadius.getVertical()
        },
        Path.Direction.CW);

    float extraRadiusForOutline = 0;

    if (mBorderWidth != null) {
      extraRadiusForOutline = mBorderWidth.get(Spacing.ALL) / 2f;
    }

    mPathForBorderRadiusOutline.addRoundRect(
        mTempRectForBorderRadiusOutline,
        new float[] {
          topLeftRadius.getHorizontal() + extraRadiusForOutline,
          topLeftRadius.getVertical() + extraRadiusForOutline,
          topRightRadius.getHorizontal() + extraRadiusForOutline,
          topRightRadius.getVertical() + extraRadiusForOutline,
          bottomRightRadius.getHorizontal() + extraRadiusForOutline,
          bottomRightRadius.getVertical() + extraRadiusForOutline,
          bottomLeftRadius.getHorizontal() + extraRadiusForOutline,
          bottomLeftRadius.getVertical() + extraRadiusForOutline
        },
        Path.Direction.CW);

    mCenterDrawPath.addRoundRect(
        mTempRectForCenterDrawPath,
        new float[] {
          topLeftRadius.getHorizontal() - borderWidth.left * 0.5f,
          topLeftRadius.getVertical() - borderWidth.top * 0.5f,
          topRightRadius.getHorizontal() - borderWidth.right * 0.5f,
          topRightRadius.getVertical() - borderWidth.top * 0.5f,
          bottomRightRadius.getHorizontal() - borderWidth.right * 0.5f,
          bottomRightRadius.getVertical() - borderWidth.bottom * 0.5f,
          bottomLeftRadius.getHorizontal() - borderWidth.left * 0.5f,
          bottomLeftRadius.getVertical() - borderWidth.bottom * 0.5f,
        },
        Path.Direction.CW);

    /**
     * Rounded Multi-Colored Border Algorithm:
     *
     * <p>Let O (for outer) = (top, left, bottom, right) be the rectangle that represents the size
     * and position of a view V. Since the box-sizing of all React Native views is border-box, any
     * border of V will render inside O.
     *
     * <p>Let BorderWidth = (borderTop, borderLeft, borderBottom, borderRight).
     *
     * <p>Let I (for inner) = O - BorderWidth.
     *
     * <p>Then, remembering that O and I are rectangles and that I is inside O, O - I gives us the
     * border of V. Therefore, we can use canvas.clipPath to draw V's border.
     *
     * <p>canvas.clipPath(O, Region.OP.INTERSECT);
     *
     * <p>canvas.clipPath(I, Region.OP.DIFFERENCE);
     *
     * <p>canvas.drawRect(O, paint);
     *
     * <p>This lets us draw non-rounded single-color borders.
     *
     * <p>To extend this algorithm to rounded single-color borders, we:
     *
     * <p>1. Curve the corners of O by the (border radii of V) using Path#addRoundRect.
     *
     * <p>2. Curve the corners of I by (border radii of V - border widths of V) using
     * Path#addRoundRect.
     *
     * <p>Let O' = curve(O, border radii of V).
     *
     * <p>Let I' = curve(I, border radii of V - border widths of V)
     *
     * <p>The rationale behind this decision is the (first sentence of the) following section in the
     * CSS Backgrounds and Borders Module Level 3:
     * https://www.w3.org/TR/css3-background/#the-border-radius.
     *
     * <p>After both O and I have been curved, we can execute the following lines once again to
     * render curved single-color borders:
     *
     * <p>canvas.clipPath(O, Region.OP.INTERSECT);
     *
     * <p>canvas.clipPath(I, Region.OP.DIFFERENCE);
     *
     * <p>canvas.drawRect(O, paint);
     *
     * <p>To extend this algorithm to rendering multi-colored rounded borders, we render each side
     * of the border as its own quadrilateral. Suppose that we were handling the case where all the
     * border radii are 0. Then, the four quadrilaterals would be:
     *
     * <p>Left: (O.left, O.top), (I.left, I.top), (I.left, I.bottom), (O.left, O.bottom)
     *
     * <p>Top: (O.left, O.top), (I.left, I.top), (I.right, I.top), (O.right, O.top)
     *
     * <p>Right: (O.right, O.top), (I.right, I.top), (I.right, I.bottom), (O.right, O.bottom)
     *
     * <p>Bottom: (O.right, O.bottom), (I.right, I.bottom), (I.left, I.bottom), (O.left, O.bottom)
     *
     * <p>Now, lets consider what happens when we render a rounded border (radii != 0). For the sake
     * of simplicity, let's focus on the top edge of the Left border:
     *
     * <p>Let borderTopLeftRadius = 5. Let borderLeftWidth = 1. Let borderTopWidth = 2.
     *
     * <p>We know that O is curved by the ellipse E_O (a = 5, b = 5). We know that I is curved by
     * the ellipse E_I (a = 5 - 1, b = 5 - 2).
     *
     * <p>Since we have clipping, it should be safe to set the top-left point of the Left
     * quadrilateral's top edge to (O.left, O.top).
     *
     * <p>But, what should the top-right point be?
     *
     * <p>The fact that the border is curved shouldn't change the slope (nor the position) of the
     * line connecting the top-left and top-right points of the Left quadrilateral's top edge.
     * Therefore, The top-right point should lie somewhere on the line L = (1 - a) * (O.left, O.top)
     * + a * (I.left, I.top).
     *
     * <p>a != 0, because then the top-left and top-right points would be the same and
     * borderLeftWidth = 1. a != 1, because then the top-right point would not touch an edge of the
     * ellipse E_I. We want the top-right point to touch an edge of the inner ellipse because the
     * border curves with E_I on the top-left corner of V.
     *
     * <p>Therefore, it must be the case that a > 1. Two natural locations of the top-right point
     * exist: 1. The first intersection of L with E_I. 2. The second intersection of L with E_I.
     *
     * <p>We choose the top-right point of the top edge of the Left quadrilateral to be an arbitrary
     * intersection of L with E_I.
     */
    if (mInnerTopLeftCorner == null) {
      mInnerTopLeftCorner = new PointF();
    }

    /** Compute mInnerTopLeftCorner */
    mInnerTopLeftCorner.x = mInnerClipTempRectForBorderRadius.left;
    mInnerTopLeftCorner.y = mInnerClipTempRectForBorderRadius.top;

    getEllipseIntersectionWithLine(
        // Ellipse Bounds
        mInnerClipTempRectForBorderRadius.left,
        mInnerClipTempRectForBorderRadius.top,
        mInnerClipTempRectForBorderRadius.left + 2 * innerTopLeftRadiusX,
        mInnerClipTempRectForBorderRadius.top + 2 * innerTopLeftRadiusY,

        // Line Start
        mOuterClipTempRectForBorderRadius.left,
        mOuterClipTempRectForBorderRadius.top,

        // Line End
        mInnerClipTempRectForBorderRadius.left,
        mInnerClipTempRectForBorderRadius.top,

        // Result
        mInnerTopLeftCorner);

    /** Compute mInnerBottomLeftCorner */
    if (mInnerBottomLeftCorner == null) {
      mInnerBottomLeftCorner = new PointF();
    }

    mInnerBottomLeftCorner.x = mInnerClipTempRectForBorderRadius.left;
    mInnerBottomLeftCorner.y = mInnerClipTempRectForBorderRadius.bottom;

    getEllipseIntersectionWithLine(
        // Ellipse Bounds
        mInnerClipTempRectForBorderRadius.left,
        mInnerClipTempRectForBorderRadius.bottom - 2 * innerBottomLeftRadiusY,
        mInnerClipTempRectForBorderRadius.left + 2 * innerBottomLeftRadiusX,
        mInnerClipTempRectForBorderRadius.bottom,

        // Line Start
        mOuterClipTempRectForBorderRadius.left,
        mOuterClipTempRectForBorderRadius.bottom,

        // Line End
        mInnerClipTempRectForBorderRadius.left,
        mInnerClipTempRectForBorderRadius.bottom,

        // Result
        mInnerBottomLeftCorner);

    /** Compute mInnerTopRightCorner */
    if (mInnerTopRightCorner == null) {
      mInnerTopRightCorner = new PointF();
    }

    mInnerTopRightCorner.x = mInnerClipTempRectForBorderRadius.right;
    mInnerTopRightCorner.y = mInnerClipTempRectForBorderRadius.top;

    getEllipseIntersectionWithLine(
        // Ellipse Bounds
        mInnerClipTempRectForBorderRadius.right - 2 * innerTopRightRadiusX,
        mInnerClipTempRectForBorderRadius.top,
        mInnerClipTempRectForBorderRadius.right,
        mInnerClipTempRectForBorderRadius.top + 2 * innerTopRightRadiusY,

        // Line Start
        mOuterClipTempRectForBorderRadius.right,
        mOuterClipTempRectForBorderRadius.top,

        // Line End
        mInnerClipTempRectForBorderRadius.right,
        mInnerClipTempRectForBorderRadius.top,

        // Result
        mInnerTopRightCorner);

    /** Compute mInnerBottomRightCorner */
    if (mInnerBottomRightCorner == null) {
      mInnerBottomRightCorner = new PointF();
    }

    mInnerBottomRightCorner.x = mInnerClipTempRectForBorderRadius.right;
    mInnerBottomRightCorner.y = mInnerClipTempRectForBorderRadius.bottom;

    getEllipseIntersectionWithLine(
        // Ellipse Bounds
        mInnerClipTempRectForBorderRadius.right - 2 * innerBottomRightRadiusX,
        mInnerClipTempRectForBorderRadius.bottom - 2 * innerBottomRightRadiusY,
        mInnerClipTempRectForBorderRadius.right,
        mInnerClipTempRectForBorderRadius.bottom,

        // Line Start
        mOuterClipTempRectForBorderRadius.right,
        mOuterClipTempRectForBorderRadius.bottom,

        // Line End
        mInnerClipTempRectForBorderRadius.right,
        mInnerClipTempRectForBorderRadius.bottom,

        // Result
        mInnerBottomRightCorner);
  }

  private static void getEllipseIntersectionWithLine(
      double ellipseBoundsLeft,
      double ellipseBoundsTop,
      double ellipseBoundsRight,
      double ellipseBoundsBottom,
      double lineStartX,
      double lineStartY,
      double lineEndX,
      double lineEndY,
      PointF result) {
    final double ellipseCenterX = (ellipseBoundsLeft + ellipseBoundsRight) / 2;
    final double ellipseCenterY = (ellipseBoundsTop + ellipseBoundsBottom) / 2;

    /**
     * Step 1:
     *
     * <p>Translate the line so that the ellipse is at the origin.
     *
     * <p>Why? It makes the math easier by changing the ellipse equation from ((x -
     * ellipseCenterX)/a)^2 + ((y - ellipseCenterY)/b)^2 = 1 to (x/a)^2 + (y/b)^2 = 1.
     */
    lineStartX -= ellipseCenterX;
    lineStartY -= ellipseCenterY;
    lineEndX -= ellipseCenterX;
    lineEndY -= ellipseCenterY;

    /**
     * Step 2:
     *
     * <p>Ellipse equation: (x/a)^2 + (y/b)^2 = 1 Line equation: y = mx + c
     */
    final double a = Math.abs(ellipseBoundsRight - ellipseBoundsLeft) / 2;
    final double b = Math.abs(ellipseBoundsBottom - ellipseBoundsTop) / 2;
    final double m = (lineEndY - lineStartY) / (lineEndX - lineStartX);
    final double c = lineStartY - m * lineStartX; // Just a point on the line

    /**
     * Step 3:
     *
     * <p>Substitute the Line equation into the Ellipse equation. Solve for x. Eventually, you'll
     * have to use the quadratic formula.
     *
     * <p>Quadratic formula: Ax^2 + Bx + C = 0
     */
    final double A = (b * b + a * a * m * m);
    final double B = 2 * a * a * c * m;
    final double C = (a * a * (c * c - b * b));

    /**
     * Step 4:
     *
     * <p>Apply Quadratic formula. D = determinant / 2A
     */
    final double D = Math.sqrt(-C / A + Math.pow(B / (2 * A), 2));
    final double x2 = -B / (2 * A) - D;
    final double y2 = m * x2 + c;

    /**
     * Step 5:
     *
     * <p>Undo the space transformation in Step 5.
     */
    final double x = x2 + ellipseCenterX;
    final double y = y2 + ellipseCenterY;

    if (!Double.isNaN(x) && !Double.isNaN(y)) {
      result.x = (float) x;
      result.y = (float) y;
    }
  }

  public float getBorderWidthOrDefaultTo(final float defaultValue, final int spacingType) {
    @Nullable Float width = getBorderWidth(spacingType);
    if (width == null) {
      return defaultValue;
    }

    return width;
  }

  public @Nullable Float getBorderWidth(int spacingType) {
    if (mBorderWidth == null) {
      return null;
    }

    final float width = mBorderWidth.getRaw(spacingType);

    if (Float.isNaN(width)) {
      return null;
    }

    return width;
  }

  /** Set type of border */
  private void updatePathEffect() {
    // Used for rounded border and rounded background
    PathEffect mPathEffectForBorderStyle =
        mBorderStyle != null ? getPathEffect(mBorderStyle, getFullBorderWidth()) : null;

    mPaint.setPathEffect(mPathEffectForBorderStyle);
  }

  private void updatePathEffect(int borderWidth) {
    PathEffect pathEffectForBorderStyle = null;
    if (mBorderStyle != null) {
      pathEffectForBorderStyle = getPathEffect(mBorderStyle, borderWidth);
    }
    mPaint.setPathEffect(pathEffectForBorderStyle);
  }

  /** For rounded borders we use default "borderWidth" property. */
  public float getFullBorderWidth() {
    return (mBorderWidth != null && !Float.isNaN(mBorderWidth.getRaw(Spacing.ALL)))
        ? mBorderWidth.getRaw(Spacing.ALL)
        : 0f;
  }

  /**
   * Quickly determine if all the set border colors are equal. Bitwise AND all the set colors
   * together, then OR them all together. If the AND and the OR are the same, then the colors are
   * compatible, so return this color.
   *
   * <p>Used to avoid expensive path creation and expensive calls to canvas.drawPath
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
    int andSmear =
        (borderLeft > 0 ? colorLeft : ALL_BITS_SET)
            & (borderTop > 0 ? colorTop : ALL_BITS_SET)
            & (borderRight > 0 ? colorRight : ALL_BITS_SET)
            & (borderBottom > 0 ? colorBottom : ALL_BITS_SET);
    int orSmear =
        (borderLeft > 0 ? colorLeft : ALL_BITS_UNSET)
            | (borderTop > 0 ? colorTop : ALL_BITS_UNSET)
            | (borderRight > 0 ? colorRight : ALL_BITS_UNSET)
            | (borderBottom > 0 ? colorBottom : ALL_BITS_UNSET);
    return andSmear == orSmear ? andSmear : 0;
  }

  private void drawRectangularBackgroundWithBorders(Canvas canvas) {
    mPaint.setStyle(Paint.Style.FILL);

    int useColor = multiplyColorAlpha(mColor, mAlpha);
    if (Color.alpha(useColor) != 0) {
      mPaint.setColor(useColor);
      canvas.drawRect(getBounds(), mPaint);
    }

    if (mBackgroundImageLayers != null && !mBackgroundImageLayers.isEmpty()) {
      mPaint.setShader(getBackgroundImageShader());
      canvas.drawRect(getBounds(), mPaint);
      mPaint.setShader(null);
    }

    final RectF borderWidth = getDirectionAwareBorderInsets();

    final int borderLeft = Math.round(borderWidth.left);
    final int borderTop = Math.round(borderWidth.top);
    final int borderRight = Math.round(borderWidth.right);
    final int borderBottom = Math.round(borderWidth.bottom);

    // maybe draw borders?
    if (borderLeft > 0 || borderRight > 0 || borderTop > 0 || borderBottom > 0) {
      Rect bounds = getBounds();

      int colorLeft = getBorderColor(Spacing.LEFT);
      int colorTop = getBorderColor(Spacing.TOP);
      int colorRight = getBorderColor(Spacing.RIGHT);
      int colorBottom = getBorderColor(Spacing.BOTTOM);

      int colorBlock = getBorderColor(Spacing.BLOCK);
      int colorBlockStart = getBorderColor(Spacing.BLOCK_START);
      int colorBlockEnd = getBorderColor(Spacing.BLOCK_END);

      if (isBorderColorDefined(Spacing.BLOCK)) {
        colorBottom = colorBlock;
        colorTop = colorBlock;
      }
      if (isBorderColorDefined(Spacing.BLOCK_END)) {
        colorBottom = colorBlockEnd;
      }
      if (isBorderColorDefined(Spacing.BLOCK_START)) {
        colorTop = colorBlockStart;
      }

      final boolean isRTL = getLayoutDirection() == View.LAYOUT_DIRECTION_RTL;
      int colorStart = getBorderColor(Spacing.START);
      int colorEnd = getBorderColor(Spacing.END);

      if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(mContext)) {
        if (!isBorderColorDefined(Spacing.START)) {
          colorStart = colorLeft;
        }

        if (!isBorderColorDefined(Spacing.END)) {
          colorEnd = colorRight;
        }

        final int directionAwareColorLeft = isRTL ? colorEnd : colorStart;
        final int directionAwareColorRight = isRTL ? colorStart : colorEnd;

        colorLeft = directionAwareColorLeft;
        colorRight = directionAwareColorRight;
      } else {
        final int directionAwareColorLeft = isRTL ? colorEnd : colorStart;
        final int directionAwareColorRight = isRTL ? colorStart : colorEnd;

        final boolean isColorStartDefined = isBorderColorDefined(Spacing.START);
        final boolean isColorEndDefined = isBorderColorDefined(Spacing.END);
        final boolean isDirectionAwareColorLeftDefined =
            isRTL ? isColorEndDefined : isColorStartDefined;
        final boolean isDirectionAwareColorRightDefined =
            isRTL ? isColorStartDefined : isColorEndDefined;

        if (isDirectionAwareColorLeftDefined) {
          colorLeft = directionAwareColorLeft;
        }

        if (isDirectionAwareColorRightDefined) {
          colorRight = directionAwareColorRight;
        }
      }

      int left = bounds.left;
      int top = bounds.top;

      // Check for fast path to border drawing.
      int fastBorderColor =
          fastBorderCompatibleColorOrZero(
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
          mPaint.setStyle(Paint.Style.STROKE);
          if (borderLeft > 0) {
            mPathForSingleBorder.reset();
            int width = Math.round(borderWidth.left);
            updatePathEffect(width);
            mPaint.setStrokeWidth(width);
            mPathForSingleBorder.moveTo(left + width / 2, top);
            mPathForSingleBorder.lineTo(left + width / 2, bottom);
            canvas.drawPath(mPathForSingleBorder, mPaint);
          }
          if (borderTop > 0) {
            mPathForSingleBorder.reset();
            int width = Math.round(borderWidth.top);
            updatePathEffect(width);
            mPaint.setStrokeWidth(width);
            mPathForSingleBorder.moveTo(left, top + width / 2);
            mPathForSingleBorder.lineTo(right, top + width / 2);
            canvas.drawPath(mPathForSingleBorder, mPaint);
          }
          if (borderRight > 0) {
            mPathForSingleBorder.reset();
            int width = Math.round(borderWidth.right);
            updatePathEffect(width);
            mPaint.setStrokeWidth(width);
            mPathForSingleBorder.moveTo(right - width / 2, top);
            mPathForSingleBorder.lineTo(right - width / 2, bottom);
            canvas.drawPath(mPathForSingleBorder, mPaint);
          }
          if (borderBottom > 0) {
            mPathForSingleBorder.reset();
            int width = Math.round(borderWidth.bottom);
            updatePathEffect(width);
            mPaint.setStrokeWidth(width);
            mPathForSingleBorder.moveTo(left, bottom - width / 2);
            mPathForSingleBorder.lineTo(right, bottom - width / 2);
            canvas.drawPath(mPathForSingleBorder, mPaint);
          }
        }
      } else {
        // If the path drawn previously is of the same color,
        // there would be a slight white space between borders
        // with anti-alias set to true.
        // Therefore we need to disable anti-alias, and
        // after drawing is done, we will re-enable it.

        mPaint.setAntiAlias(false);

        int width = bounds.width();
        int height = bounds.height();

        if (borderLeft > 0) {
          final float x1 = left;
          final float y1 = top;
          final float x2 = left + borderLeft;
          final float y2 = top + borderTop;
          final float x3 = left + borderLeft;
          final float y3 = top + height - borderBottom;
          final float x4 = left;
          final float y4 = top + height;

          drawQuadrilateral(canvas, colorLeft, x1, y1, x2, y2, x3, y3, x4, y4);
        }

        if (borderTop > 0) {
          final float x1 = left;
          final float y1 = top;
          final float x2 = left + borderLeft;
          final float y2 = top + borderTop;
          final float x3 = left + width - borderRight;
          final float y3 = top + borderTop;
          final float x4 = left + width;
          final float y4 = top;

          drawQuadrilateral(canvas, colorTop, x1, y1, x2, y2, x3, y3, x4, y4);
        }

        if (borderRight > 0) {
          final float x1 = left + width;
          final float y1 = top;
          final float x2 = left + width;
          final float y2 = top + height;
          final float x3 = left + width - borderRight;
          final float y3 = top + height - borderBottom;
          final float x4 = left + width - borderRight;
          final float y4 = top + borderTop;

          drawQuadrilateral(canvas, colorRight, x1, y1, x2, y2, x3, y3, x4, y4);
        }

        if (borderBottom > 0) {
          final float x1 = left;
          final float y1 = top + height;
          final float x2 = left + width;
          final float y2 = top + height;
          final float x3 = left + width - borderRight;
          final float y3 = top + height - borderBottom;
          final float x4 = left + borderLeft;
          final float y4 = top + height - borderBottom;

          drawQuadrilateral(canvas, colorBottom, x1, y1, x2, y2, x3, y3, x4, y4);
        }

        // re-enable anti alias
        mPaint.setAntiAlias(true);
      }
    }
  }

  private void drawQuadrilateral(
      Canvas canvas,
      int fillColor,
      float x1,
      float y1,
      float x2,
      float y2,
      float x3,
      float y3,
      float x4,
      float y4) {
    if (fillColor == Color.TRANSPARENT) {
      return;
    }

    if (mPathForBorder == null) {
      mPathForBorder = new Path();
    }

    mPaint.setColor(fillColor);
    mPathForBorder.reset();
    mPathForBorder.moveTo(x1, y1);
    mPathForBorder.lineTo(x2, y2);
    mPathForBorder.lineTo(x3, y3);
    mPathForBorder.lineTo(x4, y4);
    mPathForBorder.lineTo(x1, y1);
    canvas.drawPath(mPathForBorder, mPaint);
  }

  private static int colorFromAlphaAndRGBComponents(float alpha, float rgb) {
    int rgbComponent = 0x00FFFFFF & (int) rgb;
    int alphaComponent = 0xFF000000 & ((int) alpha) << 24;

    return rgbComponent | alphaComponent;
  }

  private boolean isBorderColorDefined(int position) {
    final float rgb = mBorderRGB != null ? mBorderRGB.get(position) : Float.NaN;
    final float alpha = mBorderAlpha != null ? mBorderAlpha.get(position) : Float.NaN;
    return !Float.isNaN(rgb) && !Float.isNaN(alpha);
  }

  public int getBorderColor(int position) {
    float rgb = mBorderRGB != null ? mBorderRGB.get(position) : DEFAULT_BORDER_RGB;
    float alpha = mBorderAlpha != null ? mBorderAlpha.get(position) : DEFAULT_BORDER_ALPHA;

    return CSSBackgroundDrawable.colorFromAlphaAndRGBComponents(alpha, rgb);
  }

  public RectF getDirectionAwareBorderInsets() {
    final float borderWidth = getBorderWidthOrDefaultTo(0, Spacing.ALL);
    final float borderTopWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.TOP);
    final float borderBottomWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.BOTTOM);
    float borderLeftWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.LEFT);
    float borderRightWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.RIGHT);

    if (mBorderWidth != null) {
      final boolean isRTL = getLayoutDirection() == View.LAYOUT_DIRECTION_RTL;
      float borderStartWidth = mBorderWidth.getRaw(Spacing.START);
      float borderEndWidth = mBorderWidth.getRaw(Spacing.END);

      if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(mContext)) {
        if (Float.isNaN(borderStartWidth)) {
          borderStartWidth = borderLeftWidth;
        }

        if (Float.isNaN(borderEndWidth)) {
          borderEndWidth = borderRightWidth;
        }

        final float directionAwareBorderLeftWidth = isRTL ? borderEndWidth : borderStartWidth;
        final float directionAwareBorderRightWidth = isRTL ? borderStartWidth : borderEndWidth;

        borderLeftWidth = directionAwareBorderLeftWidth;
        borderRightWidth = directionAwareBorderRightWidth;
      } else {
        final float directionAwareBorderLeftWidth = isRTL ? borderEndWidth : borderStartWidth;
        final float directionAwareBorderRightWidth = isRTL ? borderStartWidth : borderEndWidth;

        if (!Float.isNaN(directionAwareBorderLeftWidth)) {
          borderLeftWidth = directionAwareBorderLeftWidth;
        }

        if (!Float.isNaN(directionAwareBorderRightWidth)) {
          borderRightWidth = directionAwareBorderRightWidth;
        }
      }
    }

    return new RectF(borderLeftWidth, borderTopWidth, borderRightWidth, borderBottomWidth);
  }

  private @Nullable Shader getBackgroundImageShader() {
    if (mBackgroundImageLayers == null) {
      return null;
    }

    Shader compositeShader = null;
    for (BackgroundImageLayer backgroundImageLayer : mBackgroundImageLayers) {
      Shader currentShader = backgroundImageLayer.getShader(getBounds());
      if (currentShader == null) {
        continue;
      }
      if (compositeShader == null) {
        compositeShader = currentShader;
      } else {
        compositeShader =
            new ComposeShader(currentShader, compositeShader, PorterDuff.Mode.SRC_OVER);
      }
    }
    return compositeShader;
  }

  /**
   * Multiplies the color with the given alpha.
   *
   * @param color color to be multiplied
   * @param alpha value between 0 and 255
   * @return multiplied color
   */
  private static int multiplyColorAlpha(int color, int alpha) {
    if (alpha == 255) {
      return color;
    }
    if (alpha == 0) {
      return color & 0x00FFFFFF;
    }
    alpha = alpha + (alpha >> 7); // make it 0..256
    int colorAlpha = color >>> 24;
    int multipliedAlpha = colorAlpha * alpha >> 8;
    return (multipliedAlpha << 24) | (color & 0x00FFFFFF);
  }
}
