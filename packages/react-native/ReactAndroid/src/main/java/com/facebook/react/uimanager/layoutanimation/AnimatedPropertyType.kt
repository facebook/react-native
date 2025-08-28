/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager.layoutanimation

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel

/**
 * Enum representing the different view properties that can be used when animating layout for view
 * creation.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal enum class AnimatedPropertyType {
  OPACITY,
  SCALE_X,
  SCALE_Y,
  SCALE_XY;

  companion object {
    @JvmStatic
    fun fromString(name: String): AnimatedPropertyType {
      return when (name) {
        "opacity" -> OPACITY
        "scaleX" -> SCALE_X
        "scaleY" -> SCALE_Y
        "scaleXY" -> SCALE_XY
        else -> throw IllegalArgumentException("Unsupported animated property: $name")
      }
    }
  }
}
