/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

public enum CSSFlexDirection {
  COLUMN(0),
  COLUMN_REVERSE(1),
  ROW(2),
  ROW_REVERSE(3);

  private int mIntValue;

  CSSFlexDirection(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static CSSFlexDirection fromInt(int value) {
    switch (value) {
      case 0: return COLUMN;
      case 1: return COLUMN_REVERSE;
      case 2: return ROW;
      case 3: return ROW_REVERSE;
      default: throw new IllegalArgumentException("Unkown enum value: " + value);
    }
  }
}
