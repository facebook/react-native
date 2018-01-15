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
public enum YogaOverflow {
  VISIBLE(0),
  HIDDEN(1),
  SCROLL(2);

  private int mIntValue;

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
