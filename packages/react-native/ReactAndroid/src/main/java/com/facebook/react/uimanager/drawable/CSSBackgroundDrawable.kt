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
import android.graphics.DashPathEffect
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PathEffect
import android.graphics.PointF
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Region
import android.graphics.drawable.Drawable
import android.view.View
import androidx.core.graphics.ColorUtils
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.FloatUtil
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import kotlin.math.max

/**
 * A subclass of [Drawable] used for background of [ ]. It supports drawing background color and
 * borders (including rounded borders) by providing a react friendly API (setter for each of those
 * properties).
 *
 * The implementation tries to allocate as few objects as possible depending on which properties are
 * set. E.g. for views with rounded background/borders we allocate `innerClipPathForBorderRadius`
 * and `innerClipTempRectForBorderRadius`. In case when view have a rectangular borders we allocate
 * `borderWidthsResult` and similar. When only background color is set we won't allocate any
 * extra/unnecessary objects.
 */
public open class CSSBackgroundDrawable(private val context: Context) : Drawable() {
  private enum class BorderStyle {
    SOLID,
    DASHED,
    DOTTED;

    companion object {
      public fun getPathEffect(style: BorderStyle?, borderWidth: Float): PathEffect? {
        return when (style) {
          SOLID -> null
          DASHED ->
              DashPathEffect(
                  floatArrayOf(borderWidth * 3, borderWidth * 3, borderWidth * 3, borderWidth * 3),
                  0f)
          DOTTED ->
              DashPathEffect(floatArrayOf(borderWidth, borderWidth, borderWidth, borderWidth), 0f)
          else -> null
        }
      }
    }
  }

  /* Value at Spacing.ALL index used for rounded borders, whole array used by rectangular borders */
  private var borderWidths: Spacing? = null
  private var borderRGB: Spacing? = null
  private var borderAlpha: Spacing? = null
  private var borderStyle: BorderStyle? = null
  private var innerClipPathForBorderRadius: Path? = null
  private var backgroundColorRenderPath: Path? = null
  private var outerClipPathForBorderRadius: Path? = null
  private var pathForBorderRadiusOutline: Path? = null
  private var pathForBorder: Path? = null
  private val pathForSingleBorder = Path()
  private var centerDrawPath: Path? = null
  private var innerClipTempRectForBorderRadius: RectF? = null
  private var outerClipTempRectForBorderRadius: RectF? = null
  private var tempRectForBorderRadiusOutline: RectF? = null
  private var tempRectForCenterDrawPath: RectF? = null
  private var innerTopLeftCorner: PointF? = null
  private var innerTopRightCorner: PointF? = null
  private var innerBottomRightCorner: PointF? = null
  private var innerBottomLeftCorner: PointF? = null
  private var needUpdatePathForBorderRadius = false
  /* Used by all types of background and for drawing borders */
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private var alpha = 255
  // There is a small gap between the edges of adjacent paths
  // such as between the backgroundColorRenderPath and its border.
  // The smallest amount (found to be 0.8f) is used to extend
  // the paths, overlapping them and closing the visible gap.
  private val gapBetweenPaths = 0.8f
  // Should be removed after migrating to Android layout direction.
  private var layoutDirectionOverride = -1

  @get:VisibleForTesting
  public var color: Int = Color.TRANSPARENT
    set(value) {
      field = value
      invalidateSelf()
    }

  public var borderRadius: BorderRadiusStyle = BorderRadiusStyle()
  public var computedBorderRadius: ComputedBorderRadius = ComputedBorderRadius()
    private set

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
    needUpdatePathForBorderRadius = true
  }

  override fun setAlpha(value: Int) {
    if (alpha != value) {
      alpha = value
      invalidateSelf()
    }
  }

  override fun setColorFilter(cf: ColorFilter?) {
    // do nothing
  }

  @Deprecated("To be removed after migrating to Android layout direction")
  public fun setLayoutDirectionOverride(layoutDirection: Int) {
    if (layoutDirectionOverride != layoutDirection) {
      layoutDirectionOverride = layoutDirection
    }
  }

  @SuppressLint("WrongConstant")
  override fun getLayoutDirection(): Int {
    return if (layoutDirectionOverride == -1) super.getLayoutDirection()
    else layoutDirectionOverride
  }

  override fun getOpacity(): Int {
    return Color.alpha(color) * alpha shr 8
  }

  /* Android's elevation implementation requires this to be implemented to know where to draw the shadow. */
  @Suppress("DEPRECATION")
  override fun getOutline(outline: Outline) {
    if (hasRoundedBorders()) {
      updatePath()
      pathForBorderRadiusOutline?.let { outlinePath -> outline.setPath(outlinePath) }
    } else {
      outline.setRect(bounds)
    }
  }

  public fun setBorderWidth(position: Int, width: Float) {
    val widths = borderWidths ?: Spacing().apply { borderWidths = this }
    if (!FloatUtil.floatsEqual(widths.getRaw(position), width)) {
      widths[position] = width
      when (position) {
        Spacing.ALL,
        Spacing.LEFT,
        Spacing.BOTTOM,
        Spacing.RIGHT,
        Spacing.TOP,
        Spacing.START,
        Spacing.END -> needUpdatePathForBorderRadius = true
      }
      invalidateSelf()
    }
  }

  public fun setBorderColor(position: Int, rgb: Float, alpha: Float) {
    setBorderRGB(position, rgb)
    setBorderAlpha(position, alpha)
    needUpdatePathForBorderRadius = true
  }

  private fun setBorderRGB(position: Int, rgb: Float) {
    // set RGB component
    val color = borderRGB ?: Spacing(DEFAULT_BORDER_RGB.toFloat()).apply { borderRGB = this }
    if (!FloatUtil.floatsEqual(color.getRaw(position), rgb)) {
      color[position] = rgb
      invalidateSelf()
    }
  }

  private fun setBorderAlpha(position: Int, alpha: Float) {
    // set Alpha component
    if (borderAlpha == null) {
      borderAlpha = Spacing(DEFAULT_BORDER_ALPHA.toFloat())
    }
    if (!FloatUtil.floatsEqual(borderAlpha?.getRaw(position), alpha)) {
      borderAlpha?.set(position, alpha)
      invalidateSelf()
    }
  }

  public fun setBorderStyle(style: String?) {
    val newBorderStyle = if (style == null) null else BorderStyle.valueOf(style.uppercase())
    if (borderStyle != newBorderStyle) {
      borderStyle = newBorderStyle
      needUpdatePathForBorderRadius = true
      invalidateSelf()
    }
  }

  @Deprecated("Use {@link #setBorderRadius(BorderRadiusProp, LengthPercentage)} instead.")
  public fun setRadius(radius: Float) {
    val boxedRadius = if (radius.isNaN()) null else java.lang.Float.valueOf(radius)
    if (boxedRadius == null) {
      setBorderRadius(BorderRadiusProp.BORDER_RADIUS, null)
    } else {
      setBorderRadius(
          BorderRadiusProp.BORDER_RADIUS, LengthPercentage(boxedRadius, LengthPercentageType.POINT))
    }
  }

  @Deprecated("Use {@link #setBorderRadius(BorderRadiusProp, LengthPercentage)} instead.")
  public fun setRadius(radius: Float, position: Int) {
    val boxedRadius = if (radius.isNaN()) null else java.lang.Float.valueOf(radius)
    if (boxedRadius == null) {
      borderRadius.set(BorderRadiusProp.values().get(position), null)
    } else {
      setBorderRadius(
          BorderRadiusProp.values().get(position),
          LengthPercentage(boxedRadius, LengthPercentageType.POINT))
    }
  }

  public fun setBorderRadius(property: BorderRadiusProp, radius: LengthPercentage?) {
    if (radius != borderRadius.get(property)) {
      borderRadius.set(property, radius)
      needUpdatePathForBorderRadius = true
      invalidateSelf()
    }
  }

  public fun borderBoxPath(): Path {
    updatePath()
    return checkNotNull(outerClipPathForBorderRadius)
  }

  public fun paddingBoxPath(): Path {
    updatePath()
    return checkNotNull(innerClipPathForBorderRadius)
  }

  @Suppress("DEPRECATION")
  private fun drawRoundedBackgroundWithBorders(canvas: Canvas) {
    updatePath()
    canvas.save()

    // Clip outer border
    canvas.clipPath(borderBoxPath())

    // Draws the View without its border first (with background color fill)
    val useColor: Int = ColorUtils.setAlphaComponent(color, opacity)
    if (Color.alpha(useColor) != 0) { // color is not transparent
      paint.color = useColor
      paint.style = Paint.Style.FILL
      canvas.drawPath(checkNotNull(backgroundColorRenderPath), paint)
    }
    val borderInsets: RectF = directionAwareBorderInsets
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
    if (borderInsets.top > 0 ||
        borderInsets.bottom > 0 ||
        borderInsets.left > 0 ||
        borderInsets.right > 0) {

      // If it's a full and even border draw inner rect path with stroke
      val fullborderWidths = calculateFullborderWidths()
      val borderColor = getBorderColor(Spacing.ALL)
      if (borderInsets.top == fullborderWidths &&
          borderInsets.bottom == fullborderWidths &&
          borderInsets.left == fullborderWidths &&
          borderInsets.right == fullborderWidths &&
          colorLeft == borderColor &&
          colorTop == borderColor &&
          colorRight == borderColor &&
          colorBottom == borderColor) {
        if (fullborderWidths > 0) {
          paint.color = multiplyColorAlpha(borderColor, alpha)
          paint.style = Paint.Style.STROKE
          paint.strokeWidth = fullborderWidths
          canvas.drawPath(checkNotNull(centerDrawPath), paint)
        }
      } else {
        // In the case of uneven border widths/colors draw quadrilateral in each direction
        paint.style = Paint.Style.FILL

        // Clip inner border
        canvas.clipPath(paddingBoxPath(), Region.Op.DIFFERENCE)
        val isRTL = layoutDirection == View.LAYOUT_DIRECTION_RTL
        var colorStart = getBorderColor(Spacing.START)
        var colorEnd = getBorderColor(Spacing.END)
        if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(context)) {
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
        val outerClipTempRect: RectF = checkNotNull(outerClipTempRectForBorderRadius)
        val left: Float = outerClipTempRect.left
        val right: Float = outerClipTempRect.right
        val top: Float = outerClipTempRect.top
        val bottom: Float = outerClipTempRect.bottom
        val innerTopLeftCorner: PointF = checkNotNull(innerTopLeftCorner)
        val innerTopRightCorner: PointF = checkNotNull(innerTopRightCorner)
        val innerBottomLeftCorner: PointF = checkNotNull(innerBottomLeftCorner)
        val innerBottomRightCorner: PointF = checkNotNull(innerBottomRightCorner)

        // gapBetweenPaths is used to close the gap between the diagonal
        // edges of the quadrilaterals on adjacent sides of the rectangle
        if (borderInsets.left > 0) {
          val x1 = left
          val y1 = top - gapBetweenPaths
          val x2: Float = innerTopLeftCorner.x
          val y2: Float = innerTopLeftCorner.y - gapBetweenPaths
          val x3: Float = innerBottomLeftCorner.x
          val y3: Float = innerBottomLeftCorner.y + gapBetweenPaths
          val x4 = left
          val y4 = bottom + gapBetweenPaths
          drawQuadrilateral(canvas, colorLeft, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderInsets.top > 0) {
          val x1 = left - gapBetweenPaths
          val y1 = top
          val x2: Float = innerTopLeftCorner.x - gapBetweenPaths
          val y2: Float = innerTopLeftCorner.y
          val x3: Float = innerTopRightCorner.x + gapBetweenPaths
          val y3: Float = innerTopRightCorner.y
          val x4 = right + gapBetweenPaths
          val y4 = top
          drawQuadrilateral(canvas, colorTop, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderInsets.right > 0) {
          val x1 = right
          val y1 = top - gapBetweenPaths
          val x2: Float = innerTopRightCorner.x
          val y2: Float = innerTopRightCorner.y - gapBetweenPaths
          val x3: Float = innerBottomRightCorner.x
          val y3: Float = innerBottomRightCorner.y + gapBetweenPaths
          val x4 = right
          val y4 = bottom + gapBetweenPaths
          drawQuadrilateral(canvas, colorRight, x1, y1, x2, y2, x3, y3, x4, y4)
        }
        if (borderInsets.bottom > 0) {
          val x1 = left - gapBetweenPaths
          val y1 = bottom
          val x2: Float = innerBottomLeftCorner.x - gapBetweenPaths
          val y2: Float = innerBottomLeftCorner.y
          val x3: Float = innerBottomRightCorner.x + gapBetweenPaths
          val y3: Float = innerBottomRightCorner.y
          val x4 = right + gapBetweenPaths
          val y4 = bottom
          drawQuadrilateral(canvas, colorBottom, x1, y1, x2, y2, x3, y3, x4, y4)
        }
      }
    }
    canvas.restore()
  }

  /** For rounded borders we use default "borderWidths" property. */
  private fun calculateFullborderWidths(): Float = getborderWidthsOrDefaultTo(0f, Spacing.ALL)

  private fun updatePath() {
    if (!needUpdatePathForBorderRadius) {
      return
    }
    needUpdatePathForBorderRadius = false
    if (innerClipPathForBorderRadius == null) {
      innerClipPathForBorderRadius = Path()
    }
    if (backgroundColorRenderPath == null) {
      backgroundColorRenderPath = Path()
    }
    if (outerClipPathForBorderRadius == null) {
      outerClipPathForBorderRadius = Path()
    }
    if (pathForBorderRadiusOutline == null) {
      pathForBorderRadiusOutline = Path()
    }
    if (centerDrawPath == null) {
      centerDrawPath = Path()
    }

    val innerClipRectForBorderRadius =
        innerClipTempRectForBorderRadius
            ?: (RectF().apply { innerClipTempRectForBorderRadius = this })
    val outerClipRectForBorderRadius =
        outerClipTempRectForBorderRadius
            ?: (RectF().apply { outerClipTempRectForBorderRadius = this })
    val rectForBorderRadiusOutline =
        tempRectForBorderRadiusOutline ?: (RectF().apply { tempRectForBorderRadiusOutline = this })
    val rectForCenterDrawPath =
        tempRectForCenterDrawPath ?: (RectF().apply { tempRectForCenterDrawPath = this })

    innerClipRectForBorderRadius.set(bounds)
    outerClipRectForBorderRadius.set(bounds)
    rectForBorderRadiusOutline.set(bounds)
    rectForCenterDrawPath.set(bounds)
    val borderInsets: RectF = directionAwareBorderInsets
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
      innerClipRectForBorderRadius.top += borderInsets.top
      innerClipRectForBorderRadius.bottom -= borderInsets.bottom
      innerClipRectForBorderRadius.left += borderInsets.left
      innerClipRectForBorderRadius.right -= borderInsets.right
    }

    rectForCenterDrawPath.top += borderInsets.top * 0.5f
    rectForCenterDrawPath.bottom -= borderInsets.bottom * 0.5f
    rectForCenterDrawPath.left += borderInsets.left * 0.5f
    rectForCenterDrawPath.right -= borderInsets.right * 0.5f
    computedBorderRadius =
        borderRadius.resolve(
            layoutDirection,
            context,
            outerClipRectForBorderRadius.width(),
            outerClipRectForBorderRadius.height())
    val topLeftRadius: Float = computedBorderRadius.topLeft
    val topRightRadius: Float = computedBorderRadius.topRight
    val bottomLeftRadius: Float = computedBorderRadius.bottomLeft
    val bottomRightRadius: Float = computedBorderRadius.bottomRight
    val innerTopLeftRadiusX = max(topLeftRadius - borderInsets.left, 0f)
    val innerTopLeftRadiusY = max(topLeftRadius - borderInsets.top, 0f)
    val innerTopRightRadiusX = max(topRightRadius - borderInsets.right, 0f)
    val innerTopRightRadiusY = max(topRightRadius - borderInsets.top, 0f)
    val innerBottomRightRadiusX = max(bottomRightRadius - borderInsets.right, 0f)
    val innerBottomRightRadiusY = max(bottomRightRadius - borderInsets.bottom, 0f)
    val innerBottomLeftRadiusX = max(bottomLeftRadius - borderInsets.left, 0f)
    val innerBottomLeftRadiusY = max(bottomLeftRadius - borderInsets.bottom, 0f)
    innerClipPathForBorderRadius?.apply {
      addRoundRect(
          innerClipRectForBorderRadius,
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
    }

    // There is a small gap between backgroundColorRenderPath and its
    // border. gapBetweenPaths is used to slightly enlarge the rectangle
    // (innerClipTempRectForBorderRadius), ensuring the border can be
    // drawn on top without the gap.
    backgroundColorRenderPath?.apply {
      addRoundRect(
          innerClipRectForBorderRadius.left - gapBetweenPaths,
          innerClipRectForBorderRadius.top - gapBetweenPaths,
          innerClipRectForBorderRadius.right + gapBetweenPaths,
          innerClipRectForBorderRadius.bottom + gapBetweenPaths,
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
    }
    outerClipPathForBorderRadius?.apply {
      addRoundRect(
          outerClipRectForBorderRadius,
          floatArrayOf(
              topLeftRadius,
              topLeftRadius,
              topRightRadius,
              topRightRadius,
              bottomRightRadius,
              bottomRightRadius,
              bottomLeftRadius,
              bottomLeftRadius),
          Path.Direction.CW)
    }
    val extraRadiusForOutline = borderWidths?.let { it.get(Spacing.ALL) / 2f } ?: 0.0f
    pathForBorderRadiusOutline?.apply {
      addRoundRect(
          rectForBorderRadiusOutline,
          floatArrayOf(
              topLeftRadius + extraRadiusForOutline,
              topLeftRadius + extraRadiusForOutline,
              topRightRadius + extraRadiusForOutline,
              topRightRadius + extraRadiusForOutline,
              bottomRightRadius + extraRadiusForOutline,
              bottomRightRadius + extraRadiusForOutline,
              bottomLeftRadius + extraRadiusForOutline,
              bottomLeftRadius + extraRadiusForOutline),
          Path.Direction.CW)
    }
    centerDrawPath?.apply {
      addRoundRect(
          rectForCenterDrawPath,
          floatArrayOf(
              max(
                  topLeftRadius - borderInsets.left * 0.5f,
                  if (borderInsets.left > 0.0f) topLeftRadius / borderInsets.left else 0.0f),
              max(
                  topLeftRadius - borderInsets.top * 0.5f,
                  if (borderInsets.top > 0.0f) topLeftRadius / borderInsets.top else 0.0f),
              max(
                  topRightRadius - borderInsets.right * 0.5f,
                  if (borderInsets.right > 0.0f) topRightRadius / borderInsets.right else 0.0f),
              max(
                  topRightRadius - borderInsets.top * 0.5f,
                  if (borderInsets.top > 0.0f) topRightRadius / borderInsets.top else 0.0f),
              max(
                  bottomRightRadius - borderInsets.right * 0.5f,
                  if (borderInsets.right > 0.0f) bottomRightRadius / borderInsets.right else 0.0f),
              max(
                  bottomRightRadius - borderInsets.bottom * 0.5f,
                  if (borderInsets.bottom > 0.0f) bottomRightRadius / borderInsets.bottom
                  else 0.0f),
              max(
                  bottomLeftRadius - borderInsets.left * 0.5f,
                  if (borderInsets.left > 0.0f) bottomLeftRadius / borderInsets.left else 0.0f),
              max(
                  bottomLeftRadius - borderInsets.bottom * 0.5f,
                  if (borderInsets.bottom > 0.0f) bottomLeftRadius / borderInsets.bottom
                  else 0.0f)),
          Path.Direction.CW)
    }
    /**
     * Rounded Multi-Colored Border Algorithm:
     *
     * Let O (for outer) = (top, left, bottom, right) be the rectangle that represents the size and
     * position of a view V. Since the box-sizing of all React Native views is border-box, any
     * border of V will render inside O.
     *
     * Let borderWidths = (borderTop, borderLeft, borderBottom, borderRight).
     *
     * Let I (for inner) = O - borderWidths.
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
    /** Compute innerTopLeftCorner */
    if (innerTopLeftCorner == null) {
      innerTopLeftCorner = PointF()
    }
    innerTopLeftCorner?.apply {
      x = innerClipRectForBorderRadius.left
      y = innerClipRectForBorderRadius.top

      getEllipseIntersectionWithLine( // Ellipse Bounds
          innerClipRectForBorderRadius.left.toDouble(),
          innerClipRectForBorderRadius.top.toDouble(),
          (innerClipRectForBorderRadius.left + 2 * innerTopLeftRadiusX).toDouble(),
          (innerClipRectForBorderRadius.top + 2 * innerTopLeftRadiusY).toDouble(), // Line Start
          innerClipRectForBorderRadius.left.toDouble(),
          innerClipRectForBorderRadius.top.toDouble(), // Line End
          innerClipRectForBorderRadius.left.toDouble(),
          innerClipRectForBorderRadius.top.toDouble(), // Result
          this)
    }
    /** Compute innerBottomLeftCorner */
    if (innerBottomLeftCorner == null) {
      innerBottomLeftCorner = PointF()
    }
    innerBottomLeftCorner?.apply {
      x = innerClipRectForBorderRadius.left
      y = innerClipRectForBorderRadius.bottom

      getEllipseIntersectionWithLine( // Ellipse Bounds
          innerClipRectForBorderRadius.left.toDouble(),
          (innerClipRectForBorderRadius.bottom - 2 * innerBottomLeftRadiusY).toDouble(),
          (innerClipRectForBorderRadius.left + 2 * innerBottomLeftRadiusX).toDouble(),
          innerClipRectForBorderRadius.bottom.toDouble(), // Line Start
          innerClipRectForBorderRadius.left.toDouble(),
          innerClipRectForBorderRadius.bottom.toDouble(), // Line End
          innerClipRectForBorderRadius.left.toDouble(),
          innerClipRectForBorderRadius.bottom.toDouble(), // Result
          this)
    }
    /** Compute innerTopRightCorner */
    if (innerTopRightCorner == null) {
      innerTopRightCorner = PointF()
    }
    innerTopRightCorner?.apply {
      x = innerClipRectForBorderRadius.right
      y = innerClipRectForBorderRadius.top

      getEllipseIntersectionWithLine( // Ellipse Bounds
          (innerClipRectForBorderRadius.right - 2 * innerTopRightRadiusX).toDouble(),
          innerClipRectForBorderRadius.top.toDouble(),
          innerClipRectForBorderRadius.right.toDouble(),
          (innerClipRectForBorderRadius.top + 2 * innerTopRightRadiusY).toDouble(), // Line Start
          innerClipRectForBorderRadius.right.toDouble(),
          innerClipRectForBorderRadius.top.toDouble(), // Line End
          innerClipRectForBorderRadius.right.toDouble(),
          innerClipRectForBorderRadius.top.toDouble(), // Result
          this)
    }
    /** Compute innerBottomRightCorner */
    if (innerBottomRightCorner == null) {
      innerBottomRightCorner = PointF()
    }
    innerBottomRightCorner?.apply {
      x = innerClipRectForBorderRadius.right
      y = innerClipRectForBorderRadius.bottom

      getEllipseIntersectionWithLine( // Ellipse Bounds
          (innerClipRectForBorderRadius.right - 2 * innerBottomRightRadiusX).toDouble(),
          (innerClipRectForBorderRadius.bottom - 2 * innerBottomRightRadiusY).toDouble(),
          innerClipRectForBorderRadius.right.toDouble(),
          innerClipRectForBorderRadius.bottom.toDouble(), // Line Start
          innerClipRectForBorderRadius.right.toDouble(),
          innerClipRectForBorderRadius.bottom.toDouble(), // Line End
          innerClipRectForBorderRadius.right.toDouble(),
          innerClipRectForBorderRadius.bottom.toDouble(), // Result
          this)
    }
  }

  public fun getborderWidthsOrDefaultTo(defaultValue: Float, spacingType: Int): Float {
    return (borderWidths?.getRaw(spacingType)?.let { width ->
      if (width.isNaN()) defaultValue else width
    }) ?: defaultValue
  }

  /** Set type of border */
  private fun updatePathEffect() {
    // Used for rounded border and rounded background
    val pathEffectForBorderStyle: PathEffect? =
        if (borderStyle != null) BorderStyle.getPathEffect(borderStyle, calculateFullborderWidths())
        else null
    paint.pathEffect = pathEffectForBorderStyle
  }

  private fun updatePathEffect(borderWidths: Int) {
    var pathEffectForBorderStyle: PathEffect? = null
    if (borderStyle != null) {
      pathEffectForBorderStyle = BorderStyle.getPathEffect(borderStyle, borderWidths.toFloat())
    }
    paint.pathEffect = pathEffectForBorderStyle
  }

  private fun drawRectangularBackgroundWithBorders(canvas: Canvas) {
    paint.style = Paint.Style.FILL
    val useColor = multiplyColorAlpha(color, alpha)
    if (Color.alpha(useColor) != 0) { // color is not transparent
      paint.color = useColor
      canvas.drawRect(bounds, paint)
    }
    val borderInsets: RectF = directionAwareBorderInsets
    val borderLeft = Math.round(borderInsets.left).toInt()
    val borderTop = Math.round(borderInsets.top).toInt()
    val borderRight = Math.round(borderInsets.right).toInt()
    val borderBottom = Math.round(borderInsets.bottom).toInt()

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
      if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(context)) {
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
          paint.color = fastBorderColor
          paint.style = Paint.Style.STROKE
          if (borderLeft > 0) {
            pathForSingleBorder.reset()
            val width = Math.round(borderInsets.left).toInt()
            updatePathEffect(width)
            paint.strokeWidth = width.toFloat()
            pathForSingleBorder.moveTo((left + width / 2).toFloat(), top.toFloat())
            pathForSingleBorder.lineTo((left + width / 2).toFloat(), bottom.toFloat())
            canvas.drawPath(pathForSingleBorder, paint)
          }
          if (borderTop > 0) {
            pathForSingleBorder.reset()
            val width = Math.round(borderInsets.top).toInt()
            updatePathEffect(width)
            paint.strokeWidth = width.toFloat()
            pathForSingleBorder.moveTo(left.toFloat(), (top + width / 2).toFloat())
            pathForSingleBorder.lineTo(right.toFloat(), (top + width / 2).toFloat())
            canvas.drawPath(pathForSingleBorder, paint)
          }
          if (borderRight > 0) {
            pathForSingleBorder.reset()
            val width = Math.round(borderInsets.right).toInt()
            updatePathEffect(width)
            paint.strokeWidth = width.toFloat()
            pathForSingleBorder.moveTo((right - width / 2).toFloat(), top.toFloat())
            pathForSingleBorder.lineTo((right - width / 2).toFloat(), bottom.toFloat())
            canvas.drawPath(pathForSingleBorder, paint)
          }
          if (borderBottom > 0) {
            pathForSingleBorder.reset()
            val width = Math.round(borderInsets.bottom).toInt()
            updatePathEffect(width)
            paint.strokeWidth = width.toFloat()
            pathForSingleBorder.moveTo(left.toFloat(), (bottom - width / 2).toFloat())
            pathForSingleBorder.lineTo(right.toFloat(), (bottom - width / 2).toFloat())
            canvas.drawPath(pathForSingleBorder, paint)
          }
        }
      } else {
        // If the path drawn previously is of the same color,
        // there would be a slight white space between borders
        // with anti-alias set to true.
        // Therefore we need to disable anti-alias, and
        // after drawing is done, we will re-enable it.
        paint.isAntiAlias = false
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
        paint.isAntiAlias = true
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
    val path = pathForBorder ?: (Path().apply { pathForBorder = this })
    paint.color = fillColor
    path.reset()
    path.moveTo(x1, y1)
    path.lineTo(x2, y2)
    path.lineTo(x3, y3)
    path.lineTo(x4, y4)
    path.lineTo(x1, y1)
    canvas.drawPath(path, paint)
  }

  private fun isBorderColorDefined(position: Int): Boolean {
    val rgb = borderRGB?.get(position) ?: Float.NaN
    val alpha = borderAlpha?.get(position) ?: Float.NaN
    return !rgb.isNaN() && !alpha.isNaN()
  }

  public fun getBorderColor(position: Int): Int {
    val rgb = borderRGB?.get(position) ?: DEFAULT_BORDER_RGB.toFloat()
    val alpha = borderAlpha?.get(position) ?: DEFAULT_BORDER_ALPHA.toFloat()
    return colorFromAlphaAndRGBComponents(alpha, rgb)
  }

  public val directionAwareBorderInsets: RectF
    get() {
      val borderUniformWidth = getborderWidthsOrDefaultTo(0f, Spacing.ALL)
      val borderTopWidth = getborderWidthsOrDefaultTo(borderUniformWidth, Spacing.TOP)
      val borderBottomWidth = getborderWidthsOrDefaultTo(borderUniformWidth, Spacing.BOTTOM)
      var borderLeftWidth = getborderWidthsOrDefaultTo(borderUniformWidth, Spacing.LEFT)
      var borderRightWidth = getborderWidthsOrDefaultTo(borderUniformWidth, Spacing.RIGHT)

      borderWidths?.let { widths ->
        val isRTL = layoutDirection == View.LAYOUT_DIRECTION_RTL
        var borderStartWidth: Float = widths.getRaw(Spacing.START)
        var borderEndWidth: Float = widths.getRaw(Spacing.END)
        if (I18nUtil.getInstance().doLeftAndRightSwapInRTL(context)) {
          if (borderStartWidth.isNaN()) {
            borderStartWidth = borderLeftWidth
          }
          if (borderEndWidth.isNaN()) {
            borderEndWidth = borderRightWidth
          }
          val directionAwareBorderLeftWidth = if (isRTL) borderEndWidth else borderStartWidth
          val directionAwareBorderRightWidth = if (isRTL) borderStartWidth else borderEndWidth
          borderLeftWidth = directionAwareBorderLeftWidth
          borderRightWidth = directionAwareBorderRightWidth
        } else {
          val directionAwareBorderLeftWidth = if (isRTL) borderEndWidth else borderStartWidth
          val directionAwareBorderRightWidth = if (isRTL) borderStartWidth else borderEndWidth
          if (!directionAwareBorderLeftWidth.isNaN()) {
            borderLeftWidth = directionAwareBorderLeftWidth
          }
          if (!directionAwareBorderRightWidth.isNaN()) {
            borderRightWidth = directionAwareBorderRightWidth
          }
        }
      }

      return RectF(borderLeftWidth, borderTopWidth, borderRightWidth, borderBottomWidth)
    }

  private companion object {
    private const val DEFAULT_BORDER_COLOR = Color.BLACK
    private const val DEFAULT_BORDER_RGB = 0x00FFFFFF and DEFAULT_BORDER_COLOR
    private const val DEFAULT_BORDER_ALPHA = -0x1000000 and DEFAULT_BORDER_COLOR ushr 24
    // ~0 == 0xFFFFFFFF, all bits set to 1.
    private const val ALL_BITS_SET = 0.inv()
    // 0 == 0x00000000, all bits set to 0.
    private const val ALL_BITS_UNSET = 0

    private fun getEllipseIntersectionWithLine(
        ellipseBoundsLeft: Double,
        ellipseBoundsTop: Double,
        ellipseBoundsRight: Double,
        ellipseBoundsBottom: Double,
        lineStartX: Double,
        lineStartY: Double,
        lineEndX: Double,
        lineEndY: Double,
        result: PointF
    ) {
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
      val translatedLineStartX = lineStartX - ellipseCenterX
      val translatedLineStartY = lineStartY - ellipseCenterY
      val translatedLineEndX = lineEndX - ellipseCenterX
      val translatedLineEndY = lineEndY - ellipseCenterY
      /**
       * Step 2:
       *
       * Ellipse equation: (x/a)^2 + (y/b)^2 = 1 Line equation: y = mx + c
       */
      val a = Math.abs(ellipseBoundsRight - ellipseBoundsLeft) / 2
      val b = Math.abs(ellipseBoundsBottom - ellipseBoundsTop) / 2
      val m =
          (translatedLineEndY - translatedLineStartY) / (translatedLineEndX - translatedLineStartX)
      val c = translatedLineStartY - m * translatedLineStartX // Just a point on the line
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
     * @param mult value between 0 and 255
     * @return multiplied color
     */
    private fun multiplyColorAlpha(color: Int, mult: Int): Int {
      if (mult == 255) {
        return color
      }
      if (mult == 0) {
        return color and 0x00FFFFFF
      }
      val resultAlpha = mult + (mult shr 7) // make it 0..256
      val colorAlpha = color ushr 24
      val multipliedAlpha = colorAlpha * resultAlpha shr 8
      return multipliedAlpha shl 24 or (color and 0x00FFFFFF)
    }
  }
}
