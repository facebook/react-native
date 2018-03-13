/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactMethod;

/**
 * This class is used to verify that some JS integration tests have completed successfully.
 * The JS integration tests can be started from a ReactIntegrationTestCase and upon
 * finishing successfully the {@link JSIntegrationTestChecker#testDone()} method will be called.
 * To verify if the test has completed successfully, call {#link JSIntegrationTestChecker#await()}
 * to wait for the test to run, and {#link JSIntegrationTestChecker#isTestDone()} to check if it
 * completed successfully.
 */
public class JSIntegrationTestChecker extends BaseJavaModule {

  private final CountDownLatch mLatch;

  public JSIntegrationTestChecker() {
    mLatch = new CountDownLatch(1);
  }

  @Override
  public String getName() {
    return "TestModule";
  }

  @ReactMethod
  public void markTestCompleted() {
    mLatch.countDown();
  }

  @ReactMethod
  public void verifySnapshot(Callback callback) {
  }

  public boolean await(long ms) {
    try {
      return mLatch.await(ms, TimeUnit.MILLISECONDS);
    } catch (InterruptedException ignore) {
      return false;
    }
  }

  public boolean isTestDone() {
    return mLatch.getCount() == 0;
  }
}
