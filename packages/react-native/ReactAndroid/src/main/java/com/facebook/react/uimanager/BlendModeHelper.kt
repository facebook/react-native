/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.annotation.TargetApi
import android.graphics.BlendMode
import android.os.Build
import android.view.ViewGroup
import androidx.core.view.children
import com.facebook.react.R

@TargetApi(29)
internal object BlendModeHelper {

  /** @see https://www.w3.org/TR/compositing-1/#mix-blend-mode */
  @JvmStatic
  fun parseMixBlendMode(mixBlendMode: String?): BlendMode? {
    if (mixBlendMode == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      return null
    }

    return when (mixBlendMode) {
      "normal" -> null
      "multiply" -> BlendMode.MULTIPLY
      "screen" -> BlendMode.SCREEN
      "overlay" -> BlendMode.OVERLAY
      "darken" -> BlendMode.DARKEN
      "lighten" -> BlendMode.LIGHTEN
      "color-dodge" -> BlendMode.COLOR_DODGE
      "color-burn" -> BlendMode.COLOR_BURN
      "hard-light" -> BlendMode.HARD_LIGHT
      "soft-light" -> BlendMode.SOFT_LIGHT
      "difference" -> BlendMode.DIFFERENCE
      "exclusion" -> BlendMode.EXCLUSION
      "hue" -> BlendMode.HUE
      "saturation" -> BlendMode.SATURATION
      "color" -> BlendMode.COLOR
      "luminosity" -> BlendMode.LUMINOSITY
      else -> throw IllegalArgumentException("Invalid mix-blend-mode name: $mixBlendMode")
    }
  }

  @JvmStatic
  fun needsIsolatedLayer(view: ViewGroup): Boolean =
      view.children.any { it.getTag(R.id.mix_blend_mode) != null }
}
