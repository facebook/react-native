/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

public enum LayoutPassReason {
  INITIAL(0),
  ABS_LAYOUT(1),
  STRETCH(2),
  MULTILINE_STRETCH(3),
  FLEX_LAYOUT(4),
  MEASURE(5),
  ABS_MEASURE(6),
  FLEX_MEASURE(7);

  private final int mIntValue;

  LayoutPassReason(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static LayoutPassReason fromInt(int value) {
    switch (value) {
      case 0: return INITIAL;
      case 1: return ABS_LAYOUT;
      case 2: return STRETCH;
      case 3: return MULTILINE_STRETCH;
      case 4: return FLEX_LAYOUT;
      case 5: return MEASURE;
      case 6: return ABS_MEASURE;
      case 7: return FLEX_MEASURE;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
