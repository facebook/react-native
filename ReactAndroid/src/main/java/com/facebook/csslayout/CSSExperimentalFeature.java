/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

public enum CSSExperimentalFeature {
  ROUNDING(0);

  private int mIntValue;

  CSSExperimentalFeature(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static CSSExperimentalFeature fromInt(int value) {
    switch (value) {
      case 0: return ROUNDING;
      default: throw new IllegalArgumentException("Unkown enum value: " + value);
    }
  }
}
