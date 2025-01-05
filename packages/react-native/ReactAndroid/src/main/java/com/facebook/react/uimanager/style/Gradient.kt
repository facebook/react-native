/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.Rect
import android.graphics.Shader
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

internal class Gradient(gradient: ReadableMap?, context: Context) {
  private enum class GradientType {
    LINEAR_GRADIENT
  }

  private val type: GradientType
  private val linearGradient: LinearGradient

  init {
    gradient ?: throw IllegalArgumentException("Gradient cannot be null")

    val typeString = gradient.getString("type")
    type =
        when (typeString) {
          "linearGradient" -> GradientType.LINEAR_GRADIENT
          else -> throw IllegalArgumentException("Unsupported gradient type: $typeString")
        }

    val directionMap =
        gradient.getMap("direction")
            ?: throw IllegalArgumentException("Gradient must have direction")

    val colorStops =
        gradient.getArray("colorStops")
            ?: throw IllegalArgumentException("Invalid colorStops array")

    val size = colorStops.size()
    val colors = IntArray(size)
    val positions = FloatArray(size)

    for (i in 0 until size) {
      val colorStop = colorStops.getMap(i) ?: continue
      colors[i] =
          if (colorStop.getType("color") == ReadableType.Map) {
            ColorPropConverter.getColor(colorStop.getMap("color"), context)
          } else {
            colorStop.getInt("color")
          }
      positions[i] = colorStop.getDouble("position").toFloat()
    }

    linearGradient = LinearGradient(directionMap, colors, positions)
  }

  public fun getShader(bounds: Rect): Shader? {
    return when (type) {
      GradientType.LINEAR_GRADIENT ->
          linearGradient.getShader(bounds.width().toFloat(), bounds.height().toFloat())
    }
  }
}
