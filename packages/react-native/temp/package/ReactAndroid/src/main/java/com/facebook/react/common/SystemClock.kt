/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import android.os.SystemClock

/**
 * Detour for System.currentTimeMillis and System.nanoTime calls so that they can be mocked out in
 * tests.
 */
public object SystemClock {
  @JvmStatic public fun currentTimeMillis(): Long = System.currentTimeMillis()

  @JvmStatic public fun nanoTime(): Long = System.nanoTime()

  @JvmStatic public fun uptimeMillis(): Long = SystemClock.uptimeMillis()
}
