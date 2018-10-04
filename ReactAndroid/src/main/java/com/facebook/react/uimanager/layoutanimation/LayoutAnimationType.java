// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.uimanager.layoutanimation;

/**
 * Enum representing the different animation type that can be specified in layout animation config.
 */
/* package */ enum LayoutAnimationType {
  CREATE,
  UPDATE,
  DELETE;

  public static String toString(LayoutAnimationType type) {
    switch (type) {
      case CREATE:
        return "create";
      case UPDATE:
        return "update";
      case DELETE:
        return "delete";
      default:
        throw new IllegalArgumentException("Unsupported LayoutAnimationType: " + type);
    }
  }
}
