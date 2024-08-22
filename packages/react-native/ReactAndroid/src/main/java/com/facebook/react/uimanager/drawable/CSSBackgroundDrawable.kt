/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.uimanager.drawable

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.ComposeShader
import android.graphics.DashPathEffect
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PathEffect
import android.graphics.PointF
import android.graphics.PorterDuff
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.drawable.Drawable
import android.view.View
import androidx.core.graphics.ColorUtils
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.modules.i18nmanager.I18nUtil.Companion.instance
import com.facebook.react.uimanager.FloatUtil.floatsEqual
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import com.facebook.react.uimanager.style.Gradient

/**
 * A subclass of [Drawable] used for background of [ ]. It supports drawing background color and
 * borders (including rounded borders) by providing a react friendly API (setter for each of those
 * properties).
 *
 * The implementation tries to allocate as few objects as possible depending on which properties are
 * set. E.g. for views with rounded background/borders we allocate `mInnerClipPathForBorderRadius`
 * and `mInnerClipTempRectForBorderRadius`. In case when view have a rectangular borders we allocate
 * `mBorderWidthResult` and similar. When only background color is set we won't allocate any
 * extra/unnecessary objects.
 */
internal class CSSBackgroundDrawable(private val mContext: Context) : Drawable() {
  /* Value at Spacing.ALL index used for rounded borders, whole array used by rectangular borders */
  private var mBorderWidth: Spacing? = null
  private var mBorderRGB: Spacing? = null
  private var mBorderAlpha: Spacing? = null

  private var mInnerClipPathForBorderRadius: Path? = null
  private var mBackgroundColorRenderPath: Path? = null
  private var mOuterClipPathForBorderRadius: Path? = null
  private var mPathForBorderRadiusOutline: Path? = null
  private var mPathForBorder: Path? = null
  private val mPathForSingleBorder = Path()
  private var mCenterDrawPath: Path? = null
  private var mInnerClipTempRectForBorderRadius: RectF? = null
  private var mOuterClipTempRectForBorderRadius: RectF? = null
  private var mTempRectForBorderRadiusOutline: RectF? = null
  private var mTempRectForCenterDrawPath: RectF? = null
  private var mInnerTopLeftCorner: PointF? = null
  private var mInnerTopRightCorner: PointF? = null
  private var mInnerBottomRightCorner: PointF? = null
  private var mInnerBottomLeftCorner: PointF? = null
  private var mNeedUpdatePathForBorderRadius = false
  /* Used by all types of background and for drawing borders */
  private val mPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var mColor = Color.TRANSPARENT
  private var mGradients: Array<Gradient>? = null
  private var mAlpha = 255
  // There is a small gap between the edges of adjacent paths
  // such as between the mBackgroundColorRenderPath and its border.
  // The smallest amount (found to be 0.8f) is used to extend
  // the paths, overlapping them and closing the visible gap.
  private val mGapBetweenPaths = 0.8f

  private var mComputedBorderRadius = ComputedBorderRadius()
  // Should be removed after migrating to Android layout direction.
  private var mLayoutDirectionOverride = -1

  override fun draw(canvas: Canvas) {
    updatePathEffect()
    if (!hasRoundedBorders()) {
      drawRectangularBackgroundWithBorders(canvas)
    } else {
      drawRoundedBackgroundWithBorders(canvas)
    }
  }

  public fun hasRoundedBorders(): Boolean {
    return borderRadius.hasRoundedBorders()
  }

  override fun onBoundsChange(bounds: Rect) {
    super.onBoundsChange(bounds)
    mNeedUpdatePathForBorderRadius = true
  }

  override fun setAlpha(alpha: Int) {
    if (alpha != mAlpha) {
      mAlpha = alpha
      invalidateSelf()
    }
  }

  override fun getAlpha(): Int {
    return mAlpha
  }

  override fun setColorFilter(cf: ColorFilter?) {
    // do nothing
  }

  @Deprecated("")
  public fun setLayoutDirectionOverride(layoutDirection: Int) {
    if (mLayoutDirectionOverride != layoutDirection) {
      mLayoutDirectionOverride = layoutDirection
    }
  }

  @SuppressLint("WrongConstant")
  override fun getLayoutDirection(): Int {
    return if (mLayoutDirectionOverride == -1) super.getLayoutDirection()
    else mLayoutDirectionOverride
  }

  override fun getOpacity(): Int {
    return Color.alpha(mColor) * mAlpha shr 8
  }

  /* Android's elevation implementation requires this to be implemented to know where to draw the shadow. */
  @Suppress("DEPRECATION")
  override fun getOutline(outline: Outline) {
    if (hasRoundedBorders()) {
      updatePath()
      outline.setConvexPath(checkNotNull(mPathForBorderRadiusOutline))
    } else {
      outline.setRect(bounds)
    }
  }

  public fun setBorderWidth(position: Int, width: Float) {
    if (mBorderWidth == null) {
      mBorderWidth = Spacing()
    }
    if (!floatsEqual(mBorderWidth!!.getRaw(position), width)) {
      mBorderWidth!![position] = width
      when (position) {
        Spacing.ALL,
        Spacing.LEFT,
        Spacing.BOTTOM,
        Spacing.RIGHT,
        Spacing.TOP,
        Spacing.START,
        Spacing.END -> mNeedUpdatePathForBorderRadius = true
      }
      invalidateSelf()
    }
  }

  public fun setBorderColor(position: Int, color: Int?) {
    val rgbComponent = if (color == null) Float.NaN else (color and 0x00FFFFFF).toFloat()
    val alphaComponent = if (color == null) Float.NaN else (color ushr 24).toFloat()
    setBorderRGB(position, rgbComponent)
    setBorderAlpha(position, alphaComponent)
    mNeedUpdatePathForBorderRadius = true
  }

  private fun setBorderRGB(position: Int, rgb: Float) {
    // set RGB component
    if (mBorderRGB == null) {
      mBorderRGB = Spacing(DEFAULT_BORDER_RGB.toFloat())
    }
    if (!floatsEqual(mBorderRGB!!.getRaw(position), rgb)) {
      mBorderRGB!![position] = rgb
      invalidateSelf()
    }
  }

  private fun setBorderAlpha(position: Int, alpha: Float) {
    // set Alpha component
    if (mBorderAlpha == null) {
      mBorderAlpha = Spacing(DEFAULT_BORDER_ALPHA.toFloat())
    }
    if (!floatsEqual(mBorderAlpha!!.getRaw(position), alpha)) {
      mBorderAlpha!![position] = alpha
      invalidateSelf()
    }
  }

  public fun setBorderStyle(style: String?) {
    borderStyle = style?.let { BorderStyle.valueOf(style.uppercase()) }
  }

  @Deprecated("Use {@link #setBorderRadius(BorderRadiusProp, LengthPercentage)} instead.")
  public fun setRadius(radius: Float) {
    val boxedRadius = if (java.lang.Float.isNaN(radius)) null else java.lang.Float.valueOf(radius)
    if (boxedRadius == null) {
      setBorderRadius(BorderRadiusProp.BORDER_RADIUS, null)
    } else {
      setBorderRadius(
          BorderRadiusProp.BORDER_RADIUS, LengthPercentage(boxedRadius, LengthPercentageType.POINT))
    }
  }

  @Deprecated("Use {@link #setBorderRadius(BorderRadiusProp, LengthPercentage)} instead.")
  public fun setRadius(radius: Float, position: Int) {
    val boxedRadius = if (java.lang.Float.isNaN(radius)) null else java.lang.Float.valueOf(radius)
    if (boxedRadius == null) {
      borderRadius.set(BorderRadiusProp.entries[position], null)
      invalidateSelf()
    } else {
      setBorderRadius(
          BorderRadiusProp.entries[position],
          LengthPercentage(boxedRadius, LengthPercentageType.POINT))
    }
  }

  public fun setBorderRadius(property: BorderRadiusProp?, radius: LengthPercentage?) {
    if (radius != borderRadius.get(property!!)) {
      borderRadius.set(property, radius)
      mNeedUpdatePathForBorderRadius = true
      invalidateSelf()
    }
  }

  // Here, "inner" refers to the border radius on the inside of the border. So
  // it ends up being the "outer" border radius inset by the respective width.
  private fun getInnerBorderRadius(computedRadius: Float, borderWidth: Float): Float {
    return Math.max(computedRadius - borderWidth, 0f)
  }

  public fun setGradients(gradients: Array<Gradient>?) {
    mGradients = gradients
    invalidateSelf()
  }

  @get:VisibleForTesting
  public var color: Int
    get() = mColor
    set(color) {
      mColor = color
      invalidateSelf()
    }

  public var borderStyle: BorderStyle? = null
    set(value) {
      if (field != value) {
        field = borderStyle
        mNeedUpdatePathForBorderRadius = true
        invalidateSelf()
      }
    }

  public var borderRadius: BorderRadiusStyle = BorderRadiusStyle()
    set(value) {
      if (field != value) {
        field = value
        mNeedUpdatePathForBorderRadius = true
        invalidateSelf()
      }
    }

  public val borderBoxPath: Path?
    get() {
      if (hasRoundedBorders()) {
        updatePath()
        return Path(checkNotNull(mOuterClipPathForBorderRadius))
      }
      return null
    }

  public val borderBoxRect: RectF
    get() = RectF(bounds)

  public val paddingBoxPath: Path?
    get() {
      if (hasRoundedBorders()) {
        updatePath()
        return Path(checkNotNull(mInnerClipPathForBorderRadius))
      }
      return null
    }

  public val paddingBoxRect: RectF
    get() {
      val insets = directionAwareBorderInsets
      return RectF(
          insets.left, insets.top, bounds.width() - insets.right, bounds.height() - insets.bottom)
    }

  private fun drawRoundedBackgroundWithBorders(canvas: Canvas) {
    updatePath()
    canvas.save()

    // Clip outer border
    canvas.clipPath(checkNotNull(mOuterClipPathForBorderRadius))

    // Draws the View without its border first (with background color fill)
    val useColor = ColorUtils.setAlphaComponent(mColor, opacity)
    if (Color.alpha(useColor) != 0) {
      mPaint.color = useColor
      mPaint.style = Paint.Style.FILL
      canvas.drawPath(checkNotNull(mBackgroundColorRenderPath), mPaint)
    }
    if (mGradients != null && mGradients!!.size > 0) {
      mPaint.setShader(gradientShader)
      mPaint.style = Paint.Style.FILL
      canvas.drawPath(checkNotNull(mBackgroundColorRenderPath), mPaint)
      mPaint.setShader(null)
    }
    val borderWidth = directionAwareBorderInsets
    var colorLeft = getBorderColor(Spacing.LEFT)
    var colorTop = getBorderColor(Spacing.TOP)
    var colorRight = getBorderColor(Spacing.RIGHT)
    var colorBottom = getBorderColor(Spacing.BOTTOM)
    val colorBlock = getBorderColor(Spacing.BLOCK)
    val colorBlockStart = getBorderColor(Spacing.BLOCK_START)
    val colorBlockEnd = getBorderColor(Spacing.BLOCK_END)
    if (isBorderColorDefined(Spacing.BLOCK)) {
      colorBottom = colorBlock
      colorTop = colorBlock
    }
    if (isBorderColorDefined(Spacing.BLOCK_END)) {
      colorBottom = colorBlockEnd
    }
    if (isBorderColorDefined(Spacing.BLOCK_START)) {
      colorTop = colorBlockStart
    }
    if (borderWidth.top > 0 ||
        borderWidth.bottom > 0 ||
        borderWidth.left > 0 ||
        borderWidth.right > 0) {

      // If it's a full and even border draw inner rect path with stroke
      val fullBorderWidth = fullBorderWidth
      val borderColor = getBorderColor(Spacing.ALL)
      if (borderWidth.top == fullBorderWidth &&
          borderWidth.bottom == fullBorderWidth &&
          borderWidth.left == fullBorderWidth &&
          borderWidth.right == fullBorderWidth &&
          colorLeft == borderColor &&
          colorTop == borderColor &&
          colorRight == borderColor &&
          colorBottom == borderColor) {
        if (fullBorderWidth > 0) {
          mPaint.color = multiplyColorAlpha(borderColor, mAlpha)
          mPaint.style = Paint.Style.STROKE
          mPaint.strokeWidth = fullBorderWidth
          canvas.drawPath(checkNotNull(mCenterDrawPath), mPaint)
        }
      } else {
        mPaint.style = Paint.Style.FILL

        // Clip inner border
        canvas.clipOutPath(checkNotNull(mInnerClipPathForBorderRadius))
        val isRTL = layoutDirection == View.LAYOUT_DIRECTION_RTL
        var colorStart = getBorderColor(Spacing.START)
        var colorEnd = getBorderColor(Spacing.END)
        if (instance.doLeftAndRightSwapInRTL(mContext)) {
          if (!isBorderColorDefined(Spacing.START)) {
            colorStart = colorLeft
          }
          if (!isBorderColorDefined(Spacing.END)) {
            colorEnd = colorRight
          }
          val directionAwareColorLeft = if (isRTL) colorEnd else colorStart
          val directionAwareColorRight = if (isRTL) colorStart else colorEnd
          colorLeft = directionAwareColorLeft
          colorRight = directionAwareColorRight
        } else {
          val directionAwareColorLeft = if (isRTL) colorEnd else colorStart
          val directionAwareColorRight = if (isRTL) colorStart else colorEnd
          val isColorStartDefined = isBorderColorDefined(Spacing.START)
          val isColorEndDefined = isBorderColorDefined(Spacing.END)
          val isDirectionAwareColorLeftDefined =
              if (isRTL) isColorEndDefined else isColorStartDefined
          val isDirectionAwareColorRightDefined =
              if (isRTL) isColorStartDefined else isColorEndDefined
          if (isDirectionAwareColorLeftDefined) {
            colorLeft = directionAwareColorLeft
          }
          if (isDirectionAwareColorRightDefined) {
            colorRight = directionAwareColorRight
          }
        }
        val outerClipTempRect = checkNotNull(mOuterClipTempRectForBorderRadius)
        val left = outerClipTempRect.left
        val right = outerClipTempRect.right
        val top = outerClipTempRect.top
        val bottom = outerClipTempRect.bottom
        val innerTopLeftCorner = checkNotNull(mInnerTopLeftCorner)
        val innerTopRightCorner = checkNotNull(mInnerTopRightCorner)
        val innerBottomLeftCorner = checkNotNull(mInnerBottomLeftCorner)
        val innerBottomRightCorner = checkNotNull(mInnerBottomRightCorner)

        // mGapBetweenPaths is used to close the gap between the diagonal
        // edges of the quadrilaterals on adjacent sides of the rectangle
        if (borderWidth.left > 0) {
          val x1 = left
          val y1 = top - mGapBetweenPaths
          val x2 = innerTopLeftCorner.x
          val y2 = innerTopLeftCorner.y - mGapBetweenPaths
          val x3 = innerBottomLeftCorner.x
          val y3 = innerBottomLeftCorner.y + mGapBetweenPaths
          val x4 = left
          val y4 = bottom + mGapBetweenPaths
          drawQuadrilateral(canvas, colorLeft, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderWidth.top > 0) {
          val x1 = left - mGapBetweenPaths
          val y1 = top
          val x2 = innerTopLeftCorner.x - mGapBetweenPaths
          val y2 = innerTopLeftCorner.y
          val x3 = innerTopRightCorner.x + mGapBetweenPaths
          val y3 = innerTopRightCorner.y
          val x4 = right + mGapBetweenPaths
          val y4 = top
          drawQuadrilateral(canvas, colorTop, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderWidth.right > 0) {
          val x1 = right
          val y1 = top - mGapBetweenPaths
          val x2 = innerTopRightCorner.x
          val y2 = innerTopRightCorner.y - mGapBetweenPaths
          val x3 = innerBottomRightCorner.x
          val y3 = innerBottomRightCorner.y + mGapBetweenPaths
          val x4 = right
          val y4 = bottom + mGapBetweenPaths
          drawQuadrilateral(canvas, colorRight, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderWidth.bottom > 0) {
          val x1 = left - mGapBetweenPaths
          val y1 = bottom
          val x2 = innerBottomLeftCorner.x - mGapBetweenPaths
          val y2 = innerBottomLeftCorner.y
          val x3 = innerBottomRightCorner.x + mGapBetweenPaths
          val y3 = innerBottomRightCorner.y
          val x4 = right + mGapBetweenPaths
          val y4 = bottom
          drawQuadrilateral(canvas, colorBottom, x1, y1, x2, y2, x3, y3, x4, y4)
        }
      }
    }
    canvas.restore()
  }

  private fun updatePath() {
    if (!mNeedUpdatePathForBorderRadius) {
      return
    }
    mNeedUpdatePathForBorderRadius = false
    if (mInnerClipPathForBorderRadius == null) {
      mInnerClipPathForBorderRadius = Path()
    }
    if (mBackgroundColorRenderPath == null) {
      mBackgroundColorRenderPath = Path()
    }
    if (mOuterClipPathForBorderRadius == null) {
      mOuterClipPathForBorderRadius = Path()
    }
    if (mPathForBorderRadiusOutline == null) {
      mPathForBorderRadiusOutline = Path()
    }
    if (mCenterDrawPath == null) {
      mCenterDrawPath = Path()
    }
    if (mInnerClipTempRectForBorderRadius == null) {
      mInnerClipTempRectForBorderRadius = RectF()
    }
    if (mOuterClipTempRectForBorderRadius == null) {
      mOuterClipTempRectForBorderRadius = RectF()
    }
    if (mTempRectForBorderRadiusOutline == null) {
      mTempRectForBorderRadiusOutline = RectF()
    }
    if (mTempRectForCenterDrawPath == null) {
      mTempRectForCenterDrawPath = RectF()
    }
    mInnerClipPathForBorderRadius!!.reset()
    mBackgroundColorRenderPath!!.reset()
    mOuterClipPathForBorderRadius!!.reset()
    mPathForBorderRadiusOutline!!.reset()
    mCenterDrawPath!!.reset()
    mInnerClipTempRectForBorderRadius!!.set(bounds)
    mOuterClipTempRectForBorderRadius!!.set(bounds)
    mTempRectForBorderRadiusOutline!!.set(bounds)
    mTempRectForCenterDrawPath!!.set(bounds)
    val borderWidth = directionAwareBorderInsets
    val colorLeft = getBorderColor(Spacing.LEFT)
    var colorTop = getBorderColor(Spacing.TOP)
    val colorRight = getBorderColor(Spacing.RIGHT)
    var colorBottom = getBorderColor(Spacing.BOTTOM)
    val borderColor = getBorderColor(Spacing.ALL)
    val colorBlock = getBorderColor(Spacing.BLOCK)
    val colorBlockStart = getBorderColor(Spacing.BLOCK_START)
    val colorBlockEnd = getBorderColor(Spacing.BLOCK_END)
    if (isBorderColorDefined(Spacing.BLOCK)) {
      colorBottom = colorBlock
      colorTop = colorBlock
    }
    if (isBorderColorDefined(Spacing.BLOCK_END)) {
      colorBottom = colorBlockEnd
    }
    if (isBorderColorDefined(Spacing.BLOCK_START)) {
      colorTop = colorBlockStart
    }

    // Clip border ONLY if its color is non transparent
    if (Color.alpha(colorLeft) != 0 &&
        Color.alpha(colorTop) != 0 &&
        Color.alpha(colorRight) != 0 &&
        Color.alpha(colorBottom) != 0 &&
        Color.alpha(borderColor) != 0) {
      mInnerClipTempRectForBorderRadius!!.top += borderWidth.top
      mInnerClipTempRectForBorderRadius!!.bottom -= borderWidth.bottom
      mInnerClipTempRectForBorderRadius!!.left += borderWidth.left
      mInnerClipTempRectForBorderRadius!!.right -= borderWidth.right
    }
    mTempRectForCenterDrawPath!!.top += borderWidth.top * 0.5f
    mTempRectForCenterDrawPath!!.bottom -= borderWidth.bottom * 0.5f
    mTempRectForCenterDrawPath!!.left += borderWidth.left * 0.5f
    mTempRectForCenterDrawPath!!.right -= borderWidth.right * 0.5f
    mComputedBorderRadius =
        borderRadius.resolve(
            layoutDirection,
            mContext,
            toDIPFromPixel(mOuterClipTempRectForBorderRadius!!.width()),
            toDIPFromPixel(mOuterClipTempRectForBorderRadius!!.height()))
    val (horizontal, vertical) = mComputedBorderRadius.topLeft.toPixelFromDIP()
    val (horizontal1, vertical1) = mComputedBorderRadius.topRight.toPixelFromDIP()
    val (horizontal2, vertical2) = mComputedBorderRadius.bottomLeft.toPixelFromDIP()
    val (horizontal3, vertical3) = mComputedBorderRadius.bottomRight.toPixelFromDIP()
    val innerTopLeftRadiusX = getInnerBorderRadius(horizontal, borderWidth.left)
    val innerTopLeftRadiusY = getInnerBorderRadius(vertical, borderWidth.top)
    val innerTopRightRadiusX = getInnerBorderRadius(horizontal1, borderWidth.right)
    val innerTopRightRadiusY = getInnerBorderRadius(vertical1, borderWidth.top)
    val innerBottomRightRadiusX = getInnerBorderRadius(horizontal3, borderWidth.right)
    val innerBottomRightRadiusY = getInnerBorderRadius(vertical3, borderWidth.bottom)
    val innerBottomLeftRadiusX = getInnerBorderRadius(horizontal2, borderWidth.left)
    val innerBottomLeftRadiusY = getInnerBorderRadius(vertical2, borderWidth.bottom)
    mInnerClipPathForBorderRadius!!.addRoundRect(
        mInnerClipTempRectForBorderRadius!!,
        floatArrayOf(
            innerTopLeftRadiusX,
            innerTopLeftRadiusY,
            innerTopRightRadiusX,
            innerTopRightRadiusY,
            innerBottomRightRadiusX,
            innerBottomRightRadiusY,
            innerBottomLeftRadiusX,
            innerBottomLeftRadiusY),
        Path.Direction.CW)

    // There is a small gap between mBackgroundColorRenderPath and its
    // border. mGapBetweenPaths is used to slightly enlarge the rectangle
    // (mInnerClipTempRectForBorderRadius), ensuring the border can be
    // drawn on top without the gap.
    mBackgroundColorRenderPath!!.addRoundRect(
        mInnerClipTempRectForBorderRadius!!.left - mGapBetweenPaths,
        mInnerClipTempRectForBorderRadius!!.top - mGapBetweenPaths,
        mInnerClipTempRectForBorderRadius!!.right + mGapBetweenPaths,
        mInnerClipTempRectForBorderRadius!!.bottom + mGapBetweenPaths,
        floatArrayOf(
            innerTopLeftRadiusX,
            innerTopLeftRadiusY,
            innerTopRightRadiusX,
            innerTopRightRadiusY,
            innerBottomRightRadiusX,
            innerBottomRightRadiusY,
            innerBottomLeftRadiusX,
            innerBottomLeftRadiusY),
        Path.Direction.CW)
    mOuterClipPathForBorderRadius!!.addRoundRect(
        mOuterClipTempRectForBorderRadius!!,
        floatArrayOf(
            horizontal,
            vertical,
            horizontal1,
            vertical1,
            horizontal3,
            vertical3,
            horizontal2,
            vertical2),
        Path.Direction.CW)
    var extraRadiusForOutline = 0f
    if (mBorderWidth != null) {
      extraRadiusForOutline = mBorderWidth!![Spacing.ALL] / 2f
    }
    mPathForBorderRadiusOutline!!.addRoundRect(
        mTempRectForBorderRadiusOutline!!,
        floatArrayOf(
            horizontal + extraRadiusForOutline,
            vertical + extraRadiusForOutline,
            horizontal1 + extraRadiusForOutline,
            vertical1 + extraRadiusForOutline,
            horizontal3 + extraRadiusForOutline,
            vertical3 + extraRadiusForOutline,
            horizontal2 + extraRadiusForOutline,
            vertical2 + extraRadiusForOutline),
        Path.Direction.CW)
    mCenterDrawPath!!.addRoundRect(
        mTempRectForCenterDrawPath!!,
        floatArrayOf(
            Math.max(
                horizontal - borderWidth.left * 0.5f,
                if (borderWidth.left > 0.0f) horizontal / borderWidth.left else 0.0f),
            Math.max(
                vertical - borderWidth.top * 0.5f,
                if (borderWidth.top > 0.0f) vertical / borderWidth.top else 0.0f),
            Math.max(
                horizontal1 - borderWidth.right * 0.5f,
                if (borderWidth.right > 0.0f) horizontal1 / borderWidth.right else 0.0f),
            Math.max(
                vertical1 - borderWidth.top * 0.5f,
                if (borderWidth.top > 0.0f) vertical1 / borderWidth.top else 0.0f),
            Math.max(
                horizontal3 - borderWidth.right * 0.5f,
                if (borderWidth.right > 0.0f) horizontal3 / borderWidth.right else 0.0f),
            Math.max(
                vertical3 - borderWidth.bottom * 0.5f,
                if (borderWidth.bottom > 0.0f) vertical3 / borderWidth.bottom else 0.0f),
            Math.max(
                horizontal2 - borderWidth.left * 0.5f,
                if (borderWidth.left > 0.0f) horizontal2 / borderWidth.left else 0.0f),
            Math.max(
                vertical2 - borderWidth.bottom * 0.5f,
                if (borderWidth.bottom > 0.0f) vertical2 / borderWidth.bottom else 0.0f)),
        Path.Direction.CW)
    /**
     * Rounded Multi-Colored Border Algorithm:
     *
     * Let O (for outer) = (top, left, bottom, right) be the rectangle that represents the size and
     * position of a view V. Since the box-sizing of all React Native views is border-box, any
     * border of V will render inside O.
     *
     * Let BorderWidth = (borderTop, borderLeft, borderBottom, borderRight).
     *
     * Let I (for inner) = O - BorderWidth.
     *
     * Then, remembering that O and I are rectangles and that I is inside O, O - I gives us the
     * border of V. Therefore, we can use canvas.clipPath to draw V's border.
     *
     * canvas.clipPath(O, Region.OP.INTERSECT);
     *
     * canvas.clipPath(I, Region.OP.DIFFERENCE);
     *
     * canvas.drawRect(O, paint);
     *
     * This lets us draw non-rounded single-color borders.
     *
     * To extend this algorithm to rounded single-color borders, we:
     * 1. Curve the corners of O by the (border radii of V) using Path#addRoundRect.
     * 2. Curve the corners of I by (border radii of V - border widths of V) using
     *    Path#addRoundRect.
     *
     * Let O' = curve(O, border radii of V).
     *
     * Let I' = curve(I, border radii of V - border widths of V)
     *
     * The rationale behind this decision is the (first sentence of the) following section in the
     * CSS Backgrounds and Borders Module Level 3:
     * https://www.w3.org/TR/css3-background/#the-border-radius.
     *
     * After both O and I have been curved, we can execute the following lines once again to render
     * curved single-color borders:
     *
     * canvas.clipPath(O, Region.OP.INTERSECT);
     *
     * canvas.clipPath(I, Region.OP.DIFFERENCE);
     *
     * canvas.drawRect(O, paint);
     *
     * To extend this algorithm to rendering multi-colored rounded borders, we render each side of
     * the border as its own quadrilateral. Suppose that we were handling the case where all the
     * border radii are 0. Then, the four quadrilaterals would be:
     *
     * Left: (O.left, O.top), (I.left, I.top), (I.left, I.bottom), (O.left, O.bottom)
     *
     * Top: (O.left, O.top), (I.left, I.top), (I.right, I.top), (O.right, O.top)
     *
     * Right: (O.right, O.top), (I.right, I.top), (I.right, I.bottom), (O.right, O.bottom)
     *
     * Bottom: (O.right, O.bottom), (I.right, I.bottom), (I.left, I.bottom), (O.left, O.bottom)
     *
     * Now, lets consider what happens when we render a rounded border (radii != 0). For the sake of
     * simplicity, let's focus on the top edge of the Left border:
     *
     * Let borderTopLeftRadius = 5. Let borderLeftWidth = 1. Let borderTopWidth = 2.
     *
     * We know that O is curved by the ellipse E_O (a = 5, b = 5). We know that I is curved by the
     * ellipse E_I (a = 5 - 1, b = 5 - 2).
     *
     * Since we have clipping, it should be safe to set the top-left point of the Left
     * quadrilateral's top edge to (O.left, O.top).
     *
     * But, what should the top-right point be?
     *
     * The fact that the border is curved shouldn't change the slope (nor the position) of the line
     * connecting the top-left and top-right points of the Left quadrilateral's top edge. Therefore,
     * The top-right point should lie somewhere on the line L = (1 - a) * (O.left, O.top)
     * + a * (I.left, I.top).
     *
     * a != 0, because then the top-left and top-right points would be the same and borderLeftWidth
     * = 1. a != 1, because then the top-right point would not touch an edge of the ellipse E_I. We
     * want the top-right point to touch an edge of the inner ellipse because the border curves with
     * E_I on the top-left corner of V.
     *
     * Therefore, it must be the case that a > 1. Two natural locations of the top-right point
     * exist: 1. The first intersection of L with E_I. 2. The second intersection of L with E_I.
     *
     * We choose the top-right point of the top edge of the Left quadrilateral to be an arbitrary
     * intersection of L with E_I.
     */
    if (mInnerTopLeftCorner == null) {
      mInnerTopLeftCorner = PointF()
    }
    /** Compute mInnerTopLeftCorner */
    mInnerTopLeftCorner!!.x = mInnerClipTempRectForBorderRadius!!.left
    mInnerTopLeftCorner!!.y = mInnerClipTempRectForBorderRadius!!.top
    getEllipseIntersectionWithLine( // Ellipse Bounds
        mInnerClipTempRectForBorderRadius!!.left.toDouble(),
        mInnerClipTempRectForBorderRadius!!.top.toDouble(),
        (mInnerClipTempRectForBorderRadius!!.left + 2 * innerTopLeftRadiusX).toDouble(),
        (mInnerClipTempRectForBorderRadius!!.top + 2 * innerTopLeftRadiusY)
            .toDouble(), // Line Start
        mOuterClipTempRectForBorderRadius!!.left.toDouble(),
        mOuterClipTempRectForBorderRadius!!.top.toDouble(), // Line End
        mInnerClipTempRectForBorderRadius!!.left.toDouble(),
        mInnerClipTempRectForBorderRadius!!.top.toDouble(), // Result
        mInnerTopLeftCorner!!)
    /** Compute mInnerBottomLeftCorner */
    if (mInnerBottomLeftCorner == null) {
      mInnerBottomLeftCorner = PointF()
    }
    mInnerBottomLeftCorner!!.x = mInnerClipTempRectForBorderRadius!!.left
    mInnerBottomLeftCorner!!.y = mInnerClipTempRectForBorderRadius!!.bottom
    getEllipseIntersectionWithLine( // Ellipse Bounds
        mInnerClipTempRectForBorderRadius!!.left.toDouble(),
        (mInnerClipTempRectForBorderRadius!!.bottom - 2 * innerBottomLeftRadiusY).toDouble(),
        (mInnerClipTempRectForBorderRadius!!.left + 2 * innerBottomLeftRadiusX).toDouble(),
        mInnerClipTempRectForBorderRadius!!.bottom.toDouble(), // Line Start
        mOuterClipTempRectForBorderRadius!!.left.toDouble(),
        mOuterClipTempRectForBorderRadius!!.bottom.toDouble(), // Line End
        mInnerClipTempRectForBorderRadius!!.left.toDouble(),
        mInnerClipTempRectForBorderRadius!!.bottom.toDouble(), // Result
        mInnerBottomLeftCorner!!)
    /** Compute mInnerTopRightCorner */
    if (mInnerTopRightCorner == null) {
      mInnerTopRightCorner = PointF()
    }
    mInnerTopRightCorner!!.x = mInnerClipTempRectForBorderRadius!!.right
    mInnerTopRightCorner!!.y = mInnerClipTempRectForBorderRadius!!.top
    getEllipseIntersectionWithLine( // Ellipse Bounds
        (mInnerClipTempRectForBorderRadius!!.right - 2 * innerTopRightRadiusX).toDouble(),
        mInnerClipTempRectForBorderRadius!!.top.toDouble(),
        mInnerClipTempRectForBorderRadius!!.right.toDouble(),
        (mInnerClipTempRectForBorderRadius!!.top + 2 * innerTopRightRadiusY)
            .toDouble(), // Line Start
        mOuterClipTempRectForBorderRadius!!.right.toDouble(),
        mOuterClipTempRectForBorderRadius!!.top.toDouble(), // Line End
        mInnerClipTempRectForBorderRadius!!.right.toDouble(),
        mInnerClipTempRectForBorderRadius!!.top.toDouble(), // Result
        mInnerTopRightCorner!!)
    /** Compute mInnerBottomRightCorner */
    if (mInnerBottomRightCorner == null) {
      mInnerBottomRightCorner = PointF()
    }
    mInnerBottomRightCorner!!.x = mInnerClipTempRectForBorderRadius!!.right
    mInnerBottomRightCorner!!.y = mInnerClipTempRectForBorderRadius!!.bottom
    getEllipseIntersectionWithLine( // Ellipse Bounds
        (mInnerClipTempRectForBorderRadius!!.right - 2 * innerBottomRightRadiusX).toDouble(),
        (mInnerClipTempRectForBorderRadius!!.bottom - 2 * innerBottomRightRadiusY).toDouble(),
        mInnerClipTempRectForBorderRadius!!.right.toDouble(),
        mInnerClipTempRectForBorderRadius!!.bottom.toDouble(), // Line Start
        mOuterClipTempRectForBorderRadius!!.right.toDouble(),
        mOuterClipTempRectForBorderRadius!!.bottom.toDouble(), // Line End
        mInnerClipTempRectForBorderRadius!!.right.toDouble(),
        mInnerClipTempRectForBorderRadius!!.bottom.toDouble(), // Result
        mInnerBottomRightCorner!!)
  }

  public fun getBorderWidthOrDefaultTo(defaultValue: Float, spacingType: Int): Float {
    val width = getBorderWidth(spacingType) ?: return defaultValue
    return width
  }

  public fun getBorderWidth(spacingType: Int): Float? {
    if (mBorderWidth == null) {
      return null
    }
    val width = mBorderWidth!!.getRaw(spacingType)
    return if (java.lang.Float.isNaN(width)) {
      null
    } else width
  }

  /** Set type of border */
  private fun updatePathEffect() {
    // Used for rounded border and rounded background
    val mPathEffectForBorderStyle =
        if (borderStyle != null) getPathEffect(borderStyle!!, fullBorderWidth) else null
    mPaint.setPathEffect(mPathEffectForBorderStyle)
  }

  private fun updatePathEffect(borderWidth: Int) {
    var pathEffectForBorderStyle: PathEffect? = null
    if (borderStyle != null) {
      pathEffectForBorderStyle = getPathEffect(borderStyle!!, borderWidth.toFloat())
    }
    mPaint.setPathEffect(pathEffectForBorderStyle)
  }

  public val fullBorderWidth: Float
    /** For rounded borders we use default "borderWidth" property. */
    get() =
        if (mBorderWidth != null && !java.lang.Float.isNaN(mBorderWidth!!.getRaw(Spacing.ALL)))
            mBorderWidth!!.getRaw(Spacing.ALL)
        else 0f

  private fun drawRectangularBackgroundWithBorders(canvas: Canvas) {
    mPaint.style = Paint.Style.FILL
    val useColor = multiplyColorAlpha(mColor, mAlpha)
    if (Color.alpha(useColor) != 0) {
      mPaint.color = useColor
      canvas.drawRect(bounds, mPaint)
    }
    if (mGradients != null && mGradients!!.size > 0) {
      mPaint.setShader(gradientShader)
      canvas.drawRect(bounds, mPaint)
      mPaint.setShader(null)
    }
    val borderWidth = directionAwareBorderInsets
    val borderLeft = Math.round(borderWidth.left)
    val borderTop = Math.round(borderWidth.top)
    val borderRight = Math.round(borderWidth.right)
    val borderBottom = Math.round(borderWidth.bottom)

    // maybe draw borders?
    if (borderLeft > 0 || borderRight > 0 || borderTop > 0 || borderBottom > 0) {
      val bounds = bounds
      var colorLeft = getBorderColor(Spacing.LEFT)
      var colorTop = getBorderColor(Spacing.TOP)
      var colorRight = getBorderColor(Spacing.RIGHT)
      var colorBottom = getBorderColor(Spacing.BOTTOM)
      val colorBlock = getBorderColor(Spacing.BLOCK)
      val colorBlockStart = getBorderColor(Spacing.BLOCK_START)
      val colorBlockEnd = getBorderColor(Spacing.BLOCK_END)
      if (isBorderColorDefined(Spacing.BLOCK)) {
        colorBottom = colorBlock
        colorTop = colorBlock
      }
      if (isBorderColorDefined(Spacing.BLOCK_END)) {
        colorBottom = colorBlockEnd
      }
      if (isBorderColorDefined(Spacing.BLOCK_START)) {
        colorTop = colorBlockStart
      }
      val isRTL = layoutDirection == View.LAYOUT_DIRECTION_RTL
      var colorStart = getBorderColor(Spacing.START)
      var colorEnd = getBorderColor(Spacing.END)
      if (instance.doLeftAndRightSwapInRTL(mContext)) {
        if (!isBorderColorDefined(Spacing.START)) {
          colorStart = colorLeft
        }
        if (!isBorderColorDefined(Spacing.END)) {
          colorEnd = colorRight
        }
        val directionAwareColorLeft = if (isRTL) colorEnd else colorStart
        val directionAwareColorRight = if (isRTL) colorStart else colorEnd
        colorLeft = directionAwareColorLeft
        colorRight = directionAwareColorRight
      } else {
        val directionAwareColorLeft = if (isRTL) colorEnd else colorStart
        val directionAwareColorRight = if (isRTL) colorStart else colorEnd
        val isColorStartDefined = isBorderColorDefined(Spacing.START)
        val isColorEndDefined = isBorderColorDefined(Spacing.END)
        val isDirectionAwareColorLeftDefined = if (isRTL) isColorEndDefined else isColorStartDefined
        val isDirectionAwareColorRightDefined =
            if (isRTL) isColorStartDefined else isColorEndDefined
        if (isDirectionAwareColorLeftDefined) {
          colorLeft = directionAwareColorLeft
        }
        if (isDirectionAwareColorRightDefined) {
          colorRight = directionAwareColorRight
        }
      }
      val left = bounds.left
      val top = bounds.top

      // Check for fast path to border drawing.
      val fastBorderColor =
          fastBorderCompatibleColorOrZero(
              borderLeft,
              borderTop,
              borderRight,
              borderBottom,
              colorLeft,
              colorTop,
              colorRight,
              colorBottom)
      if (fastBorderColor != 0) {
        if (Color.alpha(fastBorderColor) != 0) {
          // Border color is not transparent.
          val right = bounds.right
          val bottom = bounds.bottom
          mPaint.color = fastBorderColor
          mPaint.style = Paint.Style.STROKE
          if (borderLeft > 0) {
            mPathForSingleBorder.reset()
            val width = Math.round(borderWidth.left)
            updatePathEffect(width)
            mPaint.strokeWidth = width.toFloat()
            mPathForSingleBorder.moveTo((left + width / 2).toFloat(), top.toFloat())
            mPathForSingleBorder.lineTo((left + width / 2).toFloat(), bottom.toFloat())
            canvas.drawPath(mPathForSingleBorder, mPaint)
          }
          if (borderTop > 0) {
            mPathForSingleBorder.reset()
            val width = Math.round(borderWidth.top)
            updatePathEffect(width)
            mPaint.strokeWidth = width.toFloat()
            mPathForSingleBorder.moveTo(left.toFloat(), (top + width / 2).toFloat())
            mPathForSingleBorder.lineTo(right.toFloat(), (top + width / 2).toFloat())
            canvas.drawPath(mPathForSingleBorder, mPaint)
          }
          if (borderRight > 0) {
            mPathForSingleBorder.reset()
            val width = Math.round(borderWidth.right)
            updatePathEffect(width)
            mPaint.strokeWidth = width.toFloat()
            mPathForSingleBorder.moveTo((right - width / 2).toFloat(), top.toFloat())
            mPathForSingleBorder.lineTo((right - width / 2).toFloat(), bottom.toFloat())
            canvas.drawPath(mPathForSingleBorder, mPaint)
          }
          if (borderBottom > 0) {
            mPathForSingleBorder.reset()
            val width = Math.round(borderWidth.bottom)
            updatePathEffect(width)
            mPaint.strokeWidth = width.toFloat()
            mPathForSingleBorder.moveTo(left.toFloat(), (bottom - width / 2).toFloat())
            mPathForSingleBorder.lineTo(right.toFloat(), (bottom - width / 2).toFloat())
            canvas.drawPath(mPathForSingleBorder, mPaint)
          }
        }
      } else {
        // If the path drawn previously is of the same color,
        // there would be a slight white space between borders
        // with anti-alias set to true.
        // Therefore we need to disable anti-alias, and
        // after drawing is done, we will re-enable it.
        mPaint.isAntiAlias = false
        val width = bounds.width()
        val height = bounds.height()
        if (borderLeft > 0) {
          val x1 = left.toFloat()
          val y1 = top.toFloat()
          val x2 = (left + borderLeft).toFloat()
          val y2 = (top + borderTop).toFloat()
          val x3 = (left + borderLeft).toFloat()
          val y3 = (top + height - borderBottom).toFloat()
          val x4 = left.toFloat()
          val y4 = (top + height).toFloat()
          drawQuadrilateral(canvas, colorLeft, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderTop > 0) {
          val x1 = left.toFloat()
          val y1 = top.toFloat()
          val x2 = (left + borderLeft).toFloat()
          val y2 = (top + borderTop).toFloat()
          val x3 = (left + width - borderRight).toFloat()
          val y3 = (top + borderTop).toFloat()
          val x4 = (left + width).toFloat()
          val y4 = top.toFloat()
          drawQuadrilateral(canvas, colorTop, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderRight > 0) {
          val x1 = (left + width).toFloat()
          val y1 = top.toFloat()
          val x2 = (left + width).toFloat()
          val y2 = (top + height).toFloat()
          val x3 = (left + width - borderRight).toFloat()
          val y3 = (top + height - borderBottom).toFloat()
          val x4 = (left + width - borderRight).toFloat()
          val y4 = (top + borderTop).toFloat()
          drawQuadrilateral(canvas, colorRight, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderBottom > 0) {
          val x1 = left.toFloat()
          val y1 = (top + height).toFloat()
          val x2 = (left + width).toFloat()
          val y2 = (top + height).toFloat()
          val x3 = (left + width - borderRight).toFloat()
          val y3 = (top + height - borderBottom).toFloat()
          val x4 = (left + borderLeft).toFloat()
          val y4 = (top + height - borderBottom).toFloat()
          drawQuadrilateral(canvas, colorBottom, x1, y1, x2, y2, x3, y3, x4, y4)
        }

        // re-enable anti alias
        mPaint.isAntiAlias = true
      }
    }
  }

  private fun drawQuadrilateral(
      canvas: Canvas,
      fillColor: Int,
      x1: Float,
      y1: Float,
      x2: Float,
      y2: Float,
      x3: Float,
      y3: Float,
      x4: Float,
      y4: Float
  ) {
    if (fillColor == Color.TRANSPARENT) {
      return
    }
    if (mPathForBorder == null) {
      mPathForBorder = Path()
    }
    mPaint.color = fillColor
    mPathForBorder!!.reset()
    mPathForBorder!!.moveTo(x1, y1)
    mPathForBorder!!.lineTo(x2, y2)
    mPathForBorder!!.lineTo(x3, y3)
    mPathForBorder!!.lineTo(x4, y4)
    mPathForBorder!!.lineTo(x1, y1)
    canvas.drawPath(mPathForBorder!!, mPaint)
  }

  private fun isBorderColorDefined(position: Int): Boolean {
    val rgb = if (mBorderRGB != null) mBorderRGB!![position] else Float.NaN
    val alpha = if (mBorderAlpha != null) mBorderAlpha!![position] else Float.NaN
    return !java.lang.Float.isNaN(rgb) && !java.lang.Float.isNaN(alpha)
  }

  public fun getBorderColor(position: Int): Int {
    val rgb = if (mBorderRGB != null) mBorderRGB!![position] else DEFAULT_BORDER_RGB.toFloat()
    val alpha =
        if (mBorderAlpha != null) mBorderAlpha!![position] else DEFAULT_BORDER_ALPHA.toFloat()
    return colorFromAlphaAndRGBComponents(alpha, rgb)
  }

  public val directionAwareBorderInsets: RectF
    get() {
      val borderWidth = getBorderWidthOrDefaultTo(0f, Spacing.ALL)
      val borderTopWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.TOP)
      val borderBottomWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.BOTTOM)
      var borderLeftWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.LEFT)
      var borderRightWidth = getBorderWidthOrDefaultTo(borderWidth, Spacing.RIGHT)
      if (mBorderWidth != null) {
        val isRTL = layoutDirection == View.LAYOUT_DIRECTION_RTL
        var borderStartWidth = mBorderWidth!!.getRaw(Spacing.START)
        var borderEndWidth = mBorderWidth!!.getRaw(Spacing.END)
        if (instance.doLeftAndRightSwapInRTL(mContext)) {
          if (java.lang.Float.isNaN(borderStartWidth)) {
            borderStartWidth = borderLeftWidth
          }
          if (java.lang.Float.isNaN(borderEndWidth)) {
            borderEndWidth = borderRightWidth
          }
          val directionAwareBorderLeftWidth = if (isRTL) borderEndWidth else borderStartWidth
          val directionAwareBorderRightWidth = if (isRTL) borderStartWidth else borderEndWidth
          borderLeftWidth = directionAwareBorderLeftWidth
          borderRightWidth = directionAwareBorderRightWidth
        } else {
          val directionAwareBorderLeftWidth = if (isRTL) borderEndWidth else borderStartWidth
          val directionAwareBorderRightWidth = if (isRTL) borderStartWidth else borderEndWidth
          if (!java.lang.Float.isNaN(directionAwareBorderLeftWidth)) {
            borderLeftWidth = directionAwareBorderLeftWidth
          }
          if (!java.lang.Float.isNaN(directionAwareBorderRightWidth)) {
            borderRightWidth = directionAwareBorderRightWidth
          }
        }
      }
      return RectF(borderLeftWidth, borderTopWidth, borderRightWidth, borderBottomWidth)
    }

  private val gradientShader: Shader?
    get() {
      if (mGradients == null) {
        return null
      }
      var compositeShader: Shader? = null
      for (gradient in mGradients!!) {
        val currentShader = gradient.getShader(bounds) ?: continue
        compositeShader =
            if (compositeShader == null) {
              currentShader
            } else {
              ComposeShader(currentShader, compositeShader, PorterDuff.Mode.SRC_OVER)
            }
      }
      return compositeShader
    }

  private companion object {
    private const val DEFAULT_BORDER_COLOR = Color.BLACK
    private const val DEFAULT_BORDER_RGB = 0x00FFFFFF and DEFAULT_BORDER_COLOR
    private const val DEFAULT_BORDER_ALPHA = -0x1000000 and DEFAULT_BORDER_COLOR ushr 24
    // ~0 == 0xFFFFFFFF, all bits set to 1.
    private const val ALL_BITS_SET = 0.inv()
    // 0 == 0x00000000, all bits set to 0.
    private const val ALL_BITS_UNSET = 0

    private fun getPathEffect(style: BorderStyle, borderWidth: Float): PathEffect? {
      return when (style) {
        BorderStyle.SOLID -> null
        BorderStyle.DASHED ->
            DashPathEffect(
                floatArrayOf(borderWidth * 3, borderWidth * 3, borderWidth * 3, borderWidth * 3),
                0f)
        BorderStyle.DOTTED ->
            DashPathEffect(floatArrayOf(borderWidth, borderWidth, borderWidth, borderWidth), 0f)
      }
    }

    private fun getEllipseIntersectionWithLine(
        ellipseBoundsLeft: Double,
        ellipseBoundsTop: Double,
        ellipseBoundsRight: Double,
        ellipseBoundsBottom: Double,
        startX: Double,
        startY: Double,
        endX: Double,
        endY: Double,
        result: PointF
    ) {
      var lineStartX = startX
      var lineStartY = startY
      var lineEndX = endX
      var lineEndY = endY
      val ellipseCenterX = (ellipseBoundsLeft + ellipseBoundsRight) / 2
      val ellipseCenterY = (ellipseBoundsTop + ellipseBoundsBottom) / 2
      /**
       * Step 1:
       *
       * Translate the line so that the ellipse is at the origin.
       *
       * Why? It makes the math easier by changing the ellipse equation from ((x -
       * ellipseCenterX)/a)^2 + ((y - ellipseCenterY)/b)^2 = 1 to (x/a)^2 + (y/b)^2 = 1.
       */
      lineStartX -= ellipseCenterX
      lineStartY -= ellipseCenterY
      lineEndX -= ellipseCenterX
      lineEndY -= ellipseCenterY
      /**
       * Step 2:
       *
       * Ellipse equation: (x/a)^2 + (y/b)^2 = 1 Line equation: y = mx + c
       */
      val a = Math.abs(ellipseBoundsRight - ellipseBoundsLeft) / 2
      val b = Math.abs(ellipseBoundsBottom - ellipseBoundsTop) / 2
      val m = (lineEndY - lineStartY) / (lineEndX - lineStartX)
      val c = lineStartY - m * lineStartX // Just a point on the line
      /**
       * Step 3:
       *
       * Substitute the Line equation into the Ellipse equation. Solve for x. Eventually, you'll
       * have to use the quadratic formula.
       *
       * Quadratic formula: Ax^2 + Bx + C = 0
       */
      val A = b * b + a * a * m * m
      val B = 2 * a * a * c * m
      val C = a * a * (c * c - b * b)
      /**
       * Step 4:
       *
       * Apply Quadratic formula. D = determinant / 2A
       */
      val D = Math.sqrt(-C / A + Math.pow(B / (2 * A), 2.0))
      val x2 = -B / (2 * A) - D
      val y2 = m * x2 + c
      /**
       * Step 5:
       *
       * Undo the space transformation in Step 5.
       */
      val x = x2 + ellipseCenterX
      val y = y2 + ellipseCenterY
      if (!java.lang.Double.isNaN(x) && !java.lang.Double.isNaN(y)) {
        result.x = x.toFloat()
        result.y = y.toFloat()
      }
    }

    /**
     * Quickly determine if all the set border colors are equal. Bitwise AND all the set colors
     * together, then OR them all together. If the AND and the OR are the same, then the colors are
     * compatible, so return this color.
     *
     * Used to avoid expensive path creation and expensive calls to canvas.drawPath
     *
     * @return A compatible border color, or zero if the border colors are not compatible.
     */
    private fun fastBorderCompatibleColorOrZero(
        borderLeft: Int,
        borderTop: Int,
        borderRight: Int,
        borderBottom: Int,
        colorLeft: Int,
        colorTop: Int,
        colorRight: Int,
        colorBottom: Int
    ): Int {
      val andSmear =
          ((if (borderLeft > 0) colorLeft else ALL_BITS_SET) and
              (if (borderTop > 0) colorTop else ALL_BITS_SET) and
              (if (borderRight > 0) colorRight else ALL_BITS_SET) and
              if (borderBottom > 0) colorBottom else ALL_BITS_SET)
      val orSmear =
          ((if (borderLeft > 0) colorLeft else ALL_BITS_UNSET) or
              (if (borderTop > 0) colorTop else ALL_BITS_UNSET) or
              (if (borderRight > 0) colorRight else ALL_BITS_UNSET) or
              if (borderBottom > 0) colorBottom else ALL_BITS_UNSET)
      return if (andSmear == orSmear) andSmear else 0
    }

    private fun colorFromAlphaAndRGBComponents(alpha: Float, rgb: Float): Int {
      val rgbComponent = 0x00FFFFFF and rgb.toInt()
      val alphaComponent = -0x1000000 and (alpha.toInt() shl 24)
      return rgbComponent or alphaComponent
    }

    /**
     * Multiplies the color with the given alpha.
     *
     * @param color color to be multiplied
     * @param alpha value between 0 and 255
     * @return multiplied color
     */
    private fun multiplyColorAlpha(color: Int, alpha: Int): Int {
      var mutableAlpha = alpha
      if (mutableAlpha == 255) {
        return color
      }
      if (mutableAlpha == 0) {
        return color and 0x00FFFFFF
      }
      mutableAlpha += (mutableAlpha shr 7) // make it 0..256
      val colorAlpha = color ushr 24
      val multipliedAlpha = colorAlpha * mutableAlpha shr 8
      return multipliedAlpha shl 24 or (color and 0x00FFFFFF)
    }
  }
}
