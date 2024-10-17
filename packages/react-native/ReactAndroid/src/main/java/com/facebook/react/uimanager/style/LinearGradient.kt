/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.graphics.Shader
import android.graphics.LinearGradient as AndroidLinearGradient
import com.facebook.react.bridge.ReadableMap
import kotlin.math.atan
import kotlin.math.tan

internal class LinearGradient(
  private val orientationMap: ReadableMap,
  private val colors: IntArray,
  private val positions: FloatArray
) {
  private sealed class Orientation {
    public data class Angle(val value: Double) : Orientation()
    public data class Direction(val value: String) : Orientation()
  }

  private val orientation: Orientation = when (val type = orientationMap.getString("type")) {
    "angle" -> {
      val angle = orientationMap.getDouble("value")
      Orientation.Angle(angle)
    }

    "direction" -> {
      val direction = orientationMap.getString("value")
        ?: throw IllegalArgumentException("Direction value cannot be null")
      Orientation.Direction(direction)
    }

    else -> throw IllegalArgumentException("Invalid orientation type: $type")
  }

  public fun getShader(width: Float, height: Float): Shader {
    val angle = when (orientation) {
      is Orientation.Angle -> orientation.value
      is Orientation.Direction -> getAngleFromDirection(
        orientation.value,
        width.toDouble(),
        height.toDouble()
      )
    }
    val (startPoint, endPoint) = endPointsFromAngle(angle, height, width)
    return AndroidLinearGradient(
      startPoint[0],
      startPoint[1],
      endPoint[0],
      endPoint[1],
      colors,
      positions,
      Shader.TileMode.CLAMP
    )
  }

  // Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
  // Refer `using keywords` section
  private fun getAngleFromDirection(direction: String, width: Double, height: Double): Double {
    return when (direction) {
      "to top" -> 0.0
      "to right" -> 90.0
      "to bottom" -> 180.0
      "to left" -> 270.0
      "to top right", "to right top" -> {
        val angleDeg = Math.toDegrees(atan(width / height))
        90 - angleDeg
      }

      "to bottom right", "to right bottom" -> Math.toDegrees(atan(width / height)) + 90
      "to top left", "to left top" -> Math.toDegrees(atan(width / height)) + 270
      "to bottom left", "to left bottom" -> Math.toDegrees(atan(height / width)) + 180
      else -> 180.0
    }
  }

  // Spec: https://www.w3.org/TR/css-images-3/#linear-gradient-syntax
  // Reference: https://github.com/chromium/chromium/blob/d32abbe13f5d52be7127fe25d5b778498165fab8/third_party/blink/renderer/core/css/css_gradient_value.cc#L1057
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

    val endCorner = when {
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
}
