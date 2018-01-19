/*
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
public enum YogaJustify {
  FLEX_START(0),
  CENTER(1),
  FLEX_END(2),
  SPACE_BETWEEN(3),
  SPACE_AROUND(4),
  SPACE_EVENLY(5);

  private int mIntValue;

  YogaJustify(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaJustify fromInt(int value) {
    switch (value) {
      case 0: return FLEX_START;
      case 1: return CENTER;
      case 2: return FLEX_END;
      case 3: return SPACE_BETWEEN;
      case 4: return SPACE_AROUND;
      case 5:
        return SPACE_EVENLY;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
