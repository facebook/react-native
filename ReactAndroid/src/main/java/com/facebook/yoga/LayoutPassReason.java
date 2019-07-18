/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

public enum LayoutPassReason {
  INITIAL(0),
  MEASURE(1),
  ABS_MEASURE(2),
  FLEX(3),
  ABS_LAYOUT(4),
  STRETCH(5),
  MULTILINE_STRETCH(6);

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
      case 1: return MEASURE;
      case 2: return ABS_MEASURE;
      case 3: return FLEX;
      case 4: return ABS_LAYOUT;
      case 5: return STRETCH;
      case 6: return MULTILINE_STRETCH;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
