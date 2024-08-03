/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.Nullsafe;

/** Simple class for asserting that operations only run on a single thread. */
@Nullsafe(Nullsafe.Mode.LOCAL)
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
