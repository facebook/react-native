/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * Native module provides single method {@link #record} which records its single int argument
 * in calls array
 */
public class IntRecordingModule extends BaseJavaModule {

  private final List<Integer> mCalls = new ArrayList<>();
  private final CountDownLatch mCountDownLatch = new CountDownLatch(1);

  @Override
  public String getName() {
    return "Recording";
  }

  @ReactMethod
  public void record(int i) {
    mCalls.add(i);
    mCountDownLatch.countDown();
  }

  public void reset() {
    mCalls.clear();
  }

  public List<Integer> getCalls() {
    return mCalls;
  }

  public void waitForFirstCall() {
    try {
      if (!mCountDownLatch.await(15000, TimeUnit.MILLISECONDS)) {
        throw new RuntimeException("Timed out waiting for first call");
      }
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    }
  }
}
