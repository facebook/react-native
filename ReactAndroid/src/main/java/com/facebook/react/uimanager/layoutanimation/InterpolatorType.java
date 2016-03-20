// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager.layoutanimation;

/**
 * Enum representing the different interpolators that can be used in layout animation configuration.
 */
/* package */ enum InterpolatorType {
  LINEAR("linear"),
  EASE_IN("easeIn"),
  EASE_OUT("easeOut"),
  EASE_IN_EASE_OUT("easeInEaseOut"),
  SPRING("spring");

  private final String mName;

  private InterpolatorType(String name) {
    mName = name;
  }

  public static InterpolatorType fromString(String name) {
    for (InterpolatorType type : InterpolatorType.values()) {
      if (type.toString().equalsIgnoreCase(name)) {
        return type;
      }
    }
    throw new IllegalArgumentException("Unsupported interpolation type : " + name);
  }

  @Override
  public String toString() {
    return mName;
  }
}
