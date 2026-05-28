/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Matrix
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants

/**
 * Builds a 2D-affine [Matrix] from a `transform` array for the subset of operations Android `View`
 * cannot represent through its individual property setters (specifically `skewX` / `skewY`). Used
 * by [BaseViewManager.setTransformProperty] to apply such transforms via
 * `View.setAnimationMatrix` on Android Q+.
 */
public object SkewMatrixHelper {

  /**
   * Returns true only when [transforms] both contains a `skewX` / `skewY` operation and is fully
   * representable as a 2D-affine [Matrix] (see [isAffine2DTransform]) — i.e. the case
   * [BaseViewManager.setTransformProperty] applies via `View.setAnimationMatrix` on Android Q+.
   */
  @JvmStatic
  public fun hasAffine2DSkewTransform(transforms: ReadableArray): Boolean =
      hasSkewTransform(transforms) && isAffine2DTransform(transforms)

  internal fun hasSkewTransform(transforms: ReadableArray): Boolean {
    if (isRawMatrixShorthand(transforms)) return false
    for (i in 0 until transforms.size()) {
      if (transforms.getType(i) != ReadableType.Map) continue
      val map = transforms.getMap(i) ?: continue
      val type = firstKey(map) ?: continue
      if (type == "skewX" || type == "skewY") return true
    }
    return false
  }

  /**
   * Returns true if [transforms] contains only operations representable by a Skia [Matrix] in 2D:
   * `rotate` / `rotateZ`, `scale`, `scaleX` / `scaleY`, `translate` / `translateX` / `translateY`
   * with zero Z, `skewX`, `skewY`. Returns false for `matrix`, `perspective`, `rotateX`, `rotateY`,
   * a `translate` with a non-zero Z component, and the raw 16-element matrix shorthand used by
   * Fabric LayoutAnimations.
   */
  internal fun isAffine2DTransform(transforms: ReadableArray): Boolean {
    if (isRawMatrixShorthand(transforms)) return false
    for (i in 0 until transforms.size()) {
      if (transforms.getType(i) != ReadableType.Map) continue
      val map = transforms.getMap(i) ?: continue
      val type = firstKey(map) ?: continue
      when (type) {
        "matrix",
        "perspective",
        "rotateX",
        "rotateY" -> return false
        "translate" -> {
          val value = map.getArray(type)
          if (value != null &&
              value.size() > 2 &&
              value.getType(2) == ReadableType.Number &&
              value.getDouble(2) != 0.0) {
            return false
          }
        }
      }
    }
    return true
  }

  /**
   * Builds a [Matrix] in pixel coordinates by walking [transforms] left-to-right and applying each
   * operation via `Matrix.preX` around the resolved pivot. Pivot is the view center; if
   * [transformOrigin] is set, it overrides per-axis (Number values are DIP, "P%" strings are
   * P/100 of the view dimension; Z is ignored).
   *
   * Composition is pre-multiplication: when the resulting matrix is applied to a point, the
   * rightmost (last) array entry is applied first. Matches CSS / iOS conventions and the
   * left-to-right-iteration / right-multiply contract of [MatrixMathHelper.multiplyInto] used by
   * [TransformHelper.processTransform].
   */
  @JvmStatic
  public fun buildAffine2DMatrix(
      transforms: ReadableArray,
      viewWidthDip: Float,
      viewHeightDip: Float,
      transformOrigin: ReadableArray?,
  ): Matrix {
    val pivotXPx: Float
    val pivotYPx: Float
    if (transformOrigin == null) {
      pivotXPx = PixelUtil.toPixelFromDIP(viewWidthDip / 2f)
      pivotYPx = PixelUtil.toPixelFromDIP(viewHeightDip / 2f)
    } else {
      pivotXPx =
          PixelUtil.toPixelFromDIP(
              resolveOriginAxis(transformOrigin, 0, viewWidthDip, viewWidthDip / 2f))
      pivotYPx =
          PixelUtil.toPixelFromDIP(
              resolveOriginAxis(transformOrigin, 1, viewHeightDip, viewHeightDip / 2f))
    }

    val matrix = Matrix()
    for (i in 0 until transforms.size()) {
      if (transforms.getType(i) != ReadableType.Map) continue
      val map = transforms.getMap(i) ?: continue
      val type = firstKey(map) ?: continue
      when (type) {
        "rotate",
        "rotateZ" ->
            matrix.preRotate(
                Math.toDegrees(convertToRadians(map, type)).toFloat(), pivotXPx, pivotYPx)
        "scale" -> {
          val s = map.getDouble(type).toFloat()
          matrix.preScale(s, s, pivotXPx, pivotYPx)
        }
        "scaleX" -> matrix.preScale(map.getDouble(type).toFloat(), 1f, pivotXPx, pivotYPx)
        "scaleY" -> matrix.preScale(1f, map.getDouble(type).toFloat(), pivotXPx, pivotYPx)
        "skewX" ->
            matrix.preSkew(
                Math.tan(convertToRadians(map, type)).toFloat(), 0f, pivotXPx, pivotYPx)
        "skewY" ->
            matrix.preSkew(
                0f, Math.tan(convertToRadians(map, type)).toFloat(), pivotXPx, pivotYPx)
        "translate" -> {
          val value = map.getArray(type)
          if (value != null && value.size() >= 1) {
            val tx = parseTranslateValue(value, 0, viewWidthDip)
            val ty = if (value.size() > 1) parseTranslateValue(value, 1, viewHeightDip) else 0.0
            matrix.preTranslate(
                PixelUtil.toPixelFromDIP(tx.toFloat()), PixelUtil.toPixelFromDIP(ty.toFloat()))
          }
        }
        "translateX" ->
            matrix.preTranslate(
                PixelUtil.toPixelFromDIP(parseScalarTranslate(map, type, viewWidthDip).toFloat()),
                0f)
        "translateY" ->
            matrix.preTranslate(
                0f,
                PixelUtil.toPixelFromDIP(parseScalarTranslate(map, type, viewHeightDip).toFloat()))
      }
    }
    return matrix
  }

  private fun isRawMatrixShorthand(transforms: ReadableArray): Boolean =
      transforms.size() == 16 && transforms.getType(0) == ReadableType.Number

  private fun firstKey(map: ReadableMap): String? {
    val iter = map.keySetIterator()
    return if (iter.hasNextKey()) iter.nextKey() else null
  }

  private fun resolveOriginAxis(
      origin: ReadableArray,
      axis: Int,
      dimensionDip: Float,
      defaultDip: Float,
  ): Float {
    if (origin.size() <= axis) return defaultDip
    return when (origin.getType(axis)) {
      ReadableType.Number -> origin.getDouble(axis).toFloat()
      ReadableType.String -> {
        val part = origin.getString(axis) ?: return defaultDip
        if (!part.endsWith("%")) return defaultDip
        try {
          (part.dropLast(1).toDouble() * dimensionDip / 100.0).toFloat()
        } catch (_: NumberFormatException) {
          defaultDip
        }
      }
      else -> defaultDip
    }
  }

  private fun parseTranslateValue(value: ReadableArray, index: Int, dimensionDip: Float): Double {
    if (value.getType(index) != ReadableType.String) {
      return value.getDouble(index)
    }
    val s = value.getString(index) ?: return 0.0
    return parseTranslateString(s, dimensionDip)
  }

  private fun parseScalarTranslate(map: ReadableMap, key: String, dimensionDip: Float): Double {
    if (map.getType(key) != ReadableType.String) {
      return map.getDouble(key)
    }
    val s = map.getString(key) ?: return 0.0
    return parseTranslateString(s, dimensionDip)
  }

  // Mirrors TransformHelper.parseTranslateValue; kept local for the same reason as
  // convertToRadians below.
  private fun parseTranslateString(s: String, dimensionDip: Float): Double {
    return try {
      if (s.endsWith("%")) {
        s.dropLast(1).toDouble() * dimensionDip / 100.0
      } else {
        s.toDouble()
      }
    } catch (_: NumberFormatException) {
      FLog.w(ReactConstants.TAG, "Invalid translate value: $s")
      0.0
    }
  }

  // Mirrors TransformHelper.convertToRadians; kept local so this helper is self-contained.
  private fun convertToRadians(transformMap: ReadableMap, key: String): Double {
    if (transformMap.getType(key) != ReadableType.String) {
      return transformMap.getDouble(key)
    }
    var stringValue = transformMap.getString(key) ?: return 0.0
    var inRadians = true
    if (stringValue.endsWith("rad")) {
      stringValue = stringValue.dropLast(3)
    } else if (stringValue.endsWith("deg")) {
      inRadians = false
      stringValue = stringValue.dropLast(3)
    }
    val value = stringValue.toDouble()
    return if (inRadians) value else MatrixMathHelper.degreesToRadians(value)
  }
}
