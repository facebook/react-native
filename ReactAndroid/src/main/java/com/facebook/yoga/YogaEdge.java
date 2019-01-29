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
public enum YogaEdge {
  LEFT(0),
  TOP(1),
  RIGHT(2),
  BOTTOM(3),
  START(4),
  END(5),
  HORIZONTAL(6),
  VERTICAL(7),
  ALL(8);

  private final int mIntValue;

  YogaEdge(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaEdge fromInt(int value) {
    switch (value) {
      case 0: return LEFT;
      case 1: return TOP;
      case 2: return RIGHT;
      case 3: return BOTTOM;
      case 4: return START;
      case 5: return END;
      case 6: return HORIZONTAL;
      case 7: return VERTICAL;
      case 8: return ALL;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
