/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.annotation.TargetApi
import android.graphics.ColorFilter
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.RenderEffect
import android.graphics.Shader
import android.graphics.Shader.TileMode
import com.facebook.react.bridge.ReadableArray

@TargetApi(31)
internal object FilterHelper {

  @JvmStatic
  fun parseFilters(filters: ReadableArray?): RenderEffect? {
    filters ?: return null
    var chainedEffects: RenderEffect? = null
    for (i in 0 until filters.size()) {
      val filter = filters.getMap(i)
      val filterName = filter.getString("name") ?: continue
      chainedEffects =
          when (filterName) {
            "brightness" -> {
              val brightnessAmount = filter.getDouble("amount").toFloat()
              val brightnessFilter =
                  ColorMatrixColorFilter(getBrightnessColorMatrix(brightnessAmount))
              chainColorFilterEffect(chainedEffects, brightnessFilter)
            }
            "contrast" -> {
              val contrastAmount = filter.getDouble("amount").toFloat()
              val contrastFilter = ColorMatrixColorFilter(getContrastColorMatrix(contrastAmount))
              chainColorFilterEffect(chainedEffects, contrastFilter)
            }
            "grayscale" -> {
              val grayscaleAmount = filter.getDouble("amount").toFloat()
              val grayscaleFilter = ColorMatrixColorFilter(getGrayscaleColorMatrix(grayscaleAmount))
              chainColorFilterEffect(chainedEffects, grayscaleFilter)
            }
            "sepia" -> {
              val sepiaAmount = filter.getDouble("amount").toFloat()
              val sepiaFilter = ColorMatrixColorFilter(getSepiaColorMatrix(sepiaAmount))
              chainColorFilterEffect(chainedEffects, sepiaFilter)
            }
            "saturate" -> {
              val saturateAmount = filter.getDouble("amount").toFloat()
              val saturateFilter = ColorMatrixColorFilter(getSaturateColorMatrix(saturateAmount))
              chainColorFilterEffect(chainedEffects, saturateFilter)
            }
            "hue-rotate" -> {
              val hueRotateAmount = filter.getDouble("amount").toFloat()
              val hueRotateFilter = ColorMatrixColorFilter(getHueRotateColorMatrix(hueRotateAmount))
              chainColorFilterEffect(chainedEffects, hueRotateFilter)
            }
            "invert" -> {
              val invertAmount = filter.getDouble("amount").toFloat()
              val invertColorFilter = ColorMatrixColorFilter(getInvertColorMatrix(invertAmount))
              chainColorFilterEffect(chainedEffects, invertColorFilter)
            }
            "blur" -> {
              val blurAmount = filter.getDouble("amount").toFloat()
              chainBlurFilterEffect(chainedEffects, blurAmount)
            }
            else -> throw IllegalArgumentException("Invalid filter name: $filterName")
          }
    }
    return chainedEffects
  }

  // https://www.w3.org/TR/filter-effects-1/#blurEquivalent
  private fun chainBlurFilterEffect(chainedEffects: RenderEffect?, std: Float): RenderEffect {
    // Android takes blur amount as a radius while web takes a sigma. This value
    // is used under the hood to convert between them on Android
    // https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/libs/hwui/utils/Blur.cpp
    val sigmaToRadiusRatio = 0.57_735f
    val radius = (std - 0.5f) / sigmaToRadiusRatio
    val scaledRadius = PixelUtil.toPixelFromDIP(radius)
    return if (chainedEffects == null) {
      RenderEffect.createBlurEffect(scaledRadius, scaledRadius, Shader.TileMode.DECAL)
    } else {
      RenderEffect.createBlurEffect(
          scaledRadius, scaledRadius, chainedEffects, Shader.TileMode.DECAL)
    }
  }

  private fun chainColorFilterEffect(
      chainedEffects: RenderEffect?,
      colorFilter: ColorFilter
  ): RenderEffect {
    return if (chainedEffects == null) {
      RenderEffect.createColorFilterEffect(colorFilter)
    } else {
      RenderEffect.createColorFilterEffect(colorFilter, chainedEffects)
    }
  }

  // https://www.w3.org/TR/filter-effects-1/#brightnessEquivalent
  private fun getBrightnessColorMatrix(amount: Float): ColorMatrix {
    val matrix = ColorMatrix()
    matrix.setScale(amount, amount, amount, 1f)
    return matrix
  }

  // https://www.w3.org/TR/filter-effects-1/#contrastEquivalent
  private fun getContrastColorMatrix(amount: Float): ColorMatrix {
    // Multiply by 255 as Android operates in [0, 255] while the spec operates in [0, 1].
    // This really only matters if there is an intercept that needs to be added
    val intercept = 255 * (-(amount / 2.0f) + 0.5f)
    val colorMatrix =
        floatArrayOf(
            amount,
            0f,
            0f,
            0f,
            intercept,
            0f,
            amount,
            0f,
            0f,
            intercept,
            0f,
            0f,
            amount,
            0f,
            intercept,
            0f,
            0f,
            0f,
            1f,
            0f)
    return ColorMatrix(colorMatrix)
  }

  // https://www.w3.org/TR/filter-effects-1/#grayscaleEquivalent
  private fun getGrayscaleColorMatrix(amount: Float): FloatArray {
    val inverseAmount = 1 - amount
    return floatArrayOf(
        0.2_126f + 0.7_874f * inverseAmount,
        0.7_152f - 0.7_152f * inverseAmount,
        0.0_722f - 0.0_722f * inverseAmount,
        0f,
        0f,
        0.2_126f - 0.2_126f * inverseAmount,
        0.7_152f + 0.2_848f * inverseAmount,
        0.0_722f - 0.0_722f * inverseAmount,
        0f,
        0f,
        0.2_126f - 0.2_126f * inverseAmount,
        0.7_152f - 0.7_152f * inverseAmount,
        0.0_722f + 0.9_278f * inverseAmount,
        0f,
        0f,
        0f,
        0f,
        0f,
        1f,
        0f)
  }

  // https://www.w3.org/TR/filter-effects-1/#sepiaEquivalent
  private fun getSepiaColorMatrix(amount: Float): FloatArray {
    val inverseAmount = 1 - amount
    return floatArrayOf(
        0.393f + 0.607f * inverseAmount,
        0.769f - 0.769f * inverseAmount,
        0.189f - 0.189f * inverseAmount,
        0f,
        0f,
        0.349f - 0.349f * inverseAmount,
        0.686f + 0.314f * inverseAmount,
        0.168f - 0.168f * inverseAmount,
        0f,
        0f,
        0.272f - 0.272f * inverseAmount,
        0.534f - 0.534f * inverseAmount,
        0.131f + 0.869f * inverseAmount,
        0f,
        0f,
        0f,
        0f,
        0f,
        1f,
        0f)
  }

  // https://www.w3.org/TR/filter-effects-1/#saturateEquivalent
  private fun getSaturateColorMatrix(amount: Float): ColorMatrix {
    val matrix = ColorMatrix()
    matrix.setSaturation(amount)
    return matrix
  }

  // https://www.w3.org/TR/filter-effects-1/#huerotateEquivalent
  private fun getHueRotateColorMatrix(amount: Float): FloatArray {
    val amountRads = Math.toRadians(amount.toDouble())
    val cos = Math.cos(amountRads).toFloat()
    val sin = Math.sin(amountRads).toFloat()
    return floatArrayOf(
        0.213f + 0.787f * cos - 0.213f * sin,
        0.715f - 0.715f * cos - 0.715f * sin,
        0.072f - 0.072f * cos + 0.928f * sin,
        0f,
        0f,
        0.213f - 0.213f * cos + 0.143f * sin,
        0.715f + 0.285f * cos + 0.140f * sin,
        0.072f - 0.072f * cos - 0.283f * sin,
        0f,
        0f,
        0.213f - 0.213f * cos - 0.787f * sin,
        0.715f - 0.715f * cos + 0.715f * sin,
        0.072f + 0.928f * cos + 0.072f * sin,
        0f,
        0f,
        0f,
        0f,
        0f,
        1f,
        0f)
  }

  // https://www.w3.org/TR/filter-effects-1/#invertEquivalent
  private fun getInvertColorMatrix(amount: Float): FloatArray {
    val slope = 1 - 2 * amount
    val intercept = amount * 255
    return floatArrayOf(
        slope,
        0f,
        0f,
        0f,
        intercept,
        0f,
        slope,
        0f,
        0f,
        intercept,
        0f,
        0f,
        slope,
        0f,
        intercept,
        0f,
        0f,
        0f,
        1f,
        0f)
  }
}
