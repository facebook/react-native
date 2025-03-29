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
import com.facebook.react.bridge.ReadableType

public class BackgroundImageLayer(gradientMap: ReadableMap?, context: Context) {
  private val gradient: Gradient? = parseGradient(gradientMap, context)

  private fun parseGradient(gradientMap: ReadableMap?, context: Context): Gradient? {
    if (gradientMap == null) return null
    if (!gradientMap.hasKey("type") || gradientMap.getType("type") != ReadableType.String) return null

    return when (gradientMap.getString("type")) {
      "linear-gradient" -> LinearGradient.parse(gradientMap, context)
      "radial-gradient" -> RadialGradient.parse(gradientMap, context)
      else -> null
    }
  }

  public fun getShader(bounds: Rect): Shader? =
    gradient?.getShader(bounds.width().toFloat(), bounds.height().toFloat())
}
