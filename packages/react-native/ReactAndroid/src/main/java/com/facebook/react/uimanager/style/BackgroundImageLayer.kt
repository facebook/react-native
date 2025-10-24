/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.content.Context
import android.graphics.Shader
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

public class BackgroundImageLayer() {
  private lateinit var gradient: Gradient

  private constructor(gradient: Gradient) : this() {
    this.gradient = gradient
  }

  public companion object {
    public fun parse(gradientMap: ReadableMap?, context: Context): BackgroundImageLayer? {
      if (gradientMap == null) {
        return null
      }
      val gradient = parseGradient(gradientMap, context) ?: return null
      return BackgroundImageLayer(gradient)
    }

    private fun parseGradient(gradientMap: ReadableMap, context: Context): Gradient? {
      if (!gradientMap.hasKey("type") || gradientMap.getType("type") != ReadableType.String) {
        return null
      }

      return when (gradientMap.getString("type")) {
        "linear-gradient" -> LinearGradient.parse(gradientMap, context)
        "radial-gradient" -> RadialGradient.parse(gradientMap, context)
        else -> null
      }
    }
  }

  public fun getShader(width: Float, height: Float): Shader = gradient.getShader(width, height)
}
