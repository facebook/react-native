/*
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public enum YogaNodeType {
  DEFAULT(0),
  TEXT(1);

  private final int mIntValue;

  YogaNodeType(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaNodeType fromInt(int value) {
    switch (value) {
      case 0: return DEFAULT;
      case 1: return TEXT;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
