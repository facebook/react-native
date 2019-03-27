/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public enum YogaUnit {
  UNDEFINED(0),
  POINT(1),
  PERCENT(2),
  AUTO(3);

  private final int mIntValue;

  YogaUnit(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaUnit fromInt(int value) {
    switch (value) {
      case 0: return UNDEFINED;
      case 1: return POINT;
      case 2: return PERCENT;
      case 3: return AUTO;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
