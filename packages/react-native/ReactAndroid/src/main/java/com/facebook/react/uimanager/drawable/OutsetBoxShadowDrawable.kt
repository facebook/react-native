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
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.RenderNode
import android.graphics.drawable.Drawable
import androidx.annotation.RequiresApi
import com.facebook.common.logging.FLog
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.FilterHelper
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import kotlin.math.roundToInt

private const val TAG = "OutsetBoxShadowDrawable"

// "the resulting shadow must approximate {...} a Gaussian blur with a standard deviation equal
// to half the blur radius"
// https://www.w3.org/TR/css-backgrounds-3/#shadow-blur
private const val BLUR_RADIUS_SIGMA_SCALE = 0.5f

/** Draws an outer box-shadow https://www.w3.org/TR/css-backgrounds-3/#shadow-shape */
@RequiresApi(31)
@OptIn(UnstableReactNativeAPI::class)
internal class OutsetBoxShadowDrawable(
    private val context: Context,
    private val background: CSSBackgroundDrawable,
    shadowColor: Int,
    private val offsetX: Float,
    private val offsetY: Float,
    private val blurRadius: Float,
    private val spread: Float,
) : Drawable() {
  private val shadowShapeDrawable = CSSBackgroundDrawable(context).apply { color = shadowColor }

  private val renderNode =
      RenderNode(TAG).apply {
        clipToBounds = false
        setRenderEffect(FilterHelper.createBlurEffect(blurRadius * BLUR_RADIUS_SIGMA_SCALE))
      }

  private val shadowClipOutPath: Path = Path()

  override fun setAlpha(alpha: Int) {
    renderNode.alpha = alpha / 255f
  }

  override fun setColorFilter(colorFilter: ColorFilter?): Unit = Unit

  override fun getOpacity(): Int = (renderNode.alpha * 255).roundToInt()

  override fun draw(canvas: Canvas) {
    if (!canvas.isHardwareAccelerated) {
      FLog.w(TAG, "OutsetBoxShadowDrawable requires a hardware accelerated canvas")
      return
    }

    val spreadExtent = PixelUtil.toPixelFromDIP(spread).roundToInt().coerceAtLeast(0)
    val shadowShapeFrame = Rect(bounds).apply { inset(-spreadExtent, -spreadExtent) }
    val shadowShapeBounds = Rect(0, 0, shadowShapeFrame.width(), shadowShapeFrame.height())

    val resolutionWidth = bounds.width().toFloat()
    val resolutionHeight = bounds.height().toFloat()
    val computedBorderRadii =
        background.borderRadius.resolve(layoutDirection, context, resolutionWidth, resolutionHeight)
    val shadowBorderRadii =
        ComputedBorderRadius(
            topLeft = adjustRadiusForSpread(computedBorderRadii.topLeft, spreadExtent.toFloat()),
            topRight = adjustRadiusForSpread(computedBorderRadii.topRight, spreadExtent.toFloat()),
            bottomRight =
                adjustRadiusForSpread(computedBorderRadii.bottomRight, spreadExtent.toFloat()),
            bottomLeft =
                adjustRadiusForSpread(computedBorderRadii.bottomLeft, spreadExtent.toFloat()),
        )

    if (shadowShapeDrawable.bounds != shadowShapeBounds ||
        shadowShapeDrawable.layoutDirection != layoutDirection ||
        shadowShapeDrawable.computedBorderRadius != shadowBorderRadii ||
        shadowShapeDrawable.colorFilter != colorFilter) {
      shadowShapeDrawable.bounds = shadowShapeBounds
      shadowShapeDrawable.layoutDirection = layoutDirection
      shadowShapeDrawable.borderRadius =
          BorderRadiusStyle(
              topLeft = LengthPercentage(shadowBorderRadii.topLeft, LengthPercentageType.POINT),
              topRight = LengthPercentage(shadowBorderRadii.topRight, LengthPercentageType.POINT),
              bottomLeft =
                  LengthPercentage(shadowBorderRadii.bottomLeft, LengthPercentageType.POINT),
              bottomRight =
                  LengthPercentage(shadowBorderRadii.bottomRight, LengthPercentageType.POINT))
      shadowShapeDrawable.colorFilter = colorFilter

      // We remove the portion of the shadow which overlaps the background border box, to avoid
      // showing the shadow shape e.g. behind a transparent background. There may be a subpixel gap
      // between the border box path, and the edge of border rendering, so we slightly inflate the
      // shadow to cover it, placing it below the borders.
      shadowClipOutPath.rewind()
      if (background.hasRoundedBorders()) {
        val subpixelInsetBounds = RectF(bounds).apply { inset(0.4f, 0.4f) }
        shadowClipOutPath.addRoundRect(
            subpixelInsetBounds,
            floatArrayOf(
                computedBorderRadii.topLeft,
                computedBorderRadii.topLeft,
                computedBorderRadii.topRight,
                computedBorderRadii.topRight,
                computedBorderRadii.bottomRight,
                computedBorderRadii.bottomRight,
                computedBorderRadii.bottomLeft,
                computedBorderRadii.bottomLeft),
            Path.Direction.CW)
      }

      with(renderNode) {
        setPosition(
            Rect(shadowShapeFrame).apply {
              offset(
                  PixelUtil.toPixelFromDIP(offsetX).roundToInt(),
                  PixelUtil.toPixelFromDIP(offsetY).roundToInt())
            })

        beginRecording().let { renderNodeCanvas ->
          shadowShapeDrawable.draw(renderNodeCanvas)
          endRecording()
        }
      }
    }

    with(canvas) {
      save()

      if (background.hasRoundedBorders()) {
        clipOutPath(shadowClipOutPath)
      } else {
        clipOutRect(bounds)
      }

      drawRenderNode(renderNode)
      restore()
    }
  }
}
