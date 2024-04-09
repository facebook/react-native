/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.annotation.TargetApi
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.RenderEffect
import android.graphics.Shader
import android.graphics.Shader.TileMode
import com.facebook.react.bridge.ReadableArray

@TargetApi(31)
internal object FilterHelper {

  @JvmStatic
  public fun parseFilters(filters: ReadableArray?): RenderEffect? {
    filters ?: return null
    var chainedEffects: RenderEffect? = null
    for (i in 0 until filters.size()) {
      val filter = filters.getMap(i)
      val filterName = filter.getString("name") ?: continue
      val amount = filter.getDouble("amount").toFloat()

      chainedEffects =
          when (filterName) {
            "brightness" -> createBrightnessEffect(amount, chainedEffects)
            "contrast" -> createContrastEffect(amount, chainedEffects)
            "grayscale" -> createGrayscaleEffect(amount, chainedEffects)
            "sepia" -> createSepiaEffect(amount, chainedEffects)
            "saturate" -> createSaturateEffect(amount, chainedEffects)
            "hue-rotate" -> createHueRotateEffect(amount, chainedEffects)
            "invert" -> createInvertEffect(amount, chainedEffects)
            "blur" -> createBlurEffect(amount, chainedEffects)
            else -> throw IllegalArgumentException("Invalid filter name: $filterName")
          }
    }
    return chainedEffects
  }

  // https://www.w3.org/TR/filter-effects-1/#blurEquivalent
  public fun createBlurEffect(sigma: Float, chainedEffects: RenderEffect? = null): RenderEffect? {
    if (sigma <= 0.5) {
      return null
    }

    // Android takes blur amount as a radius while web takes a sigma. This value
    // is used under the hood to convert between them on Android
    // https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/libs/hwui/jni/RenderEffect.cpp
    val sigmaToRadiusRatio = 0.57_735f
    val radius = (PixelUtil.toPixelFromDIP(sigma) - 0.5f) / sigmaToRadiusRatio
    return if (chainedEffects == null) {
      RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.DECAL)
    } else {
      RenderEffect.createBlurEffect(radius, radius, chainedEffects, Shader.TileMode.DECAL)
    }
  }

  // https://www.w3.org/TR/filter-effects-1/#brightnessEquivalent
  public fun createBrightnessEffect(
      amount: Float,
      chainedEffects: RenderEffect? = null
  ): RenderEffect {
    val matrix = ColorMatrix()
    matrix.setScale(amount, amount, amount, 1f)
    return createColorMatrixEffect(matrix, chainedEffects)
  }

  // https://www.w3.org/TR/filter-effects-1/#contrastEquivalent
  public fun createContrastEffect(
      amount: Float,
      chainedEffects: RenderEffect? = null
  ): RenderEffect {
    // Multiply by 255 as Android operates in [0, 255] while the spec operates in [0, 1].
    // This really only matters if there is an intercept that needs to be added
    val intercept = 255 * (-(amount / 2.0f) + 0.5f)
    val matrix =
        ColorMatrix(
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
                0f))
    return createColorMatrixEffect(matrix, chainedEffects)
  }

  // https://www.w3.org/TR/filter-effects-1/#grayscaleEquivalent
  public fun createGrayscaleEffect(
      amount: Float,
      chainedEffects: RenderEffect? = null
  ): RenderEffect {
    val inverseAmount = 1 - amount
    val matrix =
        ColorMatrix(
            floatArrayOf(
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
                0f))
    return createColorMatrixEffect(matrix, chainedEffects)
  }

  // https://www.w3.org/TR/filter-effects-1/#sepiaEquivalent
  public fun createSepiaEffect(amount: Float, chainedEffects: RenderEffect? = null): RenderEffect {
    val inverseAmount = 1 - amount
    val matrix =
        ColorMatrix(
            floatArrayOf(
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
                0f))
    return createColorMatrixEffect(matrix, chainedEffects)
  }

  // https://www.w3.org/TR/filter-effects-1/#saturateEquivalent
  public fun createSaturateEffect(
      amount: Float,
      chainedEffects: RenderEffect? = null
  ): RenderEffect {
    val matrix = ColorMatrix()
    matrix.setSaturation(amount)
    return createColorMatrixEffect(matrix, chainedEffects)
  }

  // https://www.w3.org/TR/filter-effects-1/#huerotateEquivalent
  public fun createHueRotateEffect(
      amount: Float,
      chainedEffects: RenderEffect? = null
  ): RenderEffect {
    val amountRads = Math.toRadians(amount.toDouble())
    val cos = Math.cos(amountRads).toFloat()
    val sin = Math.sin(amountRads).toFloat()
    val matrix =
        ColorMatrix(
            floatArrayOf(
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
                0f))
    return createColorMatrixEffect(matrix, chainedEffects)
  }

  // https://www.w3.org/TR/filter-effects-1/#invertEquivalent
  public fun createInvertEffect(amount: Float, chainedEffects: RenderEffect? = null): RenderEffect {
    val slope = 1 - 2 * amount
    val intercept = amount * 255
    val matrix =
        ColorMatrix(
            floatArrayOf(
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
                0f))
    return createColorMatrixEffect(matrix, chainedEffects)
  }

  private fun createColorMatrixEffect(
      colorMatrix: ColorMatrix,
      chainedEffects: RenderEffect? = null
  ): RenderEffect {
    return if (chainedEffects == null) {
      RenderEffect.createColorFilterEffect(ColorMatrixColorFilter(colorMatrix))
    } else {
      RenderEffect.createColorFilterEffect(ColorMatrixColorFilter(colorMatrix), chainedEffects)
    }
  }
}
