/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing.idledetection;

import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * Utility class that uses {@link NotThreadSafeBridgeIdleDebugListener} interface to allow callers
 * to wait for the bridge to be idle.
 */
public class ReactBridgeIdleSignaler implements NotThreadSafeBridgeIdleDebugListener {

  // Starts at 1 since bridge starts idle. The logic here is that the semaphore is only acquirable
  // if the bridge is idle.
  private final Semaphore mBridgeIdleSemaphore = new Semaphore(1);

  private volatile boolean mIsBridgeIdle = true;

  @Override
  public void onTransitionToBridgeIdle() {
    mIsBridgeIdle = true;
    mBridgeIdleSemaphore.release();
  }

  @Override
  public void onBridgeDestroyed() {
    // Do nothing
  }

  @Override
  public void onTransitionToBridgeBusy() {
    mIsBridgeIdle = false;
    try {
      if (!mBridgeIdleSemaphore.tryAcquire(15000, TimeUnit.MILLISECONDS)) {
        throw new RuntimeException(
            "Timed out waiting to acquire the test idle listener semaphore. Deadlock?");
      }
    } catch (InterruptedException e) {
      throw new RuntimeException("Got interrupted", e);
    }
  }

  public boolean isBridgeIdle() {
    return mIsBridgeIdle;
  }

  public boolean waitForIdle(long millis) {
    try {
      if (mBridgeIdleSemaphore.tryAcquire(millis, TimeUnit.MILLISECONDS)) {
        mBridgeIdleSemaphore.release();
        return true;
      }
      return false;
    } catch (InterruptedException e) {
      throw new RuntimeException("Got interrupted", e);
    }
  }
}
