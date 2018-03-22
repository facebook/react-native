/*
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
  static final YogaValue ZERO = new YogaValue(0, YogaUnit.POINT);
  static final YogaValue AUTO = new YogaValue(YogaConstants.UNDEFINED, YogaUnit.AUTO);

  public final float value;
  public final YogaUnit unit;

  public YogaValue(float value, YogaUnit unit) {
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
      if (unit == otherValue.unit) {
        return unit == YogaUnit.UNDEFINED || Float.compare(value, otherValue.value) == 0;
      }
    }
    return false;
  }

  @Override
  public int hashCode() {
    return Float.floatToIntBits(value) + unit.intValue();
  }

  @Override
  public String toString() {
    switch (unit) {
      case UNDEFINED:
        return "undefined";
      case POINT:
        return Float.toString(value);
      case PERCENT:
        return value + "%";
      case AUTO:
        return "auto";
      default:
        throw new IllegalStateException();
    }
  }

  public static YogaValue parse(String s) {
    if (s == null) {
      return null;
    }

    if ("undefined".equals(s)) {
      return UNDEFINED;
    }

    if ("auto".equals(s)) {
      return AUTO;
    }

    if (s.endsWith("%")) {
      return new YogaValue(Float.parseFloat(s.substring(0, s.length() - 1)), YogaUnit.PERCENT);
    }

    return new YogaValue(Float.parseFloat(s), YogaUnit.POINT);
  }
}
