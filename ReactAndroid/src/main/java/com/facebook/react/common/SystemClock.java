/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.common;

/**
 * Detour for System.currentTimeMillis and System.nanoTime calls so that they can be mocked out in
 * tests.
 */
public class SystemClock {

  public static long currentTimeMillis() {
    return System.currentTimeMillis();
  }

  public static long nanoTime() {
    return System.nanoTime();
  }

  public static long uptimeMillis() {
    return android.os.SystemClock.uptimeMillis();
  }

}
