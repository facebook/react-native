/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

/**
 * Enum representing the different interpolators that can be used in layout animation configuration.
 */
public enum class InterpolatorType {
  LINEAR,
  EASE_IN,
  EASE_OUT,
  EASE_IN_EASE_OUT,
  SPRING;

  public companion object {
    @JvmStatic
    public fun fromString(name: String): InterpolatorType {
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
