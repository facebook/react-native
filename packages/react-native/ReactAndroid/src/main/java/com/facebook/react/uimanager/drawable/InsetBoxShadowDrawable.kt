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
import android.graphics.Paint
import android.graphics.Rect
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
import kotlin.math.roundToInt

private const val TAG = "InsetBoxShadowDrawable"

// "the resulting shadow must approximate {...} a Gaussian blur with a standard deviation equal
// to half the blur radius"
// https://www.w3.org/TR/css-backgrounds-3/#shadow-blur
private const val BLUR_RADIUS_SIGMA_SCALE = 0.5f

/** Draws an inner box-shadow https://www.w3.org/TR/css-backgrounds-3/#shadow-shape */
@RequiresApi(31)
@OptIn(UnstableReactNativeAPI::class)
internal class InsetBoxShadowDrawable(
    private val context: Context,
    private val background: CSSBackgroundDrawable,
    private val shadowColor: Int,
    private val offsetX: Float,
    private val offsetY: Float,
    private val blurRadius: Float,
    private val spread: Float,
) : Drawable() {
  private val renderNode =
      RenderNode(TAG).apply {
        clipToBounds = false
        setRenderEffect(FilterHelper.createBlurEffect(blurRadius * BLUR_RADIUS_SIGMA_SCALE))
      }

  private val clearRegionDrawable = CSSBackgroundDrawable(context)

  private val shadowPaint = Paint().apply { color = shadowColor }

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
    // We need the actual size the blur will increase the shadow by so we can
    // properly pad. This is not simply the input as Android has it's own
    // distinct blur algorithm
    val adjustedBlurRadius =
        FilterHelper.sigmaToRadius(blurRadius * BLUR_RADIUS_SIGMA_SCALE).roundToInt()
    val padding = 2 * adjustedBlurRadius

    val spreadExtent = PixelUtil.toPixelFromDIP(spread).roundToInt().coerceAtLeast(0)
    val clearRegionBounds = Rect()
    background.getPaddingBoxRect().round(clearRegionBounds)
    clearRegionBounds.inset(spreadExtent, spreadExtent)
    clearRegionBounds.offset(
        PixelUtil.toPixelFromDIP(offsetX).roundToInt() + padding / 2,
        PixelUtil.toPixelFromDIP(offsetY).roundToInt() + padding / 2,
    )
    val clearRegionBorderRadii = getClearRegionBorderRadii(spreadExtent, background)

    if (shadowPaint.colorFilter != colorFilter ||
        clearRegionDrawable.layoutDirection != layoutDirection ||
        clearRegionDrawable.borderRadius != clearRegionBorderRadii ||
        clearRegionDrawable.bounds != clearRegionBounds) {

      shadowPaint.colorFilter = colorFilter
      clearRegionDrawable.bounds = clearRegionBounds
      clearRegionDrawable.layoutDirection = layoutDirection
      clearRegionDrawable.borderRadius = clearRegionBorderRadii

      with(renderNode) {
        // We pad by the blur radius so that the edges of the blur look good and
        // the blur artifacts can bleed into the view if needed
        setPosition(Rect(bounds).apply { inset(-padding, -padding) })
        beginRecording().let { renderNodeCanvas ->
          val borderBoxPath = clearRegionDrawable.getBorderBoxPath()
          if (borderBoxPath != null) {
            renderNodeCanvas.clipOutPath(borderBoxPath)
          } else {
            renderNodeCanvas.clipOutRect(clearRegionDrawable.borderBoxRect)
          }

          renderNodeCanvas.drawPaint(shadowPaint)
          endRecording()
        }
      }

      // We actually draw the render node into our canvas and clip out the
      // padding
      with(canvas) {
        save()

        val paddingBoxPath = background.getPaddingBoxPath()
        if (paddingBoxPath != null) {
          canvas.clipPath(paddingBoxPath)
        } else {
          canvas.clipRect(background.getPaddingBoxRect())
        }
        // This positions the render node properly since we padded it
        canvas.translate(padding / 2f, padding / 2f)
        drawRenderNode(renderNode)
        restore()
      }
    }
  }

  private fun getClearRegionBorderRadii(
      spread: Int,
      background: CSSBackgroundDrawable,
  ): BorderRadiusStyle {
    val computedBorderRadii = background.computedBorderRadius
    val borderWidth = background.getDirectionAwareBorderInsets()

    val topLeftRadius = computedBorderRadii.topLeft
    val topRightRadius = computedBorderRadii.topRight
    val bottomLeftRadius = computedBorderRadii.bottomLeft
    val bottomRightRadius = computedBorderRadii.bottomRight

    val innerTopLeftRadius = background.getInnerBorderRadius(topLeftRadius, borderWidth.left)
    val innerTopRightRadius = background.getInnerBorderRadius(topRightRadius, borderWidth.right)
    val innerBottomRightRadius =
        background.getInnerBorderRadius(bottomRightRadius, borderWidth.right)
    val innerBottomLeftRadius = background.getInnerBorderRadius(bottomLeftRadius, borderWidth.left)

    val spreadWithDirection = -spread.toFloat()
    return BorderRadiusStyle(
        topLeft =
            LengthPercentage(
                adjustRadiusForSpread(innerTopLeftRadius, spreadWithDirection),
                LengthPercentageType.POINT),
        topRight =
            LengthPercentage(
                adjustRadiusForSpread(innerTopRightRadius, spreadWithDirection),
                LengthPercentageType.POINT),
        bottomLeft =
            LengthPercentage(
                adjustRadiusForSpread(innerBottomLeftRadius, spreadWithDirection),
                LengthPercentageType.POINT),
        bottomRight =
            LengthPercentage(
                adjustRadiusForSpread(innerBottomRightRadius, spreadWithDirection),
                LengthPercentageType.POINT),
    )
  }
}
