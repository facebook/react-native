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
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

internal class Gradient(gradient: ReadableMap?, context: Context) {
  private enum class GradientType {
    LINEAR_GRADIENT,
    RADIAL_GRADIENT
  }

  private val type: GradientType
  private val linearGradient: LinearGradient?
  private val radialGradient: RadialGradient?

  init {
    gradient ?: throw IllegalArgumentException("Gradient cannot be null")

    val typeString = gradient.getString("type")
    type =
      when (typeString) {
        "linearGradient" -> GradientType.LINEAR_GRADIENT
        "radialGradient" -> GradientType.RADIAL_GRADIENT
        else -> throw IllegalArgumentException("Unsupported gradient type: $typeString")
      }

    val colorStops =
      gradient.getArray("colorStops")
        ?: throw IllegalArgumentException("Invalid colorStops array")
    when (type) {
      GradientType.LINEAR_GRADIENT -> {
        val directionMap =
          gradient.getMap("direction")
            ?: throw IllegalArgumentException("Gradient must have direction")
        linearGradient = LinearGradient(directionMap, colorStops, context)
        radialGradient = null
      }
      GradientType.RADIAL_GRADIENT -> {
        val shape = gradient.getString("shape") ?: "ellipse"
        val size = if (gradient.hasKey("size")) {
          if (gradient.getType("size") == ReadableType.String) {
            val sizeKeyword = gradient.getString("size") ?: "farthest-corner"
            val sizeMap = Arguments.createMap()
            sizeMap.putString("keyword", sizeKeyword)
            sizeMap
          } else {
            gradient.getMap("size")
          }
        } else {
          null
        }
        val positionMap = gradient.getMap("position")
        radialGradient = RadialGradient(shape, size, positionMap, colorStops, context)
        linearGradient = null
      }
    }
  }

    fun getShader(bounds: Rect): Shader? {
      return when (type) {
        GradientType.LINEAR_GRADIENT ->
          linearGradient?.getShader(bounds.width().toFloat(), bounds.height().toFloat())

        GradientType.RADIAL_GRADIENT ->
          radialGradient?.getShader(bounds.width().toFloat(), bounds.height().toFloat())
      }
    }
}
