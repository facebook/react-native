// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
