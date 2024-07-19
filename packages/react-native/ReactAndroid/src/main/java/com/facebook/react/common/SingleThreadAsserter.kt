/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import com.facebook.infer.annotation.Assertions

/** Simple class for asserting that operations only run on a single thread. */
public class SingleThreadAsserter {
  private var thread: Thread? = null

  public fun assertNow() {
    val currentThread = Thread.currentThread()
    if (thread == null) {
      thread = currentThread
    }
    Assertions.assertCondition(thread == currentThread)
  }
}
