/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.Color
import android.graphics.Rect
import android.graphics.Shader
import androidx.core.graphics.ColorUtils
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.FloatUtil
import kotlin.math.ln

private data class ColorStop(
  var color: Int? = null,
  val position: Float
)

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

    val colorStopsRaw =
        gradient.getArray("colorStops")
            ?: throw IllegalArgumentException("Invalid colorStops array")

    val colorStops = processColorTransitionHints(colorStopsRaw, context);
    val colors = IntArray(colorStops.size)
    val positions = FloatArray(colorStops.size)

    colorStops.forEachIndexed { i, colorStop ->
      colorStop.color?.let { color ->
        colors[i] = color
        positions[i] = colorStop.position
      }
    }

    linearGradient = LinearGradient(directionMap, colors, positions)
  }

  public fun getShader(bounds: Rect): Shader? {
    return when (type) {
      GradientType.LINEAR_GRADIENT ->
          linearGradient.getShader(bounds.width().toFloat(), bounds.height().toFloat())
    }
  }

  // Spec: https://drafts.csswg.org/css-images-4/#coloring-gradient-line (Refer transition hint section)
  // Browsers add 9 intermediate color stops when a transition hint is present
  // Algorithm is referred from Blink engine [source](https://github.com/chromium/chromium/blob/a296b1bad6dc1ed9d751b7528f7ca2134227b828/third_party/blink/renderer/core/css/css_gradient_value.cc#L240).
  private fun processColorTransitionHints(originalStopsArray: ReadableArray, context: Context): List<ColorStop> {
    val colorStops = ArrayList<ColorStop>(originalStopsArray.size())
    for (i in 0 until originalStopsArray.size()) {
      val colorStop = originalStopsArray.getMap(i) ?: continue
      val position = colorStop.getDouble("position").toFloat()
      val color = if (colorStop.hasKey("color") && !colorStop.isNull("color")) {
        if (colorStop.getType("color") == ReadableType.Map) {
          ColorPropConverter.getColor(colorStop.getMap("color"), context)
        } else {
          colorStop.getInt("color")
        }
      } else null

      colorStops.add(ColorStop(color, position))
    }

    var indexOffset = 0
    for (i in 1 until colorStops.size - 1) {
      val colorStop = colorStops[i]
      // Skip if not a color hint
      if (colorStop.color != null) {
        continue
      }

      val x = i + indexOffset
      if (x < 1) {
        continue
      }

      val offsetLeft = colorStops[x - 1].position
      val offsetRight = colorStops[x + 1].position
      val offset = colorStop.position
      val leftDist = offset - offsetLeft
      val rightDist = offsetRight - offset
      val totalDist = offsetRight - offsetLeft

      val leftColor = colorStops[x - 1].color ?: Color.TRANSPARENT
      val rightColor = colorStops[x + 1].color ?: Color.TRANSPARENT

      if (FloatUtil.floatsEqual(leftDist, rightDist)) {
        colorStops.removeAt(x)
        --indexOffset
        continue
      }

      if (FloatUtil.floatsEqual(leftDist, .0f)) {
        colorStop.color = rightColor
        continue
      }

      if (FloatUtil.floatsEqual(rightDist, .0f)) {
        colorStop.color = leftColor
        continue
      }

      val newStops = ArrayList<ColorStop>(9)
      // Position the new color stops
      if (leftDist > rightDist) {
        for (y in 0..6) {
          newStops.add(ColorStop(
            position = offsetLeft + leftDist * ((7f + y) / 13f)
          ))
        }
        newStops.add(ColorStop(
          position = offset + rightDist * (1f / 3f)
        ))
        newStops.add(ColorStop(
          position = offset + rightDist * (2f / 3f)
        ))
      } else {
        newStops.add(ColorStop(
          position = offsetLeft + leftDist * (1f / 3f)
        ))
        newStops.add(ColorStop(
          position = offsetLeft + leftDist * (2f / 3f)
        ))
        for (y in 0..6) {
          newStops.add(ColorStop(
            position = offset + rightDist * (y / 13f)
          ))
        }
      }

      // calculate colors for the new color hints.
      // The color weighting for the new color stops will be
      // pointRelativeOffset^(ln(0.5)/ln(hintRelativeOffset)).
      val hintRelativeOffset = leftDist / totalDist
      for (newStop in newStops) {
        val pointRelativeOffset = (newStop.position - offsetLeft) / totalDist
        val weighting = Math.pow(
          pointRelativeOffset.toDouble(),
          ln(0.5) / ln(hintRelativeOffset.toDouble())
        ).toFloat()

        if (weighting.isInfinite() || weighting.isNaN()) {
          continue
        }

        newStop.color = ColorUtils.blendARGB(leftColor, rightColor, weighting)
      }

      // Replace the color hint with new color stops.
      colorStops.removeAt(x)
      colorStops.addAll(x, newStops)
      indexOffset += 8
    }

    return colorStops
  }
}
