/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation;

/**
 * Enum representing the different view properties that can be used when animating layout for view
 * creation.
 */
/* package */ enum AnimatedPropertyType {
  OPACITY,
  SCALE_X,
  SCALE_Y,
  SCALE_XY;

  public static AnimatedPropertyType fromString(String name) {
    switch (name) {
      case "opacity":
        return OPACITY;
      case "scaleX":
        return SCALE_X;
      case "scaleY":
        return SCALE_Y;
      case "scaleXY":
        return SCALE_XY;
      default:
        throw new IllegalArgumentException("Unsupported animated property: " + name);
    }
  }
}
