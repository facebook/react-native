/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.testing;

import static junit.framework.Assert.assertFalse;
import static junit.framework.Assert.assertTrue;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/** NativeModule for tests that allows assertions from JS to propagate to Java. */
public class AssertModule extends BaseJavaModule {

  private boolean mGotSuccess;
  private boolean mGotFailure;
  private @Nullable String mFirstFailureStackTrace;

  @Override
  public String getName() {
    return "Assert";
  }

  @ReactMethod
  public void fail(String stackTrace) {
    if (!mGotFailure) {
      mGotFailure = true;
      mFirstFailureStackTrace = stackTrace;
    }
  }

  @ReactMethod
  public void success() {
    mGotSuccess = true;
  }

  /**
   * Allows the user of this module to verify that asserts are actually being called from JS and
   * that none of them failed.
   */
  public void verifyAssertsAndReset() {
    assertFalse("First failure: " + mFirstFailureStackTrace, mGotFailure);
    assertTrue("Received no assertions during the test!", mGotSuccess);
    mGotFailure = false;
    mGotSuccess = false;
    mFirstFailureStackTrace = null;
  }
}
