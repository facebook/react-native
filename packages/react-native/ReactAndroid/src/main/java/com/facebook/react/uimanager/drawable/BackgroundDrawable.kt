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
import android.view.WindowInsetsAnimation.Bounds
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.style.BackgroundImageLayer
import com.facebook.react.uimanager.style.BackgroundPosition
import com.facebook.react.uimanager.style.BackgroundRepeat
import com.facebook.react.uimanager.style.BackgroundRepeatKeyword
import com.facebook.react.uimanager.style.BackgroundSize
import com.facebook.react.uimanager.style.BackgroundSizeKeyword
import com.facebook.react.uimanager.style.BorderInsets
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadius
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.round
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
  private val pathAdjustment = 0.8f
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

  private var backgroundRect: RectF = RectF()
  private var backgroundRenderPath: Path? = null

  var backgroundImageLayers: List<BackgroundImageLayer>? = null
    set(value) {
      if (field != value) {
        field = value
        invalidateSelf()
      }
    }

  var backgroundSize: List<BackgroundSize>? = null
    set(value) {
      if (field != value) {
        field = value
        invalidateSelf()
      }
    }

  var backgroundPosition: List<BackgroundPosition>? = null
    set(value) {
      if (field != value) {
        field = value
        invalidateSelf()
      }
    }

  var backgroundRepeat: List<BackgroundRepeat>? = null
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

    // Draws the View without its border first (with background color fill)
    if (backgroundPaint.alpha != 0) {
      if (computedBorderRadius?.isUniform() == true && borderRadius?.hasRoundedBorders() == true) {
        canvas.drawRoundRect(
          backgroundRect,
          computedBorderRadius?.topLeft?.horizontal?.dpToPx() ?: 0f,
            computedBorderRadius?.topLeft?.vertical?.dpToPx() ?: 0f,
            backgroundPaint)
      } else if (borderRadius?.hasRoundedBorders() != true) {
        canvas.drawRect(backgroundRect, backgroundPaint)
      } else {
        canvas.drawPath(checkNotNull(backgroundRenderPath), backgroundPaint)
      }
    }

    backgroundPaint.alpha = 255
    if (backgroundImageLayers != null && backgroundImageLayers?.isNotEmpty() == true) {

      canvas.save()
      // 1. create a clipping path that matches the border radius.
      val clipPath = Path()
      val cornerRadii =
        floatArrayOf(
          computedBorderRadius?.topLeft?.horizontal?.dpToPx() ?: 0f,
          computedBorderRadius?.topLeft?.vertical?.dpToPx() ?: 0f,
          computedBorderRadius?.topRight?.horizontal?.dpToPx() ?: 0f,
          computedBorderRadius?.topRight?.vertical?.dpToPx() ?: 0f,
          computedBorderRadius?.bottomRight?.horizontal?.dpToPx() ?: 0f,
          computedBorderRadius?.bottomRight?.vertical?.dpToPx() ?: 0f,
          computedBorderRadius?.bottomLeft?.horizontal?.dpToPx() ?: 0f,
          computedBorderRadius?.bottomLeft?.vertical?.dpToPx() ?: 0f)
      clipPath.addRoundRect(backgroundRect, cornerRadii, Path.Direction.CW)
      canvas.clipPath(clipPath)

      // background-origin: padding-box
      val backgroundPositioningArea = RectF(
        bounds.left + (computedBorderInsets?.left ?: 0f),
        bounds.top + (computedBorderInsets?.top ?: 0f),
        bounds.right - (computedBorderInsets?.right ?: 0f),
        bounds.bottom - (computedBorderInsets?.bottom ?: 0f))

      if (backgroundPositioningArea.width() <= 0 || backgroundPositioningArea.height() <= 0) {
        canvas.restore()
        return
      }

      // background-clip: border-box
      val backgroundPaintingArea = bounds;

      backgroundImageLayers?.let { layers ->
        // iterate in reverse to match CSS spec i.e first background image appears closer to user.
        // So we draw in reverse (last drawn in canvas appears closest)
        for (i in layers.indices.reversed()) {
          val backgroundImageLayer = layers[i]
          val size = backgroundSize?.let { it.getOrNull(i % it.size) }
          val repeat = backgroundRepeat?.let { it.getOrNull(i % it.size) }
          val position = backgroundPosition?.let { it.getOrNull(i % it.size) }

          // 2. Calculate the size of a single tile.
          val (tileWidth, tileHeight) =
            calculateBackgroundImageSize(
              backgroundPositioningArea.width(), backgroundPositioningArea.height(), backgroundPositioningArea.width(), backgroundPositioningArea.height(), size, repeat)

          if (tileWidth <= 0 || tileHeight <= 0) {
            continue
          }

          // 3. create a paint with a shader for one tile.
          val tilePaint = Paint(Paint.ANTI_ALIAS_FLAG)
          tilePaint.shader =
            backgroundImageLayer.getShader(RectF(0f, 0f, tileWidth, tileHeight))

          // 4. Calculate the starting position of the first tile.
          val availableSpaceX = backgroundPositioningArea.width() - tileWidth
          val availableSpaceY = backgroundPositioningArea.height() - tileHeight
          var (initialX, initialY) =
            calculateBackgroundPosition(
              availableSpaceX, availableSpaceY, position)
          initialX += backgroundPositioningArea.left;
          initialY += backgroundPositioningArea.top;

          val repeatX = repeat?.x ?: BackgroundRepeatKeyword.Repeat
          val repeatY = repeat?.y ?: BackgroundRepeatKeyword.Repeat
          var xTilesCount = 1;
          var xSpacing = 0f

          var yTilesCount = 1;
          var ySpacing = 0f

          if (repeatX == BackgroundRepeatKeyword.Space) {
            val instanceCount = floor((backgroundPositioningArea.width() / tileWidth))
            if (instanceCount > 1) {
              initialX = backgroundPositioningArea.left;
              val spacing = (backgroundPositioningArea.width() - instanceCount * tileWidth) / (instanceCount - 1)
              val tilesBeforeX = ceil(initialX / (tileWidth + spacing)).toInt()
              val tilesAfterX = (1 + ceil((backgroundPaintingArea.width() - (initialX + tileWidth)) / (tileWidth + spacing))).toInt()
              xTilesCount = tilesBeforeX + tilesAfterX
              initialX -= (tilesBeforeX * (tileWidth + spacing))
              xSpacing = spacing
            } else {
              xTilesCount = 1
            }
          } else if (repeatX == BackgroundRepeatKeyword.Round || repeatX == BackgroundRepeatKeyword.Repeat) {
            val tilesBeforeX = ceil(initialX / tileWidth).toInt()
            val tilesAfterX = ceil((backgroundPaintingArea.width() - initialX) / tileWidth).toInt()
            xTilesCount = tilesBeforeX + tilesAfterX
            initialX -= (tilesBeforeX * tileWidth)
            xSpacing = 0f
          }

          if (repeatY == BackgroundRepeatKeyword.Space) {
            val instanceCount = floor((backgroundPositioningArea.height() / tileHeight))
            if (instanceCount > 1) {
              initialY = backgroundPositioningArea.top;
              val spacing =
                (backgroundPositioningArea.height() - instanceCount * tileHeight) / (instanceCount - 1)
              val tilesBeforeY = ceil(initialY / (tileHeight + spacing)).toInt()
              val tilesAfterY = 1 + ceil((backgroundPaintingArea.height() - (initialY + tileHeight)) / (tileHeight + spacing)).toInt()
              yTilesCount = tilesBeforeY + tilesAfterY
              initialY -= (tilesBeforeY * (tileHeight + spacing))
              ySpacing = spacing
            } else {
              yTilesCount = 1
            }
          } else if (repeatY == BackgroundRepeatKeyword.Round || repeatY == BackgroundRepeatKeyword.Repeat) {
            val tilesBeforeY = ceil(initialY / tileHeight).toInt()
            val tilesAfterY = ceil((backgroundPaintingArea.height() - initialY) / tileHeight).toInt()
            yTilesCount = tilesBeforeY + tilesAfterY
            initialY -= (tilesBeforeY * tileHeight)
            ySpacing = 0f
          }

          var translateX = initialX
          var translateY: Float
          // 5. draw the repeating tiles using translate.
          for (i in 0 until xTilesCount.toInt()) {
            translateY = initialY;
            for (j in 0 until yTilesCount.toInt()) {
              canvas.save()
              canvas.translate(translateX, translateY);
              canvas.drawRect(0f, 0f, tileWidth, tileHeight, tilePaint)
              canvas.restore();
              translateY += tileHeight + ySpacing
            }
            translateX += tileWidth + xSpacing
          }
        }
      }

      // Restore the canvas state, undoing the clipping.
      canvas.restore()
    }

    backgroundPaint.alpha = Color.alpha(backgroundColor)
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

  private fun positionToPixels(lengthPercentage: LengthPercentage, availableSpace: Float): Float =
    if (lengthPercentage.type == LengthPercentageType.PERCENT) {
      lengthPercentage.resolve(availableSpace)
    } else {
      lengthPercentage.resolve(availableSpace).dpToPx()
    }

  private fun calculateBackgroundPosition(
    availableSpaceX: Float,
    availableSpaceY: Float,
    position: BackgroundPosition?
  ): Pair<Float, Float> {
    val translateX =
      when {
        position?.left != null -> positionToPixels(position.left, availableSpaceX)
        position?.right != null -> availableSpaceX - positionToPixels(position.right, availableSpaceX)
        else -> 0.0f // left = 0
      }

    val translateY =
      when {
        position?.top != null -> positionToPixels(position.top, availableSpaceY)
        position?.bottom != null -> availableSpaceY - positionToPixels(position.bottom, availableSpaceY)
        else -> 0.0f // top = 0
      }
    return translateX to translateY
  }

  private fun calculateBackgroundImageSize(
    containerWidth: Float,
    containerHeight: Float,
    imageWidth: Float,
    imageHeight: Float,
    backgroundSize: BackgroundSize?,
    repeat: BackgroundRepeat?
  ): Pair<Float, Float> {
    var finalWidth = imageWidth
    var finalHeight = imageHeight

    // Cover and contain styles have no effect for gradients.
    // So we only check for length percentage
    if (backgroundSize is BackgroundSize.LengthPercentageAuto) {
      val w = backgroundSize.lengthPercentage.x
      val h = backgroundSize.lengthPercentage.y
      if (w != null && h != null) {
        finalWidth = positionToPixels(w, containerWidth)
        finalHeight = positionToPixels(h, containerHeight)
      }
    }

    if (repeat?.x == BackgroundRepeatKeyword.Round && finalWidth > 0) {
      if (containerWidth.rem(finalWidth) != 0f) {
        val numRepeats = round(containerWidth / finalWidth)
        if (numRepeats > 0) {
          finalWidth = containerWidth / numRepeats
        }
      }
    }

    if (repeat?.y == BackgroundRepeatKeyword.Round && finalHeight > 0) {
      if (containerHeight.rem(finalHeight) != 0f) {
        val numRepeats = round(containerHeight / finalHeight)
        if (numRepeats > 0) {
          finalHeight = containerHeight / numRepeats
        }
      }
    }

    return finalWidth to finalHeight
  }

  private fun updatePath() {
    if (!needUpdatePath) {
      return
    }
    needUpdatePath = false

    backgroundRect.set(bounds)

    computedBorderInsets = computeBorderInsets()
    computedBorderRadius =
        borderRadius?.resolve(
            layoutDirection, context, bounds.width().pxToDp(), bounds.height().pxToDp())
    val hasBorder =
        (computedBorderInsets?.left != 0f ||
            computedBorderInsets?.top != 0f ||
            computedBorderInsets?.right != 0f ||
            computedBorderInsets?.bottom != 0f)

    if (computedBorderRadius?.hasRoundedBorders() == true &&
        computedBorderRadius?.isUniform() == false) {
      backgroundRenderPath = backgroundRenderPath ?: Path()
      backgroundRenderPath?.reset()
    }

    /**
     * The background bleeds a bit outside of the borderDrawable. pathAdjustment is used to slightly
     * shrink the rectangle (backgroundRect), ensuring the border can be drawn on top without the
     * gap.
     */
    if (hasBorder && borderRadius?.hasRoundedBorders() == true) {
      backgroundRect.left += pathAdjustment
      backgroundRect.top += pathAdjustment
      backgroundRect.right -= pathAdjustment
      backgroundRect.bottom -= pathAdjustment
    }

    if (borderRadius?.hasRoundedBorders() == true && computedBorderRadius?.isUniform() != true) {

      backgroundRenderPath?.addRoundRect(
          backgroundRect,
          floatArrayOf(
              computedBorderRadius?.topLeft?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.topLeft?.vertical?.dpToPx() ?: 0f,
              computedBorderRadius?.topRight?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.topRight?.vertical?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomRight?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomRight?.vertical?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomLeft?.horizontal?.dpToPx() ?: 0f,
              computedBorderRadius?.bottomLeft?.vertical?.dpToPx() ?: 0f,
          ),
          Path.Direction.CW)
    }
  }
}
