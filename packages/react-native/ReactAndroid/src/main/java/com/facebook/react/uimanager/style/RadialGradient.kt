/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import ColorStop
import ColorStopUtils
import android.content.Context
import android.graphics.RadialGradient as AndroidRadialGradient
import android.graphics.Matrix
import android.graphics.Shader
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.FloatUtil
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil.dpToPx
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sqrt

internal class RadialGradient(
  shapeString: String,
  private val sizeMap: ReadableMap?,
  private val positionMap: ReadableMap?,
  private val colorStopsArray: ReadableArray,
  private val context: Context
) {
  private enum class Shape {
    CIRCLE,
    ELLIPSE;
    
    companion object {
      fun fromString(value: String): Shape {
        return when (value.lowercase()) {
          "circle" -> CIRCLE
          "ellipse" -> ELLIPSE
          else -> ELLIPSE
        }
      }
    }
  }

  private enum class SizeKeyword {
    CLOSEST_SIDE,
    FARTHEST_SIDE,
    CLOSEST_CORNER,
    FARTHEST_CORNER;

    companion object {
      fun fromString(value: String?): SizeKeyword {
        return when (value?.lowercase()) {
          "closest-side" -> CLOSEST_SIDE
          "farthest-side" -> FARTHEST_SIDE
          "closest-corner" -> CLOSEST_CORNER
          else -> FARTHEST_CORNER
        }
      }
    }
  }

  private data class GradientSize(
    val sizeType: SizeType,
    val value: Any
  ) {
    enum class SizeType {
      KEYWORD,
      DIMENSIONS
    }

    data class Dimensions(
      val x: LengthPercentage,
      val y: LengthPercentage
    )
  }

  private class Position(
    val top: LengthPercentage? = null,
    val left: LengthPercentage? = null,
    val right: LengthPercentage? = null,
    val bottom: LengthPercentage? = null
  )

  private val shape: Shape = Shape.fromString(shapeString)
  private val isCircle: Boolean = shape == Shape.CIRCLE

  private val position: Position = run {
    val defaultPosition = Position(
      top = LengthPercentage(50f, LengthPercentageType.PERCENT),
      left = LengthPercentage(50f, LengthPercentageType.PERCENT)
    )

    if (positionMap == null) {
      return@run defaultPosition
    }

    var top: LengthPercentage? = null
    var left: LengthPercentage? = null
    var right: LengthPercentage? = null
    var bottom: LengthPercentage? = null

    if (positionMap.hasKey("top")) {
      val rawTop = positionMap.getDynamic("top")
      top = LengthPercentage.setFromDynamic(rawTop)
    } else if (positionMap.hasKey("bottom")) {
      val rawBottom = positionMap.getDynamic("bottom")
      bottom = LengthPercentage.setFromDynamic(rawBottom)
    } else {
      return@run defaultPosition
    }

    if (positionMap.hasKey("left")) {
      val rawLeft = positionMap.getDynamic("left")
      left = LengthPercentage.setFromDynamic(rawLeft)
    } else if (positionMap.hasKey("right")) {
      val rawRight = positionMap.getDynamic("right")
      right = LengthPercentage.setFromDynamic(rawRight)
    } else {
      return@run defaultPosition
    }

    Position(top, left, right, bottom)
  }

  private val size: GradientSize = run {
    if (sizeMap == null) {
      return@run GradientSize(
        GradientSize.SizeType.KEYWORD,
        SizeKeyword.FARTHEST_CORNER
      )
    }

    if (sizeMap.hasKey("keyword")) {
      val keywordString = sizeMap.getString("keyword")
      val keyword = SizeKeyword.fromString(keywordString)
      return@run GradientSize(
        GradientSize.SizeType.KEYWORD,
        keyword
      )
    }

    if (sizeMap.hasKey("x") && sizeMap.hasKey("y")) {
      val xDynamic = sizeMap.getDynamic("x")
      val yDynamic = sizeMap.getDynamic("y")
      val x = LengthPercentage.setFromDynamic(xDynamic)
      val y = LengthPercentage.setFromDynamic(yDynamic)

      if (x != null && y != null) {
        return@run GradientSize(
          GradientSize.SizeType.DIMENSIONS,
          GradientSize.Dimensions(x, y)
        )
      }
    }

    GradientSize(
      GradientSize.SizeType.KEYWORD,
      SizeKeyword.FARTHEST_CORNER
    )
  }

  private val colorStops: ArrayList<ColorStop> = run {
    val stops = ArrayList<ColorStop>(colorStopsArray.size())
    for (i in 0 until colorStopsArray.size()) {
      val colorStop = colorStopsArray.getMap(i) ?: continue
      val color: Int? =
        when {
          !colorStop.hasKey("color") || colorStop.isNull("color") -> {
            null
          }

          colorStop.getType("color") == ReadableType.Map -> {
            ColorPropConverter.getColor(colorStop.getMap("color"), context)
          }

          else -> colorStop.getInt("color")
        }

      val position = LengthPercentage.setFromDynamic(colorStop.getDynamic("position"))
      stops.add(ColorStop(color, position))
    }
    stops
  }

  fun getShader(width: Float, height: Float): Shader {
    var centerX: Float = width / 2f
    var centerY: Float = height / 2f
    
    if (position.top != null) {
      centerY =
        if (position.top.type == LengthPercentageType.PERCENT)
          position.top.resolve(height)
        else
          position.top.resolve(height).dpToPx()
    } else if (position.bottom != null) {
      centerY =
        if (position.bottom.type == LengthPercentageType.PERCENT)
          height - position.bottom.resolve(height)
        else
          height - position.bottom.resolve(height).dpToPx()
    }

    if (position.left != null) {
      centerX =
        if (position.left.type == LengthPercentageType.PERCENT)
          position.left.resolve(width)
        else
          position.left.resolve(width).dpToPx()
    } else if (position.right != null) {
      centerX =
        if (position.right.type == LengthPercentageType.PERCENT)
          width - position.right.resolve(width)
        else
          width - position.right.resolve(width).dpToPx()
    }

    val (radiusX, radiusY) = calculateRadius(centerX, centerY, width, height)

    val finalStops = ColorStopUtils.getFixedColorStops(colorStops, max(radiusX, radiusY))
    val colors = IntArray(finalStops.size)
    val positions = FloatArray(finalStops.size)

    finalStops.forEachIndexed { i, colorStop ->
      val color = colorStop.color
      if (color != null && colorStop.position != null) {
        colors[i] = color
        positions[i] = colorStop.position
      }
    }

    val shader = AndroidRadialGradient(
      centerX,
      centerY,
      radiusX,
      colors,
      positions,
      Shader.TileMode.CLAMP
    )

    // If not a circle and radiusX != radiusY, apply transformation to make it elliptical
    if (!isCircle && !FloatUtil.floatsEqual(radiusX, radiusY)) {
      val matrix = Matrix()
      matrix.setScale(1f, radiusY / radiusX, centerX, centerY)
      shader.setLocalMatrix(matrix)
    }

    return shader
  }

  private fun radiusToSide(
    centerX: Float,
    centerY: Float,
    width: Float,
    height: Float,
    sizeKeyword: SizeKeyword
  ): Pair<Float, Float> {
    val radiusXFromLeftSide = centerX
    val radiusYFromTopSide = centerY
    val radiusXFromRightSide = width - centerX
    val radiusYFromBottomSide = height - centerY
    val radiusX: Float
    val radiusY: Float

    if (sizeKeyword == SizeKeyword.CLOSEST_SIDE) {
      radiusX = min(radiusXFromLeftSide, radiusXFromRightSide)
      radiusY = min(radiusYFromTopSide, radiusYFromBottomSide)
    } else { // FARTHEST_SIDE
      radiusX = max(radiusXFromLeftSide, radiusXFromRightSide)
      radiusY = max(radiusYFromTopSide, radiusYFromBottomSide)
    }

    if (isCircle) {
      val radius = if (sizeKeyword == SizeKeyword.CLOSEST_SIDE) {
        min(radiusX, radiusY)
      } else {
        max(radiusX, radiusY)
      }
      return Pair(radius, radius)
    }

    return Pair(radiusX, radiusY)
  }

  private fun calculateEllipseRadius(
    offsetX: Float,
    offsetY: Float,
    aspectRatio: Float
  ): Pair<Float, Float> {
    if (aspectRatio == 0f || !aspectRatio.isFinite()) {
      return Pair(0f, 0f)
    }

    // Ellipse that passes through a point formula: (x-h)^2/a^2 + (y-k)^2/b^2 = 1
    // a = semi major axis length
    // b = semi minor axis length = a / aspectRatio
    // x - h = offsetX
    // y - k = offsetY
    val a = sqrt(offsetX * offsetX + offsetY * offsetY * aspectRatio * aspectRatio)
    return Pair(a, a / aspectRatio)
  }

  private fun radiusToCorner(
    centerX: Float,
    centerY: Float,
    width: Float,
    height: Float,
    sizeKeyword: SizeKeyword
  ): Pair<Float, Float> {
    val corners = arrayOf(
      Pair(0f, 0f),           // top-left
      Pair(width, 0f),        // top-right
      Pair(width, height),    // bottom-right
      Pair(0f, height)        // bottom-left
    )

    var cornerIndex = 0
    var distance = sqrt(
      (centerX - corners[cornerIndex].first).pow(2) +
        (centerY - corners[cornerIndex].second).pow(2)
    )
    val isClosestCorner = sizeKeyword == SizeKeyword.CLOSEST_CORNER

    for (i in 1 until corners.size) {
      val newDistance = sqrt(
        (centerX - corners[i].first).pow(2) +
          (centerY - corners[i].second).pow(2)
      )
      if (isClosestCorner) {
        if (newDistance < distance) {
          distance = newDistance
          cornerIndex = i
        }
      } else {
        if (newDistance > distance) {
          distance = newDistance
          cornerIndex = i
        }
      }
    }

    if (isCircle) {
      return Pair(distance, distance)
    }

    // https://www.w3.org/TR/css-images-3/#typedef-radial-size
    // Aspect ratio of corner size ellipse is same as the respective side size ellipse
    val sideKeyword = if (isClosestCorner) SizeKeyword.CLOSEST_SIDE else SizeKeyword.FARTHEST_SIDE
    val sideRadius = radiusToSide(centerX, centerY, width, height, sideKeyword)

    // Calculate ellipse radii based on the aspect ratio of the side ellipse
    return calculateEllipseRadius(
      corners[cornerIndex].first - centerX,
      corners[cornerIndex].second - centerY,
      sideRadius.first / sideRadius.second
    )
  }

  private fun calculateRadius(
    centerX: Float,
    centerY: Float,
    width: Float,
    height: Float
  ): Pair<Float, Float> {
    if (size.sizeType == GradientSize.SizeType.KEYWORD) {
      return when (val keyword = size.value as SizeKeyword) {
          SizeKeyword.CLOSEST_SIDE, SizeKeyword.FARTHEST_SIDE -> {
            radiusToSide(centerX, centerY, width, height, keyword)
          }

          SizeKeyword.CLOSEST_CORNER, SizeKeyword.FARTHEST_CORNER -> {
            radiusToCorner(centerX, centerY, width, height, keyword)
          }
      }
    } else {
      val dimensions = size.value as GradientSize.Dimensions
      val radiusX =
        if (dimensions.x.type == LengthPercentageType.PERCENT)
          dimensions.x.resolve(width)
        else
          dimensions.x.resolve(width).dpToPx()
      val radiusY =
        if (dimensions.y.type == LengthPercentageType.PERCENT)
          dimensions.y.resolve(height)
        else
          dimensions.y.resolve(height).dpToPx()

      return if (isCircle) {
        val radius = max(radiusX, radiusY)
        Pair(radius, radius)
      } else {
        Pair(radiusX, radiusY)
      }
    }
  }
}
