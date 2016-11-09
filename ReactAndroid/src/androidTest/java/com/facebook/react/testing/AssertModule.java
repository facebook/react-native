/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import javax.annotation.Nullable;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import static junit.framework.Assert.assertFalse;
import static junit.framework.Assert.assertTrue;

/**
 * NativeModule for tests that allows assertions from JS to propagate to Java.
 */
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
