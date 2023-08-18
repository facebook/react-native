/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

public enum YogaLayoutType {
  LAYOUT(0),
  MEASURE(1),
  CACHED_LAYOUT(2),
  CACHED_MEASURE(3);

  private final int mIntValue;

  YogaLayoutType(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaLayoutType fromInt(int value) {
    switch (value) {
      case 0: return LAYOUT;
      case 1: return MEASURE;
      case 2: return CACHED_LAYOUT;
      case 3: return CACHED_MEASURE;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
