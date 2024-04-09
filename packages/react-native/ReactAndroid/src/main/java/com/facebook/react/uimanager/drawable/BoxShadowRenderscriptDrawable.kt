/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Suppress RenderScript deprecation warnings since we only use where replacement API not yet
// available
@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.renderscript.Allocation
import android.renderscript.Element
import android.renderscript.RenderScript
import android.renderscript.ScriptIntrinsicBlur
import androidx.annotation.DeprecatedSinceApi
import androidx.annotation.RequiresApi
import com.facebook.react.uimanager.PixelUtil
import kotlin.math.ceil
import kotlin.math.roundToInt

// "the resulting shadow must approximate {...} a Gaussian blur with a standard deviation equal
// to half the blur radius"
// https://www.w3.org/TR/css-backgrounds-3/#shadow-blur
private const val BLUR_RADIUS_SIGMA_SCALE = 0.5f

// Max supported blur radius of ScriptInstrinsicBlur
private const val MAX_RADIUS = 25f

/**
 * Draws an outer-box shadow using RenderScript for older Android versions
 * https://www.w3.org/TR/css-backgrounds-3/#shadow-shape
 */
@RequiresApi(26)
@DeprecatedSinceApi(31)
public class BoxShadowRenderscriptDrawable(
    context: Context,
    private val background: CSSBackgroundDrawable,
    private val shadowColor: Int,
    private val offsetX: Float,
    private val offsetY: Float,
    private val blur: Float,
    private val spread: Float,
) : Drawable() {
  private val renderScript = RenderScript.create(context)
  private val blurScript =
      ScriptIntrinsicBlur.create(renderScript, Element.U8_4(renderScript)).apply {
        setRadius(
            (radiusFromSigma(PixelUtil.toPixelFromDIP(blur) * BLUR_RADIUS_SIGMA_SCALE))
                .coerceAtMost(MAX_RADIUS))
      }

  private val shadowShapeDrawable = CSSBackgroundDrawable(context).apply { color = shadowColor }

  private var inputBitmap: Bitmap? = null
  private var outputBitmap: Bitmap? = null

  override fun draw(canvas: Canvas) {
    val spreadExtent = PixelUtil.toPixelFromDIP(spread).roundToInt().coerceAtLeast(0)
    val shadowShapeFrame = Rect(bounds).apply { inset(-spreadExtent, -spreadExtent) }
    val blurExtent = ceil(PixelUtil.toPixelFromDIP(blur)).coerceAtMost(MAX_RADIUS).roundToInt() * 2

    val blurBounds =
        Rect(
            0,
            0,
            shadowShapeFrame.width() + blurExtent * 2,
            shadowShapeFrame.height() + blurExtent * 2)

    val shadowShapeBounds = Rect(blurBounds).apply { inset(blurExtent, blurExtent) }

    val input =
        inputBitmap
            ?: Bitmap.createBitmap(blurBounds.width(), blurBounds.height(), Bitmap.Config.ARGB_8888)
    inputBitmap = input
    if (input.height != blurBounds.height() || input.width != blurBounds.width()) {
      input.reconfigure(blurBounds.width(), blurBounds.height(), input.config)
    }

    if (shadowShapeDrawable.bounds != shadowShapeBounds ||
        shadowShapeDrawable.layoutDirection != layoutDirection ||
        shadowShapeDrawable.borderRadius != background.borderRadius ||
        shadowShapeDrawable.colorFilter != colorFilter) {
      shadowShapeDrawable.bounds = shadowShapeBounds
      shadowShapeDrawable.layoutDirection = layoutDirection
      shadowShapeDrawable.borderRadius = background.borderRadius
      shadowShapeDrawable.colorFilter = colorFilter

      val output =
          outputBitmap
              ?: Bitmap.createBitmap(
                  blurBounds.width(), blurBounds.height(), Bitmap.Config.ARGB_8888)
      outputBitmap = output
      if (output.height != blurBounds.height() || output.width != blurBounds.width()) {
        output.reconfigure(blurBounds.width(), blurBounds.height(), output.config)
      }

      shadowShapeDrawable.draw(Canvas(input))

      val inputAllocation = Allocation.createFromBitmap(renderScript, input)
      val outputAllocation = Allocation.createFromBitmap(renderScript, output)

      blurScript.setInput(inputAllocation)
      blurScript.forEach(outputAllocation)
      outputAllocation.copyTo(output)
    }

    with(canvas) {
      clipOutPath(background.borderBoxPath())
      drawBitmap(
          checkNotNull(outputBitmap),
          blurBounds,
          Rect(blurBounds).apply {
            offset(
                PixelUtil.toPixelFromDIP(offsetX).roundToInt() - blurExtent - spreadExtent,
                PixelUtil.toPixelFromDIP(offsetY).roundToInt() - blurExtent - spreadExtent)
          },
          Paint())
    }
  }

  private fun radiusFromSigma(sigma: Float): Float {
    // RenderScript converts radius to (0.4 * sigma) + 0.6
    // https://cs.android.com/android/platform/superproject/main/+/main:frameworks/rs/toolkit/Blur.cpp;l=105;bpv=0;bpt=0
    return ((sigma - 0.6f) / 0.4f).coerceAtLeast(0f)
  }

  override fun setAlpha(alpha: Int) {
    shadowShapeDrawable.alpha = alpha
  }

  override fun setColorFilter(colorFilter: ColorFilter?): Unit = Unit

  override fun getOpacity(): Int = shadowShapeDrawable.opacity
}
