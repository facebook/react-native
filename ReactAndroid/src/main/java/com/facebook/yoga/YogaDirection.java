/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

public enum YogaDirection {
  INHERIT(0),
  LTR(1),
  RTL(2);

  private final int mIntValue;

  YogaDirection(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaDirection fromInt(int value) {
    switch (value) {
      case 0: return INHERIT;
      case 1: return LTR;
      case 2: return RTL;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
