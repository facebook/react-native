/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.graphics.LinearGradient
import android.graphics.Rect
import android.graphics.Shader
import com.facebook.react.bridge.ReadableMap

public class Gradient(gradient: ReadableMap?) {
  private enum class GradientType {
    LINEAR_GRADIENT
  }

  private val type: GradientType
  private var startX: Float = 0f
  private var startY: Float = 0f
  private var endX: Float = 0f
  private var endY: Float = 0f
  private val colors: IntArray
  private val positions: FloatArray

  init {
    gradient ?: throw IllegalArgumentException("Gradient cannot be null")

    val typeString = gradient.getString("type")
    type =
        when (typeString) {
          "linearGradient" -> GradientType.LINEAR_GRADIENT
          else -> throw IllegalArgumentException("Unsupported gradient type: $typeString")
        }

    gradient.getMap("start")?.let { start ->
      startX = start.getDouble("x").toFloat()
      startY = start.getDouble("y").toFloat()
    }

    gradient.getMap("end")?.let { end ->
      endX = end.getDouble("x").toFloat()
      endY = end.getDouble("y").toFloat()
    }

    val colorStops =
        gradient.getArray("colorStops")
            ?: throw IllegalArgumentException("Invalid colorStops array")

    val size = colorStops.size()
    colors = IntArray(size)
    positions = FloatArray(size)

    for (i in 0 until size) {
      val colorStop = colorStops.getMap(i)
      colors[i] = colorStop.getInt("color")
      positions[i] = colorStop.getDouble("position").toFloat()
    }
  }

  public fun getShader(bounds: Rect): Shader? {
    return when (type) {
      GradientType.LINEAR_GRADIENT ->
          LinearGradient(
              startX * bounds.width(),
              startY * bounds.height(),
              endX * bounds.width(),
              endY * bounds.height(),
              colors,
              positions,
              Shader.TileMode.CLAMP)
    }
  }
}
