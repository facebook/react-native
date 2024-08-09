/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common;

import com.facebook.infer.annotation.Nullsafe;

/**
 * Detour for System.currentTimeMillis and System.nanoTime calls so that they can be mocked out in
 * tests.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
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
