/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.facebook.react.uimanager

import android.annotation.TargetApi
import android.graphics.BlendMode
import android.graphics.Paint

import java.lang.IllegalArgumentException


@TargetApi(29)
internal object MixBlendModeHelper {

  @JvmStatic
  public fun parseMixBlendMode(mixBlendMode: String?): Paint? {
    mixBlendMode ?: return null
    val p = Paint()

    when (mixBlendMode) {
      "normal" -> {}
      "multiply" -> p.blendMode = BlendMode.MULTIPLY
      "screen" -> p.blendMode = BlendMode.SCREEN
      "overlay" -> p.blendMode = BlendMode.OVERLAY
      "darken" -> p.blendMode = BlendMode.DARKEN
      "lighten" -> p.blendMode = BlendMode.LIGHTEN
      "color-dodge" -> p.blendMode = BlendMode.COLOR_DODGE
      "color-burn" -> p.blendMode = BlendMode.COLOR_BURN
      "hard-light" -> p.blendMode = BlendMode.HARD_LIGHT
      "soft-light" -> p.blendMode = BlendMode.SOFT_LIGHT
      "difference" -> p.blendMode = BlendMode.DIFFERENCE
      "exclusion" -> p.blendMode = BlendMode.EXCLUSION
      "hue" -> p.blendMode = BlendMode.HUE
      "saturation" -> p.blendMode = BlendMode.SATURATION
      "color" -> p.blendMode = BlendMode.COLOR
      "luminosity" -> p.blendMode = BlendMode.LUMINOSITY
      else -> throw IllegalArgumentException("Invalid mix-blend-mode name: $mixBlendMode")
    }

    return p
  }
}
