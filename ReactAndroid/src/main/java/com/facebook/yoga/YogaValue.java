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
public class YogaValue {
  static final YogaValue UNDEFINED = new YogaValue(YogaConstants.UNDEFINED, YogaUnit.UNDEFINED);
  static final YogaValue ZERO = new YogaValue(0, YogaUnit.PIXEL);

  public final float value;
  public final YogaUnit unit;

  YogaValue(float value, YogaUnit unit) {
    this.value = value;
    this.unit = unit;
  }

  @DoNotStrip
  YogaValue(float value, int unit) {
    this(value, YogaUnit.fromInt(unit));
  }

  @Override
  public boolean equals(Object other) {
    if (other instanceof YogaValue) {
      final YogaValue otherValue = (YogaValue) other;
      return value == otherValue.value && unit == otherValue.unit;
    }
    return false;
  }

  @Override
  public int hashCode() {
    return Float.floatToIntBits(value) + unit.intValue();
  }
}
