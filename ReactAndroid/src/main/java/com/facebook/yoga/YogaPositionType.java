/*
 *  Copyright (c) Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public enum YogaPositionType {
  RELATIVE(0),
  ABSOLUTE(1);

  private final int mIntValue;

  YogaPositionType(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaPositionType fromInt(int value) {
    switch (value) {
      case 0: return RELATIVE;
      case 1: return ABSOLUTE;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
