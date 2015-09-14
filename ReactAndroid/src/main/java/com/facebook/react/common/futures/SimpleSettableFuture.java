/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.common.futures;

import javax.annotation.Nullable;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * A super simple Future-like class that can safely notify another Thread when a value is ready.
 * Does not support setting errors or canceling.
 */
public class SimpleSettableFuture<T> {

  private final CountDownLatch mReadyLatch = new CountDownLatch(1);
  private volatile @Nullable T mResult;

  /**
   * Sets the result. If another thread has called {@link #get}, they will immediately receive the
   * value. Must only be called once.
   */
  public void set(T result) {
    if (mReadyLatch.getCount() == 0) {
      throw new RuntimeException("Result has already been set!");
    }
    mResult = result;
    mReadyLatch.countDown();
  }

  /**
   * Wait up to the timeout time for another Thread to set a value on this future. If a value has
   * already been set, this method will return immediately.
   *
   * NB: For simplicity, we catch and wrap InterruptedException. Do NOT use this class if you
   * are in the 1% of cases where you actually want to handle that.
   */
  public @Nullable T get(long timeoutMS) {
    try {
      if (!mReadyLatch.await(timeoutMS, TimeUnit.MILLISECONDS)) {
        throw new TimeoutException();
      }
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    }
    return mResult;
  }

  public static class TimeoutException extends RuntimeException {

    public TimeoutException() {
      super("Timed out waiting for future");
    }
  }
}
