/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

public enum YogaPositionType {
  STATIC(0),
  RELATIVE(1),
  ABSOLUTE(2);

  private final int mIntValue;

  YogaPositionType(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaPositionType fromInt(int value) {
    switch (value) {
      case 0: return STATIC;
      case 1: return RELATIVE;
      case 2: return ABSOLUTE;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
