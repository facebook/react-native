/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation;

import java.util.Locale;

/**
 * Enum representing the different interpolators that can be used in layout animation configuration.
 */
/* package */ enum InterpolatorType {
  LINEAR,
  EASE_IN,
  EASE_OUT,
  EASE_IN_EASE_OUT,
  SPRING;

  public static InterpolatorType fromString(String name) {
    switch (name.toLowerCase(Locale.US)) {
      case "linear":
        return LINEAR;
      case "easein":
        return EASE_IN;
      case "easeout":
        return EASE_OUT;
      case "easeineaseout":
        return EASE_IN_EASE_OUT;
      case "spring":
        return SPRING;
      default:
        throw new IllegalArgumentException("Unsupported interpolation type : " + name);
    }
  }
}
