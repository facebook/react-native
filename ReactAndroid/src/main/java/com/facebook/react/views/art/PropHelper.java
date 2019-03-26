/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.art;

import javax.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.ReactStylesDiffMap;

/**
 * Contains static helper methods for accessing props.
 */
/* package */ class PropHelper {

  /**
   * Converts {@link ReadableArray} to an array of {@code float}. Returns newly created array.
   *
   * @return a {@code float[]} if converted successfully, or {@code null} if {@param value} was
   * {@code null}.
   */
  /*package*/ static @Nullable float[] toFloatArray(@Nullable ReadableArray value) {
    if (value != null) {
      float[] result = new float[value.size()];
      toFloatArray(value, result);
      return result;
    }
    return null;
  }

  /**
   * Converts given {@link ReadableArray} to an array of {@code float}. Writes result to the array
   * passed in {@param into}. This method will write to the output array up to the number of items
   * from the input array. If the input array is longer than output the remaining part of the input
   * will not be converted.
   *
   * @param value input array
   * @param into output array
   * @return number of items copied from input to the output array
   */
  /*package*/ static int toFloatArray(ReadableArray value, float[] into) {
    int length = value.size() > into.length ? into.length : value.size();
    for (int i = 0; i < length; i++) {
      into[i] = (float) value.getDouble(i);
    }
    return value.size();
  }
}
