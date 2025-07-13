/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel

/**
 * Enum representing the different interpolators that can be used in layout animation configuration.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
internal enum class InterpolatorType {
  LINEAR,
  EASE_IN,
  EASE_OUT,
  EASE_IN_EASE_OUT,
  SPRING;

  companion object {
    @JvmStatic
    fun fromString(name: String): InterpolatorType {
      return when (name.lowercase()) {
        "linear" -> LINEAR
        "easein" -> EASE_IN
        "easeout" -> EASE_OUT
        "easeineaseout" -> EASE_IN_EASE_OUT
        "spring" -> SPRING
        else -> throw IllegalArgumentException("Unsupported interpolation type : $name")
      }
    }
  }
}
