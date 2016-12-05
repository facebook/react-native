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

  private int mIntValue;

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
      default: throw new IllegalArgumentException("Unkown enum value: " + value);
    }
  }
}
