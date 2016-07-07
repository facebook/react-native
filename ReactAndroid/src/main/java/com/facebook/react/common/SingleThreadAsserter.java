/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.common;

import javax.annotation.Nullable;

import com.facebook.infer.annotation.Assertions;

/**
 * Simple class for asserting that operations only run on a single thread.
 */
public class SingleThreadAsserter {
  private @Nullable Thread mThread = null;

  public void assertNow() {
    Thread current = Thread.currentThread();
    if (mThread == null) {
      mThread = current;
    }
    Assertions.assertCondition(mThread == current);
  }
}
