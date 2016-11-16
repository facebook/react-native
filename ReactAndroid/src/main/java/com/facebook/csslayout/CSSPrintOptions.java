/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

public enum CSSPrintOptions {
  LAYOUT(1),
  STYLE(2),
  CHILDREN(4);

  private int mIntValue;

  CSSPrintOptions(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static CSSPrintOptions fromInt(int value) {
    switch (value) {
      case 1: return LAYOUT;
      case 2: return STYLE;
      case 4: return CHILDREN;
      default: throw new IllegalArgumentException("Unkown enum value: " + value);
    }
  }
}
