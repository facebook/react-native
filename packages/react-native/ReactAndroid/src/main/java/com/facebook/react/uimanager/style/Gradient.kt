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
import com.facebook.react.bridge.ReadableMap

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

    linearGradient = LinearGradient(directionMap, colorStops, context)
  }

  fun getShader(bounds: Rect): Shader? {
    return when (type) {
      GradientType.LINEAR_GRADIENT ->
          linearGradient.getShader(bounds.width().toFloat(), bounds.height().toFloat())
    }
  }
}
