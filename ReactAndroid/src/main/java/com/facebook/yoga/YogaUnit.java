/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public enum YogaUnit {
  UNDEFINED(0),
  PIXEL(1),
  PERCENT(2);

  private int mIntValue;

  YogaUnit(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaUnit fromInt(int value) {
    switch (value) {
      case 0: return UNDEFINED;
      case 1: return PIXEL;
      case 2: return PERCENT;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
