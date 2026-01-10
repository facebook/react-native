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

public sealed class BackgroundImageLayer {
  public class GradientLayer internal constructor(private val gradient: Gradient) : BackgroundImageLayer() {
    public fun getShader(width: Float, height: Float): Shader = gradient.getShader(width, height)
  }

  public class URLImageLayer(public val uri: String) : BackgroundImageLayer()

  public companion object {
    public fun parse(backgroundImageMap: ReadableMap?, context: Context): BackgroundImageLayer? {
      if (backgroundImageMap == null) {
        return null
      }

      if (!backgroundImageMap.hasKey("type") || backgroundImageMap.getType("type") != ReadableType.String) {
        return null
      }

      return when (backgroundImageMap.getString("type")) {
        "linear-gradient" -> {
          val gradient = LinearGradient.parse(backgroundImageMap, context) ?: return null
          GradientLayer(gradient)
        }
        "radial-gradient" -> {
          val gradient = RadialGradient.parse(backgroundImageMap, context) ?: return null
          GradientLayer(gradient)
        }
        "url" -> {
          val uri = backgroundImageMap.getString("uri") ?: return null
          URLImageLayer(uri)
        }
        else -> null
      }
    }
  }
}
