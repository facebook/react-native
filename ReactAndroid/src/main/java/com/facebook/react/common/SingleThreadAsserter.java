/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
