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

private const val TAG = "InsetBoxShadowDrawable"

// "the resulting shadow must approximate {...} a Gaussian blur with a standard deviation equal
// to half the blur radius"
// https://www.w3.org/TR/css-backgrounds-3/#shadow-blur
private const val BLUR_RADIUS_SIGMA_SCALE = 0.5f

/** Draws an inner box-shadow https://www.w3.org/TR/css-backgrounds-3/#shadow-shape */
@RequiresApi(31)
internal class InsetBoxShadowDrawable(
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

  override fun setAlpha(alpha: Int) {
    renderNode.alpha = alpha / 255f
  }

  override fun setColorFilter(colorFilter: ColorFilter?): Unit = Unit

  override fun getOpacity(): Int = (renderNode.alpha * 255).roundToInt()

  override fun draw(canvas: Canvas) {
    if (!canvas.isHardwareAccelerated) {
      FLog.w(TAG, "InsetBoxShadowDrawable requires a hardware accelerated canvas")
      return
    }

    if (shadowShapeDrawable.bounds != bounds ||
        shadowShapeDrawable.layoutDirection != layoutDirection ||
        shadowShapeDrawable.borderRadius != background.borderRadius ||
        shadowShapeDrawable.colorFilter != colorFilter) {
      canvas.save()

      // We need the actual size the blur will increase the shadow by so we can
      // properly pad. This is not simply the input as Android has it's own
      // distinct blur algorithm
      val adjustedBlurRadius =
          FilterHelper.sigmaToRadius(blurRadius * BLUR_RADIUS_SIGMA_SCALE).roundToInt()
      // We pad by the blur radius so that the edges of the blur look good and
      // the blur artifacts can bleed into the view if needed
      val shadowShapeBounds =
          Rect(bounds).apply { inset(-2 * adjustedBlurRadius, -2 * adjustedBlurRadius) }
      shadowShapeDrawable.bounds = shadowShapeBounds
      shadowShapeDrawable.layoutDirection = layoutDirection
      shadowShapeDrawable.colorFilter = colorFilter

      // We create a new drawable that represents the clear region that we clip
      // out of the shadow. The shadow itself is just a colored rect before this
      with(renderNode) {
        setPosition(Rect(bounds).apply { inset(-2 * adjustedBlurRadius, -2 * adjustedBlurRadius) })
        val spreadExtent = PixelUtil.toPixelFromDIP(spread).roundToInt().coerceAtLeast(0)
        val clearRegionBounds = Rect(bounds).apply { inset(spreadExtent, spreadExtent) }
        val clearRegionBorderRadii =
            getShadowBorderRadii(
                -spreadExtent.toFloat(),
                background.borderRadius,
                bounds.width().toFloat(),
                bounds.height().toFloat())
        val clearRegionDrawable =
            CSSBackgroundDrawable(context).apply {
              borderRadius = clearRegionBorderRadii
              bounds =
                  Rect(clearRegionBounds).apply {
                    offset(
                        PixelUtil.toPixelFromDIP(offsetX).roundToInt() + adjustedBlurRadius,
                        PixelUtil.toPixelFromDIP(offsetY).roundToInt() + adjustedBlurRadius)
                  }
            }

        beginRecording().let { canvas ->
          val borderBoxPath = clearRegionDrawable.getBorderBoxPath()
          if (borderBoxPath != null) {
            canvas.clipOutPath(borderBoxPath)
          } else {
            canvas.clipOutRect(clearRegionDrawable.borderBoxRect)
          }

          shadowShapeDrawable.draw(canvas)
          endRecording()
        }
      }

      // We actually draw the render node into our canvas and clip out the
      // padding
      with(canvas) {
        val borderBoxPath = background.getBorderBoxPath()
        if (borderBoxPath != null) {
          canvas.clipPath(borderBoxPath)
        } else {
          canvas.clipRect(bounds)
        }
        // This positions the render node properly since we padded it
        canvas.translate(adjustedBlurRadius.toFloat(), adjustedBlurRadius.toFloat())
        drawRenderNode(renderNode)
      }

      canvas.restore()
    }
  }
}
