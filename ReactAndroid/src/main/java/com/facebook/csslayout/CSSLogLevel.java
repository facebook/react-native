/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

public enum CSSLogLevel {
  ERROR(0),
  WARN(1),
  INFO(2),
  DEBUG(3),
  VERBOSE(4);

  private int mIntValue;

  CSSLogLevel(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static CSSLogLevel fromInt(int value) {
    switch (value) {
      case 0: return ERROR;
      case 1: return WARN;
      case 2: return INFO;
      case 3: return DEBUG;
      case 4: return VERBOSE;
      default: throw new IllegalArgumentException("Unkown enum value: " + value);
    }
  }
}
