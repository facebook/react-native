/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing.idledetection;

import android.app.Instrumentation;
import android.os.SystemClock;
import androidx.test.InstrumentationRegistry;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.modules.core.ChoreographerCompat;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class ReactIdleDetectionUtil {

  /**
   * Waits for both the UI thread and bridge to be idle. It determines this by waiting for the
   * bridge to become idle, then waiting for the UI thread to become idle, then checking if the
   * bridge is idle again (if the bridge was idle before and is still idle after running the UI
   * thread to idle, then there are no more events to process in either place).
   *
   * <p>Also waits for any Choreographer callbacks to run after the initial sync since things like
   * UI events are initiated from Choreographer callbacks.
   */
  public static void waitForBridgeAndUIIdle(
      ReactBridgeIdleSignaler idleSignaler, final ReactContext reactContext, long timeoutMs) {
    UiThreadUtil.assertNotOnUiThread();

    long startTime = SystemClock.uptimeMillis();
    waitInner(idleSignaler, timeoutMs);

    long timeToWait = Math.max(1, timeoutMs - (SystemClock.uptimeMillis() - startTime));
    waitForChoreographer(timeToWait);
    waitForJSIdle(reactContext);

    timeToWait = Math.max(1, timeoutMs - (SystemClock.uptimeMillis() - startTime));
    waitInner(idleSignaler, timeToWait);
    timeToWait = Math.max(1, timeoutMs - (SystemClock.uptimeMillis() - startTime));
    waitForChoreographer(timeToWait);
  }

  private static void waitForChoreographer(long timeToWait) {
    final int waitFrameCount = 2;
    final CountDownLatch latch = new CountDownLatch(1);
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            final ChoreographerCompat choreographerCompat = ChoreographerCompat.getInstance();
            choreographerCompat.postFrameCallback(
                new ChoreographerCompat.FrameCallback() {

                  private int frameCount = 0;

                  @Override
                  public void doFrame(long frameTimeNanos) {
                    frameCount++;
                    if (frameCount == waitFrameCount) {
                      latch.countDown();
                    } else {
                      choreographerCompat.postFrameCallback(this);
                    }
                  }
                });
          }
        });
    try {
      if (!latch.await(timeToWait, TimeUnit.MILLISECONDS)) {
        throw new RuntimeException("Timed out waiting for Choreographer");
      }
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  private static void waitForJSIdle(ReactContext reactContext) {
    if (!reactContext.hasActiveReactInstance()) {
      return;
    }
    final CountDownLatch latch = new CountDownLatch(1);

    reactContext.runOnJSQueueThread(
        new Runnable() {
          @Override
          public void run() {
            latch.countDown();
          }
        });

    try {
      if (!latch.await(5000, TimeUnit.MILLISECONDS)) {
        throw new RuntimeException("Timed out waiting for JS thread");
      }
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  private static void waitInner(ReactBridgeIdleSignaler idleSignaler, long timeToWait) {
    // TODO gets broken in gradle, do we need it?
    Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
    long startTime = SystemClock.uptimeMillis();
    boolean bridgeWasIdle = false;
    while (SystemClock.uptimeMillis() - startTime < timeToWait) {
      boolean bridgeIsIdle = idleSignaler.isBridgeIdle();
      if (bridgeIsIdle && bridgeWasIdle) {
        return;
      }
      bridgeWasIdle = bridgeIsIdle;
      long newTimeToWait = Math.max(1, timeToWait - (SystemClock.uptimeMillis() - startTime));
      idleSignaler.waitForIdle(newTimeToWait);
      instrumentation.waitForIdleSync();
    }
    throw new RuntimeException("Timed out waiting for bridge and UI idle!");
  }
}
