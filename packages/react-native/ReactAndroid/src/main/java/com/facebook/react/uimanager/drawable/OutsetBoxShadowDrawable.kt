/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.drawable.Drawable
import androidx.annotation.RequiresApi
import com.facebook.react.uimanager.FilterHelper
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import com.facebook.react.uimanager.style.CornerRadii
import kotlin.math.roundToInt

internal const val MIN_OUTSET_BOX_SHADOW_SDK_VERSION = 28

// "the resulting shadow must approximate {...} a Gaussian blur with a standard deviation equal
// to half the blur radius"
// https://www.w3.org/TR/css-backgrounds-3/#shadow-blur
private const val BLUR_RADIUS_SIGMA_SCALE = 0.5f

/** Draws an outer box-shadow https://www.w3.org/TR/css-backgrounds-3/#shadow-shape */
@RequiresApi(MIN_OUTSET_BOX_SHADOW_SDK_VERSION)
internal class OutsetBoxShadowDrawable(
    private val context: Context,
    borderRadius: BorderRadiusStyle? = null,
    private val shadowColor: Int,
    private val offsetX: Float,
    private val offsetY: Float,
    private val blurRadius: Float,
    private val spread: Float,
) : Drawable() {
  public var borderRadius = borderRadius
    set(value) {
      if (value != field) {
        field = value
        invalidateSelf()
      }
    }

  private val shadowPaint =
      Paint().apply {
        color = shadowColor
        if (blurRadius > 0) {
          maskFilter =
              BlurMaskFilter(
                  FilterHelper.sigmaToRadius(blurRadius * BLUR_RADIUS_SIGMA_SCALE),
                  BlurMaskFilter.Blur.NORMAL)
        }
      }

  override fun setAlpha(alpha: Int) {
    shadowPaint.alpha = (((alpha / 255f) * (Color.alpha(shadowColor) / 255f)) * 255f).roundToInt()
    invalidateSelf()
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    shadowPaint.colorFilter = colorFilter
    invalidateSelf()
  }

  override fun getOpacity(): Int =
      ((shadowPaint.alpha / 255f) / (Color.alpha(shadowColor) / 255f) * 255f).roundToInt()

  override fun draw(canvas: Canvas) {
    val resolutionWidth = PixelUtil.toDIPFromPixel(bounds.width().toFloat())
    val resolutionHeight = PixelUtil.toDIPFromPixel(bounds.height().toFloat())
    val computedBorderRadii =
        borderRadius?.resolve(layoutDirection, context, resolutionWidth, resolutionHeight)?.let {
          ComputedBorderRadius(
              topLeft =
                  CornerRadii(
                      PixelUtil.toPixelFromDIP(it.topLeft.horizontal),
                      PixelUtil.toPixelFromDIP(it.topLeft.vertical)),
              topRight =
                  CornerRadii(
                      PixelUtil.toPixelFromDIP(it.topRight.horizontal),
                      PixelUtil.toPixelFromDIP(it.topRight.vertical)),
              bottomLeft =
                  CornerRadii(
                      PixelUtil.toPixelFromDIP(it.bottomLeft.horizontal),
                      PixelUtil.toPixelFromDIP(it.bottomLeft.vertical)),
              bottomRight =
                  CornerRadii(
                      PixelUtil.toPixelFromDIP(it.bottomRight.horizontal),
                      PixelUtil.toPixelFromDIP(it.bottomRight.vertical)),
          )
        }

    val spreadExtent = PixelUtil.toPixelFromDIP(spread)
    val shadowRect =
        RectF(bounds).apply {
          inset(-spreadExtent, -spreadExtent)
          offset(PixelUtil.toPixelFromDIP(offsetX), PixelUtil.toPixelFromDIP(offsetY))
        }

    canvas.save().let { saveCount ->
      if (computedBorderRadii?.hasRoundedBorders() == true) {
        drawShadowRoundRect(canvas, shadowRect, spreadExtent, computedBorderRadii)
      } else {
        drawShadowRect(canvas, shadowRect)
      }
      canvas.restoreToCount(saveCount)
    }
  }

  private fun drawShadowRoundRect(
      canvas: Canvas,
      shadowRect: RectF,
      spreadExtent: Float,
      computedBorderRadii: ComputedBorderRadius
  ) {
    // We inset the clip slightly, to avoid Skia artifacts with antialiased
    // clipping. This inset is only visible when no background is present.
    // https://neugierig.org/software/chromium/notes/2010/07/clipping.html
    val subpixelInsetBounds = RectF(bounds).apply { inset(0.4f, 0.4f) }
    canvas.clipOutPath(
        Path().apply {
          addRoundRect(
              subpixelInsetBounds,
              floatArrayOf(
                  computedBorderRadii.topLeft.horizontal,
                  computedBorderRadii.topLeft.vertical,
                  computedBorderRadii.topRight.horizontal,
                  computedBorderRadii.topRight.vertical,
                  computedBorderRadii.bottomRight.horizontal,
                  computedBorderRadii.bottomRight.vertical,
                  computedBorderRadii.bottomLeft.horizontal,
                  computedBorderRadii.bottomLeft.vertical),
              Path.Direction.CW)
        })

    canvas.drawPath(
        Path().apply {
          addRoundRect(
              shadowRect,
              floatArrayOf(
                  adjustRadiusForSpread(computedBorderRadii.topLeft.horizontal, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.topLeft.vertical, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.topRight.horizontal, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.topRight.vertical, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.bottomRight.horizontal, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.bottomRight.vertical, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.bottomLeft.horizontal, spreadExtent),
                  adjustRadiusForSpread(computedBorderRadii.bottomLeft.vertical, spreadExtent)),
              Path.Direction.CW)
        },
        shadowPaint)
  }

  private fun drawShadowRect(canvas: Canvas, shadowRect: RectF) {
    canvas.clipOutRect(bounds)
    canvas.drawRect(shadowRect, shadowPaint)
  }
}
