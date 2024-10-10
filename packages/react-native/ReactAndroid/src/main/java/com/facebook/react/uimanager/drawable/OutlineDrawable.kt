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
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PathEffect
import android.graphics.RectF
import android.graphics.drawable.Drawable
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import com.facebook.react.uimanager.style.CornerRadii
import com.facebook.react.uimanager.style.OutlineStyle
import kotlin.math.roundToInt
import kotlin.properties.ObservableProperty
import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

/** Draws outline https://drafts.csswg.org/css-ui/#outline */
internal class OutlineDrawable(
    private val context: Context,
    borderRadius: BorderRadiusStyle? = null,
    outlineColor: Int,
    outlineOffset: Float,
    outlineStyle: OutlineStyle,
    outlineWidth: Float,
) : Drawable() {
  /**
   * There is a small gap between the edges of adjacent paths, such as between its Border and its
   * Outline. The smallest amount (found to be 0.8f) is used to shrink outline's path, overlapping
   * them and closing the visible gap.
   */
  private val gapBetweenPaths = 0.8f

  private fun <T> invalidatingChange(initialValue: T): ReadWriteProperty<Any?, T> =
      object : ObservableProperty<T>(initialValue) {
        override fun afterChange(property: KProperty<*>, oldValue: T, newValue: T) {
          if (oldValue != newValue) {
            invalidateSelf()
          }
        }
      }

  public var borderRadius: BorderRadiusStyle? by invalidatingChange(borderRadius)
  public var outlineOffset: Float by invalidatingChange(outlineOffset)
  public var outlineStyle: OutlineStyle = outlineStyle
    set(value) {
      if (value != field) {
        field = value
        outlinePaint.pathEffect = getPathEffect(value, outlineWidth)
        invalidateSelf()
      }
    }

  public var outlineColor: Int = outlineColor
    set(value) {
      if (value != field) {
        field = value
        outlinePaint.color = value
        invalidateSelf()
      }
    }

  public var outlineWidth: Float = outlineWidth
    set(value) {
      if (value != field) {
        field = value
        outlinePaint.strokeWidth = value
        outlinePaint.pathEffect = getPathEffect(outlineStyle, value)
        invalidateSelf()
      }
    }

  private val outlinePaint: Paint =
      Paint().apply {
        style = Paint.Style.STROKE
        color = outlineColor
        strokeWidth = outlineWidth
        pathEffect = getPathEffect(outlineStyle, outlineWidth)
      }

  private var computedBorderRadius: ComputedBorderRadius? = null
  private var tempRectForOutline = RectF()

  private val pathForOutline = Path()

  override fun setAlpha(alpha: Int) {
    outlinePaint.alpha = (((alpha / 255f) * (Color.alpha(outlineColor) / 255f)) * 255f).roundToInt()
    invalidateSelf()
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    outlinePaint.colorFilter = colorFilter
    invalidateSelf()
  }

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int =
      ((outlinePaint.alpha / 255f) / (Color.alpha(outlineColor) / 255f) * 255f).roundToInt()

  override fun draw(canvas: Canvas) {
    if (outlineWidth == 0f) {
      return
    }

    pathForOutline.reset()

    computedBorderRadius =
        borderRadius?.resolve(
            layoutDirection,
            context,
            bounds.width().toFloat().dpToPx(),
            bounds.height().toFloat().dpToPx())

    updateOutlineRect()
    if (computedBorderRadius != null && computedBorderRadius?.hasRoundedBorders() == true) {
      drawRoundedOutline(canvas)
    } else {
      drawRectangularOutline(canvas)
    }
  }

  private fun updateOutlineRect() {
    tempRectForOutline.set(bounds)

    tempRectForOutline.top -= outlineWidth * 0.5f + outlineOffset - gapBetweenPaths
    tempRectForOutline.bottom += outlineWidth * 0.5f + outlineOffset - gapBetweenPaths
    tempRectForOutline.left -= outlineWidth * 0.5f + outlineOffset - gapBetweenPaths
    tempRectForOutline.right += outlineWidth * 0.5f + outlineOffset - gapBetweenPaths
  }

  private fun getPathEffect(style: OutlineStyle, outlineWidth: Float): PathEffect? {
    return when (style) {
      OutlineStyle.SOLID -> null
      OutlineStyle.DASHED ->
          DashPathEffect(
              floatArrayOf(outlineWidth * 3, outlineWidth * 3, outlineWidth * 3, outlineWidth * 3),
              0f)
      OutlineStyle.DOTTED ->
          DashPathEffect(floatArrayOf(outlineWidth, outlineWidth, outlineWidth, outlineWidth), 0f)
    }
  }

  private fun calculateRadius(radius: Float, outlineWidth: Float) =
      if (radius != 0f) radius + outlineWidth * 0.5f else 0f

  private fun drawRectangularOutline(canvas: Canvas) {
    pathForOutline.addRect(tempRectForOutline, Path.Direction.CW)

    canvas.drawPath(pathForOutline, outlinePaint)
  }

  private fun drawRoundedOutline(canvas: Canvas) {
    val topLeftRadius = computedBorderRadius?.topLeft?.toPixelFromDIP() ?: CornerRadii(0f, 0f)
    val topRightRadius = computedBorderRadius?.topRight?.toPixelFromDIP() ?: CornerRadii(0f, 0f)
    val bottomLeftRadius = computedBorderRadius?.bottomLeft?.toPixelFromDIP() ?: CornerRadii(0f, 0f)
    val bottomRightRadius =
        computedBorderRadius?.bottomRight?.toPixelFromDIP() ?: CornerRadii(0f, 0f)

    pathForOutline.addRoundRect(
        tempRectForOutline,
        floatArrayOf(
            calculateRadius(topLeftRadius.horizontal, outlineWidth),
            calculateRadius(topLeftRadius.vertical, outlineWidth),
            calculateRadius(topRightRadius.horizontal, outlineWidth),
            calculateRadius(topRightRadius.vertical, outlineWidth),
            calculateRadius(bottomRightRadius.horizontal, outlineWidth),
            calculateRadius(bottomRightRadius.vertical, outlineWidth),
            calculateRadius(bottomLeftRadius.horizontal, outlineWidth),
            calculateRadius(bottomLeftRadius.vertical, outlineWidth),
        ),
        Path.Direction.CW)

    canvas.drawPath(pathForOutline, outlinePaint)
  }
}
