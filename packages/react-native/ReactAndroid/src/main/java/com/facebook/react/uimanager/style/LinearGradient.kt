/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.LinearGradient as AndroidLinearGradient
import android.graphics.Shader
import androidx.core.graphics.ColorUtils
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.FloatUtil
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil
import kotlin.math.atan
import kotlin.math.ln
import kotlin.math.sqrt
import kotlin.math.tan

private data class ColorStop(var color: Int? = null, val position: LengthPercentage? = null)

private data class ProcessedColorStop(var color: Int? = null, val position: Float? = null)

internal class LinearGradient(
    directionMap: ReadableMap,
    private val colorStopsArray: ReadableArray,
    private val context: Context
) {
  private sealed class Direction {
    data class Angle(val value: Double) : Direction()

    enum class Keywords {
      TO_TOP_RIGHT,
      TO_BOTTOM_RIGHT,
      TO_TOP_LEFT,
      TO_BOTTOM_LEFT
    }

    data class Keyword(val value: Keywords) : Direction()
  }

  private val direction: Direction =
      when (val type = directionMap.getString("type")) {
        "angle" -> {
          val angle = directionMap.getDouble("value")
          Direction.Angle(angle)
        }

        "keyword" -> {
          val keyword =
              when (directionMap.getString("value")) {
                "to top right" -> Direction.Keywords.TO_TOP_RIGHT
                "to bottom right" -> Direction.Keywords.TO_BOTTOM_RIGHT
                "to top left" -> Direction.Keywords.TO_TOP_LEFT
                "to bottom left" -> Direction.Keywords.TO_BOTTOM_LEFT
                else ->
                    throw IllegalArgumentException(
                        "Invalid linear gradient direction keyword: ${directionMap.getString("value")}")
              }
          Direction.Keyword(keyword)
        }

        else -> throw IllegalArgumentException("Invalid direction type: $type")
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
    val angle =
        when (direction) {
          is Direction.Angle -> direction.value
          is Direction.Keyword ->
              getAngleForKeyword(direction.value, width.toDouble(), height.toDouble())
        }
    val (startPoint, endPoint) = endPointsFromAngle(angle, height, width)
    val dx = endPoint[0] - startPoint[0]
    val dy = endPoint[1] - startPoint[1]
    val gradientLineLength = sqrt(dx * dx + dy * dy)
    val processedColorStops = getFixedColorStops(colorStops, gradientLineLength)
    val finalStops = processColorTransitionHints(processedColorStops)
    val colors = IntArray(finalStops.size)
    val positions = FloatArray(finalStops.size)

    finalStops.forEachIndexed { i, colorStop ->
      val color = colorStop.color
      if (color != null && colorStop.position != null) {
        colors[i] = color
        positions[i] = colorStop.position
      }
    }
    return AndroidLinearGradient(
        startPoint[0],
        startPoint[1],
        endPoint[0],
        endPoint[1],
        colors,
        positions,
        Shader.TileMode.CLAMP)
  }

  // Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
  // Refer `using keywords` section
  private fun getAngleForKeyword(
      keyword: Direction.Keywords,
      width: Double,
      height: Double
  ): Double {
    return when (keyword) {
      Direction.Keywords.TO_TOP_RIGHT -> {
        val angleDeg = Math.toDegrees(atan(width / height))
        90 - angleDeg
      }
      Direction.Keywords.TO_BOTTOM_RIGHT -> Math.toDegrees(atan(width / height)) + 90
      Direction.Keywords.TO_TOP_LEFT -> Math.toDegrees(atan(width / height)) + 270
      Direction.Keywords.TO_BOTTOM_LEFT -> Math.toDegrees(atan(height / width)) + 180
    }
  }

  // Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
  // Reference:
  // https://github.com/chromium/chromium/blob/d32abbe13f5d52be7127fe25d5b778498165fab8/third_party/blink/renderer/core/css/css_gradient_value.cc#L1057
  private fun endPointsFromAngle(
      angle: Double,
      height: Float,
      width: Float
  ): Pair<FloatArray, FloatArray> {
    var adjustedAngle = angle % 360
    if (adjustedAngle < 0) {
      adjustedAngle += 360
    }

    when (adjustedAngle) {
      0.0 -> return Pair(floatArrayOf(0f, height), floatArrayOf(0f, 0f))
      90.0 -> return Pair(floatArrayOf(0f, 0f), floatArrayOf(width, 0f))
      180.0 -> return Pair(floatArrayOf(0f, 0f), floatArrayOf(0f, height))
      270.0 -> return Pair(floatArrayOf(width, 0f), floatArrayOf(0f, 0f))
    }

    val slope = tan(Math.toRadians((90 - adjustedAngle))).toFloat()
    val perpendicularSlope = -1 / slope

    val halfHeight = height / 2
    val halfWidth = width / 2

    val endCorner =
        when {
          adjustedAngle < 90 -> floatArrayOf(halfWidth, halfHeight)
          adjustedAngle < 180 -> floatArrayOf(halfWidth, -halfHeight)
          adjustedAngle < 270 -> floatArrayOf(-halfWidth, -halfHeight)
          else -> floatArrayOf(-halfWidth, halfHeight)
        }

    val c = endCorner[1] - perpendicularSlope * endCorner[0]
    val endX = c / (slope - perpendicularSlope)
    val endY = perpendicularSlope * endX + c

    val secondPoint = floatArrayOf(halfWidth + endX, halfHeight - endY)
    val firstPoint = floatArrayOf(halfWidth - endX, halfHeight + endY)

    return Pair(firstPoint, secondPoint)
  }

  private fun getFixedColorStops(
      colorStops: ArrayList<ColorStop>,
      gradientLineLength: Float
  ): Array<ProcessedColorStop> {
    val fixedColorStops = Array<ProcessedColorStop>(colorStops.size) { ProcessedColorStop() }
    var hasNullPositions = false
    var maxPositionSoFar =
        resolveColorStopPosition(colorStops[0].position, gradientLineLength) ?: 0f

    for (i in colorStops.indices) {
      val colorStop = colorStops[i]
      var newPosition = resolveColorStopPosition(colorStop.position, gradientLineLength)

      // Step 1:
      // If the first color stop does not have a position,
      // set its position to 0%. If the last color stop does not have a position,
      // set its position to 100%.
      newPosition =
          newPosition
              ?: when (i) {
                0 -> 0f
                colorStops.size - 1 -> 1f
                else -> null
              }

      // Step 2:
      // If a color stop or transition hint has a position
      // that is less than the specified position of any color stop or transition hint
      // before it in the list, set its position to be equal to the
      // largest specified position of any color stop or transition hint before it.
      if (newPosition != null) {
        newPosition = maxOf(newPosition, maxPositionSoFar)
        fixedColorStops[i] = ProcessedColorStop(colorStop.color, newPosition)
        maxPositionSoFar = newPosition
      } else {
        hasNullPositions = true
      }
    }

    // Step 3:
    // If any color stop still does not have a position,
    // then, for each run of adjacent color stops without positions,
    // set their positions so that they are evenly spaced between the preceding and
    // following color stops with positions.
    if (hasNullPositions) {
      var lastDefinedIndex = 0
      for (i in 1 until fixedColorStops.size) {
        val endPosition = fixedColorStops[i].position
        if (endPosition != null) {
          val unpositionedStops = i - lastDefinedIndex - 1
          if (unpositionedStops > 0) {
            val startPosition = fixedColorStops[lastDefinedIndex].position
            if (startPosition != null) {
              val increment = (endPosition - startPosition) / (unpositionedStops + 1)
              for (j in 1..unpositionedStops) {
                fixedColorStops[lastDefinedIndex + j] =
                    ProcessedColorStop(
                        colorStops[lastDefinedIndex + j].color, startPosition + increment * j)
              }
            }
          }
          lastDefinedIndex = i
        }
      }
    }

    return fixedColorStops
  }

  private fun processColorTransitionHints(
      originalStops: Array<ProcessedColorStop>
  ): List<ProcessedColorStop> {
    val colorStops = originalStops.toMutableList()
    var indexOffset = 0

    for (i in 1 until originalStops.size - 1) {
      // Skip if not a color hint
      if (originalStops[i].color != null) {
        continue
      }

      val x = i + indexOffset
      if (x < 1) {
        continue
      }

      val offsetLeft = colorStops[x - 1].position
      val offsetRight = colorStops[x + 1].position
      val offset = colorStops[x].position
      if (offsetLeft == null || offsetRight == null || offset == null) {
        continue
      }
      val leftDist = offset - offsetLeft
      val rightDist = offsetRight - offset
      val totalDist = offsetRight - offsetLeft
      val leftColor = colorStops[x - 1].color
      val rightColor = colorStops[x + 1].color

      if (FloatUtil.floatsEqual(leftDist, rightDist)) {
        colorStops.removeAt(x)
        --indexOffset
        continue
      }

      if (FloatUtil.floatsEqual(leftDist, 0f)) {
        colorStops[x].color = rightColor
        continue
      }

      if (FloatUtil.floatsEqual(rightDist, 0f)) {
        colorStops[x].color = leftColor
        continue
      }

      val newStops = ArrayList<ProcessedColorStop>(9)

      // Position the new color stops
      if (leftDist > rightDist) {
        for (y in 0..6) {
          newStops.add(ProcessedColorStop(null, offsetLeft + leftDist * ((7f + y) / 13f)))
        }
        newStops.add(ProcessedColorStop(null, offset + rightDist * (1f / 3f)))
        newStops.add(ProcessedColorStop(null, offset + rightDist * (2f / 3f)))
      } else {
        newStops.add(ProcessedColorStop(null, offsetLeft + leftDist * (1f / 3f)))
        newStops.add(ProcessedColorStop(null, offsetLeft + leftDist * (2f / 3f)))
        for (y in 0..6) {
          newStops.add(ProcessedColorStop(null, offset + rightDist * (y / 13f)))
        }
      }

      // Calculate colors for the new stops
      val hintRelativeOffset = leftDist / totalDist
      val logRatio = ln(0.5) / ln(hintRelativeOffset)

      for (newStop in newStops) {
        if (newStop.position == null) {
          continue
        }
        val pointRelativeOffset = (newStop.position - offsetLeft) / totalDist
        val weighting = Math.pow(pointRelativeOffset.toDouble(), logRatio).toFloat()

        if (!weighting.isFinite() || weighting.isNaN()) {
          continue
        }

        // Interpolate color using the calculated weighting
        leftColor?.let { left ->
          rightColor?.let { right -> newStop.color = ColorUtils.blendARGB(left, right, weighting) }
        }
      }

      // Replace the color hint with new color stops
      colorStops.removeAt(x)
      colorStops.addAll(x, newStops)
      indexOffset += 8
    }

    return colorStops
  }

  private fun resolveColorStopPosition(
      position: LengthPercentage?,
      gradientLineLength: Float
  ): Float? {
    if (position == null) return null

    return when (position.type) {
      LengthPercentageType.POINT ->
          PixelUtil.toPixelFromDIP(position.resolve(0f)) / gradientLineLength
      LengthPercentageType.PERCENT -> position.resolve(1f)
    }
  }
}
