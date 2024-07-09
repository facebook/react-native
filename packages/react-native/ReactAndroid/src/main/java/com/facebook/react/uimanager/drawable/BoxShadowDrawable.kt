/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Rect
import android.graphics.RenderNode
import android.graphics.drawable.Drawable
import androidx.annotation.RequiresApi
import com.facebook.common.logging.FLog
import com.facebook.react.uimanager.FilterHelper
import com.facebook.react.uimanager.PixelUtil
import kotlin.math.roundToInt

private const val TAG = "BoxShadowDrawable"

// "the resulting shadow must approximate {...} a Gaussian blur with a standard deviation equal
// to half the blur radius"
// https://www.w3.org/TR/css-backgrounds-3/#shadow-blur
private const val BLUR_RADIUS_SIGMA_SCALE = 0.5f

/** Draws an outer-box shadow https://www.w3.org/TR/css-backgrounds-3/#shadow-shape */
@RequiresApi(31)
internal class BoxShadowDrawable(
    context: Context,
    private val background: CSSBackgroundDrawable,
    shadowColor: Int,
    private val offsetX: Float,
    private val offsetY: Float,
    blurRadius: Float,
    private val spread: Float,
) : Drawable() {

  private val shadowShapeDrawable = CSSBackgroundDrawable(context).apply { color = shadowColor }

  private val renderNode =
      RenderNode("BoxShadowDrawable").apply {
        clipToBounds = false
        setRenderEffect(FilterHelper.createBlurEffect(blurRadius * BLUR_RADIUS_SIGMA_SCALE))
      }

  override fun draw(canvas: Canvas) {
    if (!canvas.isHardwareAccelerated) {
      FLog.w(TAG, "BoxShadowDrawable requires a hardware accelerated canvas")
      return
    }

    val spreadExtent = PixelUtil.toPixelFromDIP(spread).roundToInt().coerceAtLeast(0)
    val shadowShapeFrame = Rect(bounds).apply { inset(-spreadExtent, -spreadExtent) }
    val shadowShapeBounds = Rect(0, 0, shadowShapeFrame.width(), shadowShapeFrame.height())

    if (shadowShapeDrawable.bounds != shadowShapeBounds ||
        shadowShapeDrawable.layoutDirection != layoutDirection ||
        shadowShapeDrawable.borderRadius != background.borderRadius ||
        shadowShapeDrawable.colorFilter != colorFilter) {
      shadowShapeDrawable.bounds = shadowShapeBounds
      shadowShapeDrawable.layoutDirection = layoutDirection
      shadowShapeDrawable.borderRadius = background.borderRadius
      shadowShapeDrawable.colorFilter = colorFilter

      with(renderNode) {
        setPosition(
            Rect(shadowShapeFrame).apply {
              offset(
                  PixelUtil.toPixelFromDIP(offsetX).roundToInt(),
                  PixelUtil.toPixelFromDIP(offsetY).roundToInt())
            })

        beginRecording().let { canvas ->
          shadowShapeDrawable.draw(canvas)
          endRecording()
        }
      }
    }

    with(canvas) {
      val borderBoxPath = background.getBorderBoxPath()
      if (borderBoxPath != null) {
        clipOutPath(borderBoxPath)
      } else {
        clipOutRect(background.getBorderBoxRect())
      }

      drawRenderNode(renderNode)
    }
  }

  override fun setAlpha(alpha: Int) {
    renderNode.alpha = alpha / 255f
  }

  override fun setColorFilter(colorFilter: ColorFilter?): Unit = Unit

  override fun getOpacity(): Int = (renderNode.alpha * 255).roundToInt()
}
