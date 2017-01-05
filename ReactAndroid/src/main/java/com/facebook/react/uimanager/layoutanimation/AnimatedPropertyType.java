// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager.layoutanimation;

/**
 * Enum representing the different view properties that can be used when animating layout for
 * view creation.
 */
/* package */ enum AnimatedPropertyType {
  OPACITY("opacity"),
  SCALE_XY("scaleXY");

  private final String mName;

  private AnimatedPropertyType(String name) {
    mName = name;
  }

  public static AnimatedPropertyType fromString(String name) {
    for (AnimatedPropertyType property : AnimatedPropertyType.values()) {
      if (property.toString().equalsIgnoreCase(name)) {
        return property;
      }
    }
    throw new IllegalArgumentException("Unsupported animated property : " + name);
  }

  @Override
  public String toString() {
    return mName;
  }
}
