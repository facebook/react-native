/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.annotation.TargetApi;
import android.graphics.ColorFilter;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.RenderEffect;
import android.graphics.Shader;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

@TargetApi(31)
class FilterHelper {
  static @Nullable RenderEffect parseFilters(@Nullable ReadableArray filters) {
    if (filters == null) {
      return null;
    }

    RenderEffect chainedEffects = null;
    for (int i = 0; i < filters.size(); i++) {
      ReadableMap filter = filters.getMap(i);
      @Nullable String filterName = filter.getString("name");
      if (filterName == null) {
        continue;
      }

      switch (filterName) {
        case "brightness":
          float brightnessAmount = (float) filter.getDouble("amount");
          ColorFilter brightnessFilter =
              new ColorMatrixColorFilter(getBrightnessColorMatrix(brightnessAmount));
          chainedEffects = chainColorFilterEffect(chainedEffects, brightnessFilter);
          break;
        case "contrast":
          float contrastAmount = (float) filter.getDouble("amount");
          ColorFilter contrastFilter =
              new ColorMatrixColorFilter(getContrastColorMatrix(contrastAmount));
          chainedEffects = chainColorFilterEffect(chainedEffects, contrastFilter);
          break;
        case "grayscale":
          float grayscaleAmount = (float) filter.getDouble("amount");
          ColorFilter grayscaleFilter =
              new ColorMatrixColorFilter(getGrayscaleColorMatrix(grayscaleAmount));
          chainedEffects = chainColorFilterEffect(chainedEffects, grayscaleFilter);
          break;
        case "sepia":
          float sepiaAmount = (float) filter.getDouble("amount");
          ColorFilter sepiaFilter = new ColorMatrixColorFilter(getSepiaColorMatrix(sepiaAmount));
          chainedEffects = chainColorFilterEffect(chainedEffects, sepiaFilter);
          break;
        case "saturate":
          float saturateAmount = (float) filter.getDouble("amount");
          ColorFilter saturateFilter =
              new ColorMatrixColorFilter(getSaturateColorMatrix(saturateAmount));
          chainedEffects = chainColorFilterEffect(chainedEffects, saturateFilter);
          break;
        case "hue-rotate":
          float hueRotateAmount = (float) filter.getDouble("amount");
          ColorFilter hueRotateFilter =
              new ColorMatrixColorFilter(getHueRotateColorMatrix(hueRotateAmount));
          chainedEffects = chainColorFilterEffect(chainedEffects, hueRotateFilter);
          break;
        case "invert":
          float invertAmount = (float) filter.getDouble("amount");
          ColorFilter invertColorFilter =
              new ColorMatrixColorFilter(getInvertColorMatrix(invertAmount));
          chainedEffects = chainColorFilterEffect(chainedEffects, invertColorFilter);
          break;
        case "blur":
          float blurAmount = (float) filter.getDouble("amount");
          chainedEffects = chainBlurFilterEffect(chainedEffects, blurAmount);
          break;
        default:
          throw new IllegalArgumentException("Invalid filter name: " + filterName);
      }
    }

    return chainedEffects;
  }

  // https://www.w3.org/TR/filter-effects-1/#blurEquivalent
  private static RenderEffect chainBlurFilterEffect(
      @Nullable RenderEffect chainedEffects, float std) {
    // Android takes blur amount as a radius while web takes a sigma. This value
    // is used under the hood to convert between them on Android
    // https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/libs/hwui/utils/Blur.cpp
    float sigmaToRadiusRatio = 0.57735f;
    float radius = (std - 0.5f) / sigmaToRadiusRatio;
    float scaledRadius = PixelUtil.toPixelFromDIP(radius);

    return chainedEffects == null
        ? RenderEffect.createBlurEffect(scaledRadius, scaledRadius, Shader.TileMode.DECAL)
        : RenderEffect.createBlurEffect(
            scaledRadius, scaledRadius, chainedEffects, Shader.TileMode.DECAL);
  }

  private static RenderEffect chainColorFilterEffect(
      @Nullable RenderEffect chainedEffects, ColorFilter colorFilter) {
    return chainedEffects == null
        ? RenderEffect.createColorFilterEffect(colorFilter)
        : RenderEffect.createColorFilterEffect(colorFilter, chainedEffects);
  }

  // https://www.w3.org/TR/filter-effects-1/#brightnessEquivalent
  private static ColorMatrix getBrightnessColorMatrix(float amount) {
    ColorMatrix matrix = new ColorMatrix();
    matrix.setScale(amount, amount, amount, 1);

    return matrix;
  }

  // https://www.w3.org/TR/filter-effects-1/#contrastEquivalent
  private static ColorMatrix getContrastColorMatrix(float amount) {
    // Multiply by 255 as Android operates in [0, 255] while the spec operates in [0, 1].
    // This really only matters if there is an intercept that needs to be added
    float intercept = 255 * (-(amount / 2.0f) + 0.5f);

    float[] colorMatrix = {
      amount, 0, 0, 0, intercept, //
      0, amount, 0, 0, intercept, //
      0, 0, amount, 0, intercept, //
      0, 0, 0, 1, 0
    };

    return new ColorMatrix(colorMatrix);
  }

  // https://www.w3.org/TR/filter-effects-1/#grayscaleEquivalent
  private static float[] getGrayscaleColorMatrix(float amount) {
    float inverseAmount = 1 - amount;
    float[] colorMatrix = {
      0.2126f + 0.7874f * inverseAmount,
      0.7152f - 0.7152f * inverseAmount,
      0.0722f - 0.0722f * inverseAmount,
      0,
      0,
      0.2126f - 0.2126f * inverseAmount,
      0.7152f + 0.2848f * inverseAmount,
      0.0722f - 0.0722f * inverseAmount,
      0,
      0,
      0.2126f - 0.2126f * inverseAmount,
      0.7152f - 0.7152f * inverseAmount,
      0.0722f + 0.9278f * inverseAmount,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    };

    return colorMatrix;
  }

  // https://www.w3.org/TR/filter-effects-1/#sepiaEquivalent
  private static float[] getSepiaColorMatrix(float amount) {
    float inverseAmount = 1 - amount;
    float[] colorMatrix = {
      0.393f + 0.607f * inverseAmount,
      0.769f - 0.769f * inverseAmount,
      0.189f - 0.189f * inverseAmount,
      0,
      0,
      0.349f - 0.349f * inverseAmount,
      0.686f + 0.314f * inverseAmount,
      0.168f - 0.168f * inverseAmount,
      0,
      0,
      0.272f - 0.272f * inverseAmount,
      0.534f - 0.534f * inverseAmount,
      0.131f + 0.869f * inverseAmount,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    };

    return colorMatrix;
  }

  // https://www.w3.org/TR/filter-effects-1/#saturateEquivalent
  private static ColorMatrix getSaturateColorMatrix(float amount) {
    ColorMatrix matrix = new ColorMatrix();
    matrix.setSaturation(amount);

    return matrix;
  }

  // https://www.w3.org/TR/filter-effects-1/#huerotateEquivalent
  private static float[] getHueRotateColorMatrix(float amount) {
    double amountRads = Math.toRadians(amount);
    float cos = (float) Math.cos(amountRads);
    float sin = (float) Math.sin(amountRads);
    float[] matrix = {
      0.213f + 0.787f * cos - 0.213f * sin,
      0.715f - 0.715f * cos - 0.715f * sin,
      0.072f - 0.072f * cos + 0.928f * sin,
      0,
      0,
      0.213f - 0.213f * cos + 0.143f * sin,
      0.715f + 0.285f * cos + 0.140f * sin,
      0.072f - 0.072f * cos - 0.283f * sin,
      0,
      0,
      0.213f - 0.213f * cos - 0.787f * sin,
      0.715f - 0.715f * cos + 0.715f * sin,
      0.072f + 0.928f * cos + 0.072f * sin,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    };

    return matrix;
  }

  // https://www.w3.org/TR/filter-effects-1/#invertEquivalent
  private static float[] getInvertColorMatrix(float amount) {
    float slope = 1 - 2 * amount;
    float intercept = amount * 255;
    float[] matrix = {
      slope, 0, 0, 0, intercept, //
      0, slope, 0, 0, intercept, //
      0, 0, slope, 0, intercept, //
      0, 0, 0, 1, 0
    };

    return matrix;
  }
}
