/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public enum YogaPrintOptions {
  LAYOUT(1),
  STYLE(2),
  CHILDREN(4);

  private final int mIntValue;

  YogaPrintOptions(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaPrintOptions fromInt(int value) {
    switch (value) {
      case 1: return LAYOUT;
      case 2: return STYLE;
      case 4: return CHILDREN;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
