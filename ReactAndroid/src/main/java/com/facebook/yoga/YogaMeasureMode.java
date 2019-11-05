/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public enum YogaMeasureMode {
  UNDEFINED(0),
  EXACTLY(1),
  AT_MOST(2);

  private final int mIntValue;

  YogaMeasureMode(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaMeasureMode fromInt(int value) {
    switch (value) {
      case 0: return UNDEFINED;
      case 1: return EXACTLY;
      case 2: return AT_MOST;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
