/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public enum YogaLogLevel {
  ERROR(0),
  WARN(1),
  INFO(2),
  DEBUG(3),
  VERBOSE(4),
  FATAL(5);

  private final int mIntValue;

  YogaLogLevel(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  @DoNotStrip
  public static YogaLogLevel fromInt(int value) {
    switch (value) {
      case 0: return ERROR;
      case 1: return WARN;
      case 2: return INFO;
      case 3: return DEBUG;
      case 4: return VERBOSE;
      case 5: return FATAL;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
