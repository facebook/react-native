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
public enum YogaWrap {
  NO_WRAP(0),
  WRAP(1),
  WRAP_REVERSE(2);

  private final int mIntValue;

  YogaWrap(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaWrap fromInt(int value) {
    switch (value) {
      case 0: return NO_WRAP;
      case 1: return WRAP;
      case 2: return WRAP_REVERSE;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
