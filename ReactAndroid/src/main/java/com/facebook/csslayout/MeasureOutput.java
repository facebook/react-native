/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

/**
 * Helpers for building measure output value.
 */
public class MeasureOutput {

  public static long make(float width, float height) {
    return make((int) width, (int) height);
  }

  public static long make(int width, int height) {
    return ((long) width) << 32 | ((long) height);
  }

  public static int getWidth(long measureOutput) {
    return (int) (0xFFFFFFFF & (measureOutput >> 32));
  }

  public static int getHeight(long measureOutput) {
    return (int) (0xFFFFFFFF & measureOutput);
  }
}
