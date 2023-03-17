/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;
import com.facebook.yoga.YogaUnit;
import com.facebook.yoga.YogaValue;

public class DimensionPropConverter {

  @Nullable
  public static YogaValue getDimension(@Nullable Object value) {
    if (value == null) {
      return null;
    }

    if (value instanceof Double) {
      return new YogaValue(((Double) value).floatValue(), YogaUnit.POINT);
    }

    if (value instanceof String) {
      return YogaValue.parse((String) value);
    }

    throw new JSApplicationCausedNativeException(
        "DimensionValue: the value must be a number or string.");
  }
}
