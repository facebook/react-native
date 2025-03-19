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

public class BackgroundImageLayer(gradientMap: ReadableMap?, context: Context) {
  private val gradient: Gradient? =
      if (gradientMap != null) {
        try {
          Gradient(gradientMap, context)
        } catch (e: IllegalArgumentException) {
          // Gracefully reject invalid styles
          null
        }
      } else {
        null
      }

  public fun getShader(bounds: Rect): Shader? = gradient?.getShader(bounds)
}
