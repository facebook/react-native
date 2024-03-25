/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation;

import com.facebook.infer.annotation.Nullsafe;

/**
 * Enum representing the different animation type that can be specified in layout animation config.
 */
/* package */ @Nullsafe(Nullsafe.Mode.LOCAL)
enum LayoutAnimationType {
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
