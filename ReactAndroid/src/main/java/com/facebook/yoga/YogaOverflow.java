/*
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public enum YogaOverflow {
  VISIBLE(0),
  HIDDEN(1),
  SCROLL(2);

  private final int mIntValue;

  YogaOverflow(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaOverflow fromInt(int value) {
    switch (value) {
      case 0: return VISIBLE;
      case 1: return HIDDEN;
      case 2: return SCROLL;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
