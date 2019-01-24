/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.yoga;

public class YogaConstants {

  public static final float UNDEFINED = Float.NaN;

  public static boolean isUndefined(float value) {
    return Float.compare(value, UNDEFINED) == 0;
  }

  public static boolean isUndefined(YogaValue value) {
    return value.unit == YogaUnit.UNDEFINED;
  }

  public static float getUndefined() {
    return UNDEFINED;
  }
}
