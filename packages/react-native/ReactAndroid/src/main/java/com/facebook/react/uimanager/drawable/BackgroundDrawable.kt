/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.ComposeShader
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.PorterDuff
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.drawable.Drawable
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.style.BackgroundImageLayer
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import kotlin.math.roundToInt

internal class BackgroundDrawable(
    private val context: Context,
    /*
     * We assume borderRadius & borderInsets to be shared across multiple drawables
     * therefore we should manually invalidate this drawable when changing either of them
     */
    var borderRadius: BorderRadiusStyle? = null,
    var borderInsets: BorderInsets? = null,
) : Drawable() {
  /**
   * There is a small gap between the edges of adjacent paths, such as between its Border and its
   * Outline. The smallest amount (found to be 0.8f) is used to shrink outline's path, overlapping
   * them and closing the visible gap.
   */
  private val gapBetweenPaths = 0.8f
  private var computedBorderInsets: RectF? = null
  private var computedBorderRadius: ComputedBorderRadius? = null
  private var needUpdatePath = true

  var backgroundColor: Int = Color.TRANSPARENT
    set(value) {
      if (field != value) {
        field = value
        backgroundPaint.color = value
        invalidateSelf()
      }
    }

  private var paddingBoxRect: RectF = RectF()
  private var paddingBoxRenderPath: Path? = null

  var backgroundImageLayers: List<BackgroundImageLayer>? = null
    set(value) {
      if (field != value) {
        field = value
        invalidateSelf()
      }
    }

  private val backgroundPaint: Paint =
      Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = backgroundColor
      }

  override fun invalidateSelf() {
    needUpdatePath = true
    super.invalidateSelf()
  }

  override fun onBoundsChange(bounds: Rect) {
    super.onBoundsChange(bounds)
    needUpdatePath = true
  }

  override fun setAlpha(alpha: Int) {
    backgroundPaint.alpha =
        (((alpha / 255f) * (Color.alpha(backgroundColor) / 255f)) * 255f).roundToInt()
    invalidateSelf()
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    // do nothing
  }

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int {
    val alpha = backgroundPaint.alpha
    return when (alpha) {
      255 -> PixelFormat.OPAQUE
      in 1..254 -> PixelFormat.TRANSLUCENT
      else -> PixelFormat.TRANSPARENT
    }
  }

  override fun draw(canvas: Canvas) {
    updatePath()
    canvas.save()

    var innerRadiusX = 0f
    var innerRadiusY = 0f
    // Draws the View without its border first (with background color fill)
    if (backgroundPaint.alpha != 0) {
      if (computedBorderRadius?.isUniform() == true && borderRadius?.hasRoundedBorders() == true) {
        innerRadiusX =
            getInnerBorderRadius(
                computedBorderRadius?.topLeft?.horizontal?.dpToPx(), computedBorderInsets?.left)
        innerRadiusY =
            getInnerBorderRadius(
                computedBorderRadius?.topLeft?.vertical?.dpToPx(), computedBorderInsets?.top)
        canvas.drawRoundRect(paddingBoxRect, innerRadiusX, innerRadiusY, backgroundPaint)
      } else if (borderRadius?.hasRoundedBorders() != true) {
        canvas.drawRect(bounds, backgroundPaint)
      } else {
        canvas.drawPath(checkNotNull(paddingBoxRenderPath), backgroundPaint)
      }
    }

    if (backgroundImageLayers != null && backgroundImageLayers?.isNotEmpty() == true) {
      backgroundPaint.setShader(getBackgroundImageShader())
      if (computedBorderRadius?.isUniform() == true && borderRadius?.hasRoundedBorders() == true) {
        canvas.drawRoundRect(paddingBoxRect, innerRadiusX, innerRadiusY, backgroundPaint)
      } else if (borderRadius?.hasRoundedBorders() != true) {
        canvas.drawRect(paddingBoxRect, backgroundPaint)
      } else {
        canvas.drawPath(checkNotNull(paddingBoxRenderPath), backgroundPaint)
      }
      backgroundPaint.setShader(null)
    }
    canvas.restore()
  }

  private fun computeBorderInsets(): RectF =
      borderInsets?.resolve(layoutDirection, context).let {
        RectF(
            it?.left?.dpToPx() ?: 0f,
            it?.top?.dpToPx() ?: 0f,
            it?.right?.dpToPx() ?: 0f,
            it?.bottom?.dpToPx() ?: 0f)
      }

  private fun getBackgroundImageShader(): Shader? {
    backgroundImageLayers?.let { layers ->
      var compositeShader: Shader? = null
      for (backgroundImageLayer in layers) {
        val currentShader = backgroundImageLayer.getShader(bounds) ?: continue

        compositeShader =
            if (compositeShader == null) {
              currentShader
            } else {
              ComposeShader(currentShader, compositeShader, PorterDuff.Mode.SRC_OVER)
            }
      }
      return compositeShader
    }
    return null
  }

  /**
   * Here, "inner" refers to the border radius on the inside of the border. So it ends up being the
   * "outer" border radius inset by the respective width.
   */
  private fun getInnerBorderRadius(computedRadius: Float?, borderWidth: Float?): Float {
    return ((computedRadius ?: 0f) - (borderWidth ?: 0f)).coerceAtLeast(0f)
  }

  private fun updatePath() {
    if (!needUpdatePath) {
      return
    }
    needUpdatePath = false

    computedBorderInsets = computeBorderInsets()
    computedBorderRadius =
        borderRadius?.resolve(
            layoutDirection, context, bounds.width().pxToDp(), bounds.height().pxToDp())

    if (computedBorderRadius?.hasRoundedBorders() == true &&
        computedBorderRadius?.isUniform() == false) {
      paddingBoxRenderPath = paddingBoxRenderPath ?: Path()
      paddingBoxRenderPath?.reset()
    }

    // only close gap between border and background if we draw the border, otherwise
    // we wind up pixelating small pixel-radius curves
    var pathAdjustment = 0f
    if (computedBorderInsets != null &&
        (computedBorderInsets?.left != 0f ||
            computedBorderInsets?.top != 0f ||
            computedBorderInsets?.right != 0f ||
            computedBorderInsets?.bottom != 0f)) {
      pathAdjustment = gapBetweenPaths
    }

    // There is a small gap between backgroundDrawable and
    // borderDrawable. pathAdjustment is used to slightly enlarge the rectangle
    // (paddingBoxRect), ensuring the border can be
    // drawn on top without the gap.
    paddingBoxRect.left = bounds.left + (computedBorderInsets?.left ?: 0f) - pathAdjustment
    paddingBoxRect.top = bounds.top + (computedBorderInsets?.top ?: 0f) - pathAdjustment
    paddingBoxRect.right = bounds.right - (computedBorderInsets?.right ?: 0f) + pathAdjustment
    paddingBoxRect.bottom = bounds.bottom - (computedBorderInsets?.bottom ?: 0f) + pathAdjustment

    if (borderRadius?.hasRoundedBorders() == true && computedBorderRadius?.isUniform() != true) {

      val innerTopLeftRadiusX =
          getInnerBorderRadius(
              computedBorderRadius?.topLeft?.horizontal?.dpToPx(), computedBorderInsets?.left)
      val innerTopLeftRadiusY =
          getInnerBorderRadius(
              computedBorderRadius?.topLeft?.vertical?.dpToPx(), computedBorderInsets?.top)
      val innerTopRightRadiusX =
          getInnerBorderRadius(
              computedBorderRadius?.topRight?.horizontal?.dpToPx(), computedBorderInsets?.right)
      val innerTopRightRadiusY =
          getInnerBorderRadius(
              computedBorderRadius?.topRight?.vertical?.dpToPx(), computedBorderInsets?.top)
      val innerBottomRightRadiusX =
          getInnerBorderRadius(
              computedBorderRadius?.bottomRight?.horizontal?.dpToPx(), computedBorderInsets?.right)
      val innerBottomRightRadiusY =
          getInnerBorderRadius(
              computedBorderRadius?.bottomRight?.vertical?.dpToPx(), computedBorderInsets?.bottom)
      val innerBottomLeftRadiusX =
          getInnerBorderRadius(
              computedBorderRadius?.bottomLeft?.horizontal?.dpToPx(), computedBorderInsets?.left)
      val innerBottomLeftRadiusY =
          getInnerBorderRadius(
              computedBorderRadius?.bottomLeft?.vertical?.dpToPx(), computedBorderInsets?.bottom)

      paddingBoxRenderPath?.addRoundRect(
          paddingBoxRect,
          floatArrayOf(
              innerTopLeftRadiusX,
              innerTopLeftRadiusY,
              innerTopRightRadiusX,
              innerTopRightRadiusY,
              innerBottomRightRadiusX,
              innerBottomRightRadiusY,
              innerBottomLeftRadiusX,
              innerBottomLeftRadiusY,
          ),
          Path.Direction.CW)
    }
  }
}
