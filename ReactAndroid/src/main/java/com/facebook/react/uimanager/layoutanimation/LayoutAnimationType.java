// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.uimanager.layoutanimation;

/**
 * Enum representing the different animation type that can be specified in layout animation config.
 */
/* package */ enum LayoutAnimationType {
  CREATE("create"),
  UPDATE("update"),
  DELETE("delete");

  private final String mName;

  private LayoutAnimationType(String name) {
    mName = name;
  }

  @Override
  public String toString() {
    return mName;
  }
}
