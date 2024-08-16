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
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.RenderNode
import android.graphics.drawable.Drawable
import androidx.annotation.RequiresApi
import com.facebook.common.logging.FLog
import com.facebook.react.uimanager.FilterHelper
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import com.facebook.react.uimanager.style.CornerRadii
import kotlin.math.roundToInt

private const val TAG = "OutsetBoxShadowDrawable"

// "the resulting shadow must approximate {...} a Gaussian blur with a standard deviation equal
// to half the blur radius"
// https://www.w3.org/TR/css-backgrounds-3/#shadow-blur
private const val BLUR_RADIUS_SIGMA_SCALE = 0.5f

/** Draws an outer box-shadow https://www.w3.org/TR/css-backgrounds-3/#shadow-shape */
@RequiresApi(29)
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

  private val renderNode = RenderNode(TAG).apply { clipToBounds = true }

  private val shadowClipOutPath: Path = Path()
  private val shadowOuterPath: Path = Path()
  private val shadowPaint =
      Paint().apply {
        color = shadowColor

        // Mask filters are not documented to be supported under hardware accelerated canvases, but
        // they seem to work, mapped to SkMaskFilter, as of API 29.
        if (blurRadius > 0) {
          maskFilter =
              BlurMaskFilter(
                  FilterHelper.sigmaToRadius(blurRadius * BLUR_RADIUS_SIGMA_SCALE),
                  BlurMaskFilter.Blur.NORMAL)
        }
      }

  private var lastBounds: Rect? = null
  private var lastBorderRadius: ComputedBorderRadius? = null

  override fun setAlpha(alpha: Int) {
    renderNode.alpha = alpha / 255f
  }

  override fun setColorFilter(colorFilter: ColorFilter?) = Unit

  override fun getOpacity(): Int = (renderNode.alpha * 255).roundToInt()

  override fun draw(canvas: Canvas) {
    if (!canvas.isHardwareAccelerated) {
      FLog.w(TAG, "OutsetBoxShadowDrawable requires a hardware accelerated canvas")
      return
    }

    val spreadExtent = PixelUtil.toPixelFromDIP(spread).roundToInt().coerceAtLeast(0)
    val shadowOutset = FilterHelper.sigmaToRadius(blurRadius)
    val shadowShapeFrame = Rect(bounds).apply { inset(-spreadExtent, -spreadExtent) }
    val shadowShapeBounds = Rect(0, 0, shadowShapeFrame.width(), shadowShapeFrame.height())

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
                      PixelUtil.toPixelFromDIP(it.bottomRight.vertical)),
              bottomRight =
                  CornerRadii(
                      PixelUtil.toPixelFromDIP(it.bottomRight.horizontal),
                      PixelUtil.toPixelFromDIP(it.bottomRight.vertical)),
          )
        }

    val shadowBorderRadii =
        computedBorderRadii?.let { radii ->
          ComputedBorderRadius(
              topLeft =
                  CornerRadii(
                      adjustRadiusForSpread(radii.topLeft.horizontal, spreadExtent.toFloat()),
                      adjustRadiusForSpread(radii.topLeft.vertical, spreadExtent.toFloat())),
              topRight =
                  CornerRadii(
                      adjustRadiusForSpread(radii.topRight.horizontal, spreadExtent.toFloat()),
                      adjustRadiusForSpread(radii.topRight.vertical, spreadExtent.toFloat())),
              bottomRight =
                  CornerRadii(
                      adjustRadiusForSpread(radii.bottomRight.horizontal, spreadExtent.toFloat()),
                      adjustRadiusForSpread(radii.bottomRight.vertical, spreadExtent.toFloat())),
              bottomLeft =
                  CornerRadii(
                      adjustRadiusForSpread(radii.bottomLeft.horizontal, spreadExtent.toFloat()),
                      adjustRadiusForSpread(radii.bottomLeft.vertical, spreadExtent.toFloat())),
          )
        }

    if (!renderNode.hasDisplayList() ||
        lastBounds != shadowShapeBounds ||
        lastBorderRadius != shadowBorderRadii) {
      lastBounds = shadowShapeBounds
      lastBorderRadius = shadowBorderRadii
      // We remove the portion of the shadow which overlaps the background border box, to avoid
      // showing the shadow shape e.g. behind a transparent background. There may be a subpixel gap
      // between the border box path, and the edge of border rendering, so we slightly inflate the
      // shadow to cover it, placing it below the borders.
      if (computedBorderRadii != null &&
          shadowBorderRadii != null &&
          computedBorderRadii.hasRoundedBorders()) {
        shadowClipOutPath.rewind()
        val subpixelInsetBounds = RectF(bounds).apply { inset(0.4f, 0.4f) }
        shadowClipOutPath.addRoundRect(
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

        shadowOuterPath.rewind()
        shadowOuterPath.addRoundRect(
            RectF(shadowShapeBounds),
            floatArrayOf(
                shadowBorderRadii.topLeft.horizontal,
                shadowBorderRadii.topLeft.vertical,
                shadowBorderRadii.topRight.horizontal,
                shadowBorderRadii.topRight.vertical,
                shadowBorderRadii.bottomRight.horizontal,
                shadowBorderRadii.bottomRight.vertical,
                shadowBorderRadii.bottomLeft.horizontal,
                shadowBorderRadii.bottomLeft.vertical),
            Path.Direction.CW)
      }

      with(renderNode) {
        setPosition(
            Rect(shadowShapeFrame).apply {
              offset(
                  PixelUtil.toPixelFromDIP(offsetX).roundToInt(),
                  PixelUtil.toPixelFromDIP(offsetY).roundToInt())
              inset(-shadowOutset.roundToInt(), -shadowOutset.roundToInt())
            })

        beginRecording().let { renderNodeCanvas ->
          renderNodeCanvas.translate(shadowOutset, shadowOutset)
          if (shadowBorderRadii?.hasRoundedBorders() == true) {
            renderNodeCanvas.drawPath(shadowOuterPath, shadowPaint)
          } else {
            renderNodeCanvas.drawRect(shadowShapeBounds, shadowPaint)
          }
          endRecording()
        }
      }
    }

    with(canvas) {
      save()

      if (computedBorderRadii?.hasRoundedBorders() == true) {
        clipOutPath(shadowClipOutPath)
      } else {
        clipOutRect(bounds)
      }

      drawRenderNode(renderNode)
      restore()
    }
  }
}
